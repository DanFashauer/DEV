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
import { getPostureForHost } from '@/lib/integrations/telemetry/store';
import { getFleetDMAdapter } from '@/lib/integrations/telemetry/fleetdm';
import { getDevicePosture } from '@/lib/integrations/uem/store';
import { resolveDeviceIdentity, getDeviceIdentityByDeviceId, createIdentityRef } from '@/lib/identity/deviceIdentity';
import { calculateRiskScore, createRiskContext } from '@/lib/risk/score';
import { addSecurityEvent } from '@/lib/securityEvents';

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
 * Build UEM context for policy evaluation
 * Fetches device posture from configured UEM (Intune, Jamf, Workspace ONE)
 */
async function getUEMContext(deviceId: string): Promise<Record<string, unknown>> {
  try {
    const posture = await getDevicePosture(deviceId);
    
    if (!posture) {
      return { enrolled: false };
    }
    
    return {
      enrolled: posture.enrollmentStatus === 'enrolled',
      complianceStatus: posture.complianceStatus,
      platform: posture.platform,
      osVersion: posture.osVersion,
      managementId: posture.managementId,
      attest: posture.attest,
      signals: posture.signals,
    };
  } catch (error) {
    console.error('[SessionStart] Failed to get UEM context:', error);
    return { enrolled: false };
  }
}

/**
 * Build fleet context for policy evaluation
 * Fetches cached FleetDM posture data if available
 * Also checks posture store directly by deviceId for demo/testing
 */
async function getFleetContext(deviceSerial: string): Promise<Record<string, unknown>> {
  try {
    // First, check posture store directly by deviceSerial (for demo/testing)
    const directPosture = await getPostureForHost(deviceSerial);
    if (directPosture) {
      const posture = directPosture.data as {
        platform: string;
        compliant: boolean;
        lastCheckAt: string;
        policies: { id: number; name: string; response: string }[];
        rawSignals?: Record<string, unknown>;
      };
      
      return {
        enrolled: true,
        status: posture.compliant ? 'compliant' : 'non_compliant',
        lastSeenAge: Date.now() - new Date(posture.lastCheckAt).getTime(),
        osVersion: posture.rawSignals?.os_version as string || 'unknown',
        platform: posture.platform,
        policies: posture.policies,
        labels: [],
      };
    }
    
    // Fall back to FleetDM adapter
    const adapter = await getFleetDMAdapter();
    
    if (!adapter.isEnabled()) {
      return { enrolled: false };
    }
    
    // Get all hosts and find matching by serial
    const hosts = await adapter.getHosts();
    const host = hosts.find(h => h.serial_number === deviceSerial);
    
    if (!host) {
      return { enrolled: false };
    }
    
    // Get cached posture
    const cached = await getPostureForHost(host.uuid);
    
    if (!cached) {
      return {
        enrolled: true,
        status: 'unknown',
        lastSeenAge: Date.now() - new Date(host.seen_time).getTime(),
        osVersion: host.os_version,
      };
    }
    
    const posture = cached.data as {
      platform: string;
      compliant: boolean;
      lastCheckAt: string;
      policies: { id: number; name: string; response: string }[];
      rawSignals?: Record<string, unknown>;
    };
    
    return {
      enrolled: true,
      status: posture.compliant ? 'compliant' : 'non_compliant',
      lastSeenAge: Date.now() - new Date(host.seen_time).getTime(),
      osVersion: posture.rawSignals?.os_version || host.os_version,
      platform: posture.platform,
      policies: posture.policies,
      labels: [], // Would need additional API call
    };
  } catch (error) {
    console.error('[SessionStart] Failed to get fleet context:', error);
    return { enrolled: false };
  }
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
    
    // Step 3: Check device posture BEFORE creating session
    // Get fleet and UEM context to evaluate compliance
    const [fleetContext, uemContext] = await Promise.all([
      getFleetContext(event.device?.deviceSerial || ''),
      getUEMContext(event.device?.deviceId || deviceId),
    ]);

    // Check if device is compliant before allowing session
    const isFleetCompliant = fleetContext.status === 'compliant';
    const isUEMCompliant = uemContext.complianceStatus === 'compliant';
    const isDeviceCompliant = isFleetCompliant || isUEMCompliant;

    // Record compliance check in audit
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

    // If device is NOT compliant, deny session and trigger policy actions
    if (!isDeviceCompliant && (fleetContext.enrolled || uemContext.enrolled)) {
      console.log('[SessionStart] Device non-compliant, denying session:', {
        deviceId,
        fleetStatus: fleetContext.status,
        uemStatus: uemContext.complianceStatus,
      });

      // Record auth failure due to non-compliance
      await recordAuthFailure(
        'device_non_compliant',
        { type: 'device', id: deviceId },
        { 
          meta: { 
            reason: 'Device compliance check failed',
            fleetStatus: fleetContext.status,
            uemStatus: uemContext.complianceStatus,
          },
        }
      );

      // Build context for policy evaluation
      const deviceIdentity = await resolveDeviceIdentity({
        deviceId: event.device?.deviceId || deviceId,
        serial: event.device?.deviceSerial,
        platform: event.device?.deviceModel ? 'darwin' : undefined,
        osVersion: event.device?.osVersion,
        deviceModel: event.device?.deviceModel,
        managementSource: 'badge_event',
      });

      const riskScore = calculateRiskScore({
        deviceIdentity,
        isManaged: !!deviceIdentity.managementId,
        correlationScore: deviceIdentity?.correlationScore,
        postureStatus: isFleetCompliant ? 'compliant' : 'non_compliant',
        postureLastCheckAge: typeof fleetContext.lastSeenAge === 'number' ? fleetContext.lastSeenAge : undefined,
        locationZone: event.context?.locationId,
        eventTimestamp: event.timestamp,
      });

      const policyContext = {
        device: { role: 'kiosk', deviceId, complianceStatus: isDeviceCompliant ? 'compliant' : 'non_compliant', ...uemContext },
        user: { role: badgeMapping.department || 'user', userId: badgeMapping.userId, name: badgeMapping.userName },
        location: { zone: event.context?.locationId || 'unknown' },
        session: { id: 'pending', startedAt: new Date().toISOString() },
        fleet: fleetContext,
        uem: uemContext,
        ...createRiskContext(riskScore),
        event: { type: 'session.start', timestamp: event.timestamp },
      };

      // Evaluate policies (this will trigger quarantine, SIEM, ITSM actions)
      const policyActions = evaluatePolicies(policyContext);
      
      // Log the policy actions that were triggered
      for (const action of policyActions) {
        console.log('[Policy] Action triggered (non-compliant device):', action.type, action.params);
      }

      // Record security event for admin dashboard
      addSecurityEvent({
        type: 'session_denied',
        timestamp: new Date().toISOString(),
        actor: { type: 'badge', id: event.badge.badgeId, name: badgeMapping.userName },
        device: { id: deviceId, complianceStatus: 'non_compliant' },
        decision: 'DENY',
        reason: 'DEVICE_NON_COMPLIANT',
        actionsTriggered: policyActions.map(a => a.type),
        riskScore: riskScore.riskScore,
        policy: policyActions[0]?.policyName,
      });

      // Record additional events for each action triggered
      for (const action of policyActions) {
        if (action.type === 'quarantine_device') {
          addSecurityEvent({
            type: 'quarantine',
            timestamp: new Date().toISOString(),
            actor: { type: 'system', id: 'policy-engine' },
            device: { id: deviceId, complianceStatus: 'non_compliant' },
            decision: 'DENY',
            reason: 'Device quarantined due to compliance failure',
            actionsTriggered: [],
            policy: action.policyName,
          });
        } else if (action.type === 'emit_siem_event') {
          addSecurityEvent({
            type: 'siem_alert',
            timestamp: new Date().toISOString(),
            actor: { type: 'system', id: 'policy-engine' },
            device: { id: deviceId, complianceStatus: 'non_compliant' },
            decision: 'DENY',
            reason: 'SIEM alert sent',
            actionsTriggered: [],
            policy: action.policyName,
          });
        } else if (action.type === 'send_itsm_ticket') {
          addSecurityEvent({
            type: 'itsm_ticket',
            timestamp: new Date().toISOString(),
            actor: { type: 'system', id: 'policy-engine' },
            device: { id: deviceId, complianceStatus: 'non_compliant' },
            decision: 'DENY',
            reason: 'ITSM incident created',
            actionsTriggered: [],
            policy: action.policyName,
          });
        }
      }

      // Build C-suite friendly decision receipt
      const actionsTriggered = policyActions.map(a => a.type.toUpperCase().replace(/_/g, '_'));
      
      // Return denial response with decision receipt
      return NextResponse.json(
        {
          // C-suite decision receipt
          decision: 'DENY',
          reason: 'DEVICE_NON_COMPLIANT',
          reasonDetail: isFleetCompliant ? 'UEM compliance check failed' : 'FleetDM compliance check failed (jailbroken)',
          actionsTriggered: policyActions.map(a => a.type),
          policy: policyActions[0]?.policyName || 'Quarantine High-Risk Device',
          riskScore: riskScore.riskScore,
          riskLevel: riskScore.riskLevel,
          timestamp: new Date().toISOString(),
          
          // Legacy/compatibility fields
          success: false,
          error: 'Device compliance check failed',
          code: 'DEVICE_NON_COMPLIANT',
          hint: 'Device must be compliant before accessing shared resources',
          complianceStatus: {
            fleetCompliant: isFleetCompliant,
            uemCompliant: isUEMCompliant,
            fleetDetails: fleetContext,
            uemDetails: uemContext,
          },
          policyActions: policyActions.length > 0 ? policyActions : undefined,
        },
        { status: 403 }
      );
    }

    // Step 4: Create new session (device is compliant or no posture data)
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
    
    // Emit webhook event
    if (process.env.WEBHOOK_DELIVERY_REQUIRED === 'true') {
      try {
        await emitSessionStart({
          sessionId: session.sessionId,
          userId: session.userId,
          deviceId: deviceId,
          badgeId: event.badge.badgeId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Webhook] Mandatory webhook delivery failed:', error);
        return NextResponse.json(
          { error: 'Event delivery failed' },
          { status: 502 }
        );
      }
    } else {
      // Best-effort delivery for non-critical webhooks
      emitSessionStart({
        sessionId: session.sessionId,
        userId: session.userId,
        deviceId: deviceId,
        badgeId: event.badge.badgeId,
        timestamp: new Date().toISOString(),
      }).catch(err => console.error('[Webhook] Async webhook delivery failed:', err));
    }
    
    // Evaluate policies and get actions
    // Build fleet, UEM, identity, and risk context for policy evaluation
    // (fleetContext and uemContext already fetched above for compliance check)
    
    // Resolve device identity from session event
    const deviceIdentity = await resolveDeviceIdentity({
      deviceId: event.device?.deviceId || deviceId,
      serial: event.device?.deviceSerial,
      platform: event.device?.deviceModel ? 'darwin' : undefined,
      osVersion: event.device?.osVersion,
      deviceModel: event.device?.deviceModel,
      managementSource: 'badge_event',
    });
    
    // Calculate risk score based on all available context
    const riskScore = calculateRiskScore({
      deviceIdentity,
      isManaged: !!deviceIdentity.managementId,
      correlationScore: deviceIdentity?.correlationScore,
      postureStatus: fleetContext.status === 'compliant' ? 'compliant' : 
                     fleetContext.status === 'non_compliant' ? 'non_compliant' : 'unknown',
      postureLastCheckAge: typeof fleetContext.lastSeenAge === 'number' ? fleetContext.lastSeenAge : undefined,
      locationZone: event.context?.locationId,
      eventTimestamp: event.timestamp,
    });
    
    // Create identity reference for audit trail
    const identityRef = createIdentityRef(deviceIdentity);
    
    const policyContext = {
      device: { role: 'kiosk', deviceId, ...uemContext },
      user: { role: badgeMapping.department || 'user', userId: badgeMapping.userId, name: badgeMapping.userName },
      location: { zone: event.context?.locationId || 'unknown' },
      session: { id: session.sessionId, startedAt: session.createdAt },
      fleet: fleetContext,
      uem: uemContext,
      ...createRiskContext(riskScore),
      _identityRef: identityRef, // For audit linkage
    };
    
    const policyActions = evaluatePolicies(policyContext);
    
    // Process policy actions with error boundary
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Policy] Action processing failed:', errorMessage);
      
      // Record audit failure
      await recordAuthFailure({
        type: 'policy_dispatch_failed',
        sessionId: session.sessionId,
        userId: badgeMapping.userId,
        deviceId,
        reason: `Policy action processing failed: ${errorMessage}`,
        riskScore: riskScore.riskScore,
      });
      
      // Return error response
      return NextResponse.json(
        { error: 'Policy execution failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: directive,
      riskScore: riskScore.riskScore,
      riskLevel: riskScore.riskLevel,
      identityId: deviceIdentity.identityId,
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
