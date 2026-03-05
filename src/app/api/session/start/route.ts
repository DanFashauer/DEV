/**
 * Session Start API Route
 * 
 * POST /api/session/start
 * 
 * Validates BadgeEvent v1 payload from iOS kiosk app and returns session directive.
 * 
 * Flow:
 * 1. Validate BadgeEvent v1 payload
 * 2. Look up badgeUID -> userId mapping
 * 3. Create session
 * 4. Return session directive (LAUNCH_APP, UNLOCK_DEVICE, etc.)
 * 
 * Security:
 * - HMAC-SHA256 request signature verification
 * - Timestamp validation (5-min window)
 * - Replay attack prevention (nonce)
 * - Schema validation
 * - Rate limiting per deviceId + IP
 */

// Force Node.js runtime to access Node crypto module
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { validateAndAuthorizeSessionStart, generateRandomHex } from '@/lib/backend/validation';
import { badgeRegistry } from '@/lib/badgeRegistry';
import { sessionStore, SessionDirective } from '@/lib/sessionStore';
import { appendAuditRecord, recordAuthFailure } from '@/lib/auditLedger';
import { emitSessionStart } from '@/lib/integrations/webhooks/emitter';
import { emitAuthFailure } from '@/lib/integrations/webhooks/emitter';
import { evaluatePolicies } from '@/lib/policy/runtime/evaluate';

/**
 * Simple in-memory rate limiter for session start
 */
const deviceRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(map: Map<string, { count: number; resetTime: number }>, identifier: string): boolean {
  const now = Date.now();
  const record = map.get(identifier);
  
  if (!record || now > record.resetTime) {
    map.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * POST /api/session/start
 */
export async function POST(request: Request) {
  try {
    // Get identifiers for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    
    // Rate limiting - check both device and IP
    if (!checkRateLimit(ipRateLimitMap, clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for IP' },
        { status: 429 }
      );
    }
    
    // Get device ID from body for device-specific rate limiting (after validation)
    let deviceId = 'unknown';
    
    // Get full URL for signature verification
    const url = new URL(request.url);
    const fullUrl = `${url.protocol}//${url.host}${url.pathname}`;
    
    // Parse body
    const body = await request.json();
    
    // Get security headers
    const headers: Record<string, string | undefined> = {
      'x-signature': request.headers.get('x-signature') ?? undefined,
      'x-timestamp': request.headers.get('x-timestamp') ?? undefined,
      'x-nonce': request.headers.get('x-nonce') ?? undefined,
    };
    
    // Validate request
    const validation = await validateAndAuthorizeSessionStart(
      headers,
      body,
      fullUrl,
      'POST'
    );
    
    if (!validation.valid) {
      console.error('[SessionStart] Validation failed:', validation.error);
      // Record auth failure
      await recordAuthFailure(
        validation.error || 'validation_failed',
        { type: 'device', id: deviceId },
        { meta: { reason: validation.error, code: validation.code } }
      );
      // Emit webhook event (best-effort, non-blocking)
      emitAuthFailure({
        deviceId,
        reason: validation.error || 'validation_failed',
        code: validation.code,
        timestamp: new Date().toISOString(),
      }).catch(err => console.error('[Webhook] Failed to emit auth.failure:', err));
      return NextResponse.json(
        { error: validation.error },
        { status: 401 }
      );
    }
    
    const event = validation.event!;
    deviceId = event.device.deviceId;
    
    // Device-specific rate limiting
    if (!checkRateLimit(deviceRateLimitMap, deviceId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for device' },
        { status: 429 }
      );
    }
    
    // Log badge scan event
    console.log('[SessionStart] Badge scan event:', {
      eventId: event.eventId,
      badgeId: event.badge.badgeId,
      readerType: event.reader.readerType,
      deviceId: deviceId,
      timestamp: event.timestamp,
    });
    
    // Step 1: Look up badge UID -> userId mapping
    const badgeMapping = await badgeRegistry.get(event.badge.badgeId);
    
    if (!badgeMapping) {
      console.warn('[SessionStart] Unknown badge:', event.badge.badgeId);
      return NextResponse.json(
        { 
          error: 'Badge not enrolled',
          code: 'BADGE_NOT_ENROLLED',
          hint: 'Contact administrator to enroll your badge',
        },
        { status: 404 }
      );
    }
    
    if (!badgeMapping.active) {
      console.warn('[SessionStart] Inactive badge:', event.badge.badgeId);
      return NextResponse.json(
        { 
          error: 'Badge is deactivated',
          code: 'BADGE_INACTIVE',
          hint: 'Contact administrator to reactivate your badge',
        },
        { status: 403 }
      );
    }
    
    // Update last used timestamp
    await badgeRegistry.updateLastUsed(event.badge.badgeId);
    
    // Record session start in audit ledger (after badge is validated)
    await appendAuditRecord('session.start', { type: 'device', id: deviceId }, {
      target: { type: 'badge', id: event.badge.badgeId },
      meta: { userId: badgeMapping.userId, readerType: event.reader.readerType },
    });
    
    // Step 2: Check if there's an existing active session for this device
    const existingSessions = await sessionStore.getByDeviceId(deviceId);
    const existingActiveSession = existingSessions.find(s => s.status === 'active');
    
    if (existingActiveSession && new Date(existingActiveSession.expiresAt) > new Date()) {
      // Return existing session directive (extend expiry)
      const directive: SessionDirective = {
        sessionId: existingActiveSession.sessionId,
        userId: existingActiveSession.userId,
        nextAction: (existingActiveSession.nextAction as SessionDirective['nextAction']) || 'LAUNCH_APP',
        bundleId: existingActiveSession.bundleId,
        expiresAt: existingActiveSession.expiresAt,
      };
      
      return NextResponse.json({
        success: true,
        session: directive,
        message: 'Existing session extended',
      });
    }
    
    // Step 3: Create new session
    // Get app to launch from persona attributes (if available)
    const defaultBundleId = process.env.DEFAULT_LAUNCH_BUNDLE_ID ?? 'com.example.enterpriseapp';
    
    const session = await sessionStore.create({
      userId: badgeMapping.userId,
      badgeUid: event.badge.badgeId,
      deviceId: deviceId,
      nextAction: 'LAUNCH_APP',
      bundleId: defaultBundleId,
      metadata: {
        employeeId: event.badge.employeeId,
        cardSerialNumber: event.badge.cardSerialNumber,
        readerType: event.reader.readerType,
        locationId: event.context?.locationId,
      },
    });
    
    // Build session directive
    const directive: SessionDirective = {
      sessionId: session.sessionId,
      userId: session.userId,
      nextAction: 'LAUNCH_APP',
      bundleId: session.bundleId,
      expiresAt: session.expiresAt,
    };
    
    console.log('[SessionStart] Session created:', {
      sessionId: session.sessionId,
      userId: session.userId,
      deviceId: deviceId,
      expiresAt: session.expiresAt,
    });
    
    // Emit webhook event (best-effort, non-blocking)
    emitSessionStart({
      sessionId: session.sessionId,
      userId: session.userId,
      deviceId: deviceId,
      badgeId: event.badge.badgeId,
      timestamp: new Date().toISOString(),
    }).catch(err => console.error('[Webhook] Failed to emit session.start:', err));
    
    // Evaluate policies and get actions
    const policyContext = {
      device: { role: 'kiosk', deviceId },
      user: { role: badgeMapping.department || 'user', userId: badgeMapping.userId, name: badgeMapping.userName },
      location: { zone: event.context?.locationId || 'unknown' },
      session: { id: session.sessionId, startedAt: session.createdAt },
    };
    
    const policyActions = evaluatePolicies(policyContext);
    
    // Process policy actions
    for (const action of policyActions) {
      console.log('[Policy] Action triggered:', action.type, action.params);
      // Handle specific action types
      if (action.type === 'set_session_ttl' && action.params?.seconds) {
        // Extend session TTL
        await sessionStore.update(session.sessionId, {
          expiresAt: new Date(Date.now() + action.params.seconds * 1000).toISOString(),
        });
        directive.expiresAt = (await sessionStore.get(session.sessionId))?.expiresAt || directive.expiresAt;
      }
    }
    
    return NextResponse.json({
      success: true,
      session: directive,
      policyActions: policyActions.length > 0 ? policyActions : undefined,
    });
  } catch (error) {
    console.error('[SessionStart] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
