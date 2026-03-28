/**
 * Session Start API Route
 *
 * POST /api/session/start
 *
 * Validates BadgeEvent v1 payload from iOS kiosk app and returns session directive.
 */

// Force Node.js runtime to access Node crypto module
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { validateAndAuthorizeSessionStart } from '@/lib/backend/validation';
import { getBadgeRegistry } from '@/lib/tenant/badgeRegistry';
import { getSessionStore, SessionDirective } from '@/lib/tenant/sessionStore';
import { getEvaluator } from '@/lib/tenant/policyEvaluator';
import { resolveTenantId } from '@/lib/tenant/tenantContext';
import { appendAuditRecord, recordAuthFailure } from '@/lib/auditLedger';
import { emitAuthFailure, emitSessionStart } from '@/lib/integrations/webhooks/emitter';
import { checkDeviceRateLimit, checkIpRateLimit } from './services/rateLimit';
import { getFleetContext, getUEMContext } from './services/posture';
import {
  buildDeniedPolicyInput,
  buildGrantedPolicyInput,
  recordDeniedPolicySideEffects,
} from './services/policy';
import { createDeniedDeviceResponse } from './services/responses';

/**
 * POST /api/session/start
 */
export async function POST(request: Request) {
  try {
    // Resolve tenant ID for multi-tenant isolation
    const tenantId = resolveTenantId(request);
    const badgeRegistry = getBadgeRegistry(tenantId);
    const sessionStore = getSessionStore(tenantId);
    const evaluator = getEvaluator(tenantId);

    // Get identifiers for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // Rate limiting - check both device and IP
    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json({ error: 'Rate limit exceeded for IP' }, { status: 429 });
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
    const validation = await validateAndAuthorizeSessionStart(headers, body, fullUrl, 'POST', tenantId);

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
      }).catch((err) => console.error('[Webhook] Failed to emit auth.failure:', err));
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    const event = validation.event!;
    deviceId = event.device.deviceId;

    // Device-specific rate limiting
    if (!checkDeviceRateLimit(deviceId)) {
      return NextResponse.json({ error: 'Rate limit exceeded for device' }, { status: 429 });
    }

    // Log badge scan event
    console.log('[SessionStart] Badge scan event:', {
      eventId: event.eventId,
      badgeId: event.badge.badgeId,
      readerType: event.reader.readerType,
      deviceId,
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
    const existingActiveSession = existingSessions.find((s) => s.status === 'active');

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

    // Step 3: Check device posture BEFORE creating session
    const [fleetContext, uemContext] = await Promise.all([
      getFleetContext(event.device?.deviceSerial || '', event.device?.deviceId || deviceId),
      getUEMContext(event.device?.deviceId || deviceId),
    ]);

    const isFleetCompliant = fleetContext.status === 'compliant';
    const isUEMCompliant = uemContext.complianceStatus === 'compliant';
    const isDeviceCompliant = isFleetCompliant || isUEMCompliant;

    await appendAuditRecord('session.start', { type: 'device', id: deviceId }, {
      target: { type: 'badge', id: event.badge.badgeId },
      meta: {
        userId: badgeMapping.userId,
        readerType: event.reader.readerType,
        complianceCheck: {
          fleetCompliant: isFleetCompliant,
          uemCompliant: isUEMCompliant,
          overallCompliant: isDeviceCompliant,
        },
      },
    });

    if (!isDeviceCompliant && (fleetContext.enrolled || uemContext.enrolled)) {
      console.log('[SessionStart] Device non-compliant, denying session:', {
        deviceId,
        fleetStatus: fleetContext.status,
        uemStatus: uemContext.complianceStatus,
      });

      await recordAuthFailure('device_non_compliant', { type: 'device', id: deviceId }, {
        meta: {
          reason: 'Device compliance check failed',
          fleetStatus: fleetContext.status,
          uemStatus: uemContext.complianceStatus,
        },
      });

      const { policyContext, riskScore } = await buildDeniedPolicyInput({
        event,
        deviceId,
        badgeMapping,
        uemContext,
        fleetContext,
        isFleetCompliant,
        isDeviceCompliant,
      });

      // Evaluate policies (this will trigger quarantine, SIEM, ITSM actions)
      const policyActions = await evaluator.evaluate(policyContext);

      // Log the policy actions that were triggered
      for (const action of policyActions) {
        console.log('[Policy] Action triggered (non-compliant device):', action.type, action.params);
      }

      recordDeniedPolicySideEffects({
        policyActions,
        deviceId,
        userId: badgeMapping.userId,
        badgeId: event.badge.badgeId,
        userName: badgeMapping.userName,
        riskScore: riskScore.riskScore,
      });

      // Return denial response with decision receipt
      return createDeniedDeviceResponse({
        isFleetCompliant,
        isUEMCompliant,
        fleetContext,
        uemContext,
        policyActions,
      });
    }

    // Step 4: Create new session (device is compliant or no posture data)
    const defaultBundleId = process.env.DEFAULT_LAUNCH_BUNDLE_ID ?? 'com.example.enterpriseapp';

    const session = await sessionStore.create({
      userId: badgeMapping.userId,
      badgeUid: event.badge.badgeId,
      deviceId,
      nextAction: 'LAUNCH_APP',
      bundleId: defaultBundleId,
      metadata: {
        employeeId: event.badge.employeeId,
        cardSerialNumber: event.badge.cardSerialNumber,
        readerType: event.reader.readerType,
        locationId: event.context?.locationId,
      },
    });

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
      deviceId,
      expiresAt: session.expiresAt,
    });

    // Emit webhook event (best-effort, non-blocking)
    emitSessionStart({
      sessionId: session.sessionId,
      userId: session.userId,
      deviceId,
      badgeId: event.badge.badgeId,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('[Webhook] Failed to emit session.start:', err));

    const grantedPolicyInput = await buildGrantedPolicyInput({
      event,
      deviceId,
      badgeMapping,
      uemContext,
      fleetContext,
      sessionId: session.sessionId,
      sessionCreatedAt: session.createdAt,
    });

    const policyActions = await evaluator.evaluate(grantedPolicyInput.policyContext);

    // Process policy actions
    for (const action of policyActions) {
      console.log('[Policy] Action triggered:', action.type, action.params);
      if (action.type === 'set_session_ttl' && action.params?.seconds) {
        await sessionStore.update(session.sessionId, {
          expiresAt: new Date(Date.now() + action.params.seconds * 1000).toISOString(),
        });
        directive.expiresAt = (await sessionStore.get(session.sessionId))?.expiresAt || directive.expiresAt;
      }
    }

    return NextResponse.json({
      decision: 'ACCESS_GRANTED',
      reason: 'Device compliant and policy allows access',
      success: true,
      session: directive,
      riskScore: grantedPolicyInput.riskScore.riskScore,
      riskLevel: grantedPolicyInput.riskScore.riskLevel,
      identityId: grantedPolicyInput.deviceIdentity.identityId,
      devicePosture: {
        fleetCompliant: isFleetCompliant,
        uemCompliant: isUEMCompliant,
        fleetDetails: fleetContext,
        uemDetails: uemContext,
      },
      actions: policyActions.map((a) => ({ type: a.type, params: a.params })),
      policyActions: policyActions.length > 0 ? policyActions : undefined,
    });
  } catch (error) {
    console.error('[SessionStart] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
