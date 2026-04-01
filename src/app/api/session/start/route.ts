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
import { validateAndAuthorizeSessionStart, type BadgeEvent } from '@/lib/backend/validation';
import type { BadgeMapping } from '@/lib/badgeRegistry';
import { getBadgeRegistry } from '@/lib/tenant/badgeRegistry';
import { getSessionStore, SessionDirective, Session } from '@/lib/tenant/sessionStore';
import { getEvaluator, type PolicyAction, type PolicyContext } from '@/lib/tenant/policyEvaluator';
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

type FleetContext = {
  enrolled: boolean;
  status?: string;
  lastSeenAge?: number;
  osVersion?: string;
  platform?: string;
  policies?: Array<{ id: number; name: string; response: string }>;
  labels?: unknown[];
};

type UEMContext = {
  enrolled: boolean;
  complianceStatus?: string;
  platform?: string;
  osVersion?: string;
  managementId?: string;
  attest?: unknown;
  signals?: unknown;
};

type SessionDirectiveSource = Pick<Session, 'sessionId' | 'userId' | 'nextAction' | 'bundleId' | 'expiresAt'>;

function toFleetContext(context: Record<string, unknown>): FleetContext {
  return {
    enrolled: context.enrolled === true,
    status: typeof context.status === 'string' ? context.status : undefined,
    lastSeenAge: typeof context.lastSeenAge === 'number' ? context.lastSeenAge : undefined,
    osVersion: typeof context.osVersion === 'string' ? context.osVersion : undefined,
    platform: typeof context.platform === 'string' ? context.platform : undefined,
    policies: Array.isArray(context.policies)
      ? (context.policies as Array<{ id: number; name: string; response: string }>)
      : undefined,
    labels: Array.isArray(context.labels) ? context.labels : undefined,
  };
}

function toUEMContext(context: Record<string, unknown>): UEMContext {
  return {
    enrolled: context.enrolled === true,
    complianceStatus: typeof context.complianceStatus === 'string' ? context.complianceStatus : undefined,
    platform: typeof context.platform === 'string' ? context.platform : undefined,
    osVersion: typeof context.osVersion === 'string' ? context.osVersion : undefined,
    managementId: typeof context.managementId === 'string' ? context.managementId : undefined,
    attest: context.attest,
    signals: context.signals,
  };
}

const DEFAULT_SESSION_NEXT_ACTION: SessionDirective['nextAction'] = 'LAUNCH_APP';
const DEFAULT_UNKNOWN_POSTURE_MODE = 'deny';
const DEFAULT_SESSION_TTL_SECONDS = 28800;

function getUnknownPostureMode(): 'allow' | 'deny' {
  return process.env.UNKNOWN_POSTURE_MODE === 'allow' ? 'allow' : DEFAULT_UNKNOWN_POSTURE_MODE;
}

function getSessionTtlSeconds(): number {
  const ttlSeconds = Number.parseInt(process.env.SESSION_TTL_SECONDS ?? '', 10);
  return Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : DEFAULT_SESSION_TTL_SECONDS;
}

function resolveSessionNextAction(nextAction?: string): SessionDirective['nextAction'] {
  return (nextAction as SessionDirective['nextAction']) || DEFAULT_SESSION_NEXT_ACTION;
}

function toSessionDirective(session: SessionDirectiveSource): SessionDirective {
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    nextAction: resolveSessionNextAction(session.nextAction),
    bundleId: session.bundleId,
    expiresAt: session.expiresAt,
  };
}

function resolveEffectiveSessionDirective(params: { session: SessionDirectiveSource; policyActions?: PolicyAction[] }) {
  const { session, policyActions = [] } = params;
  const directive = toSessionDirective(session);

  let ttlSeconds: number | undefined;

  for (const action of policyActions) {
    if (action.type === 'launch_app') {
      directive.nextAction = 'LAUNCH_APP';

      const actionBundleId =
        typeof action.params?.bundleId === 'string'
          ? action.params.bundleId
          : typeof action.params?.appBundleId === 'string'
            ? action.params.appBundleId
            : undefined;

      if (actionBundleId) {
        directive.bundleId = actionBundleId;
      }
    }

    if (action.type === 'set_session_ttl' && typeof action.params?.seconds === 'number') {
      ttlSeconds = action.params.seconds;
    }
  }

  return { directive, ttlSeconds };
}

async function handleExistingActiveSession(params: {
  existingActiveSession: Session;
  sessionStore: ReturnType<typeof getSessionStore>;
}) {
  const { existingActiveSession, sessionStore } = params;
  const extendedExpiresAt = new Date(Date.now() + getSessionTtlSeconds() * 1000).toISOString();
  const updatedSession = await sessionStore.update(existingActiveSession.sessionId, {
    expiresAt: extendedExpiresAt,
    lastActivityAt: new Date().toISOString(),
  });
  const fetchedSession = await sessionStore.get(existingActiveSession.sessionId);
  const refreshedExpiresAt =
    (typeof fetchedSession?.expiresAt === 'string' && fetchedSession.expiresAt) ||
    (typeof updatedSession?.expiresAt === 'string' && updatedSession.expiresAt) ||
    extendedExpiresAt;
  const refreshedSession = {
    ...existingActiveSession,
    ...(updatedSession || {}),
    ...(fetchedSession || {}),
    expiresAt: refreshedExpiresAt,
  };
  const { directive } = resolveEffectiveSessionDirective({ session: refreshedSession });

  return NextResponse.json({
    success: true,
    session: directive,
    message: 'Existing session extended',
  });
}

async function handlePostureDeniedSessionStart(params: {
  event: BadgeEvent;
  deviceId: string;
  badgeMapping: BadgeMapping;
  uemContext: UEMContext;
  fleetContext: FleetContext;
  isFleetCompliant: boolean;
  isDeviceCompliant: boolean;
  isUEMCompliant: boolean;
  evaluator: {
    evaluate: (policyContext: PolicyContext) => Promise<PolicyAction[]>;
  };
}) {
  const {
    event,
    deviceId,
    badgeMapping,
    uemContext,
    fleetContext,
    isFleetCompliant,
    isDeviceCompliant,
    isUEMCompliant,
    evaluator,
  } = params;

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

async function handlePostureAllowedSessionStart(params: {
  event: BadgeEvent;
  deviceId: string;
  badgeMapping: BadgeMapping;
  sessionStore: ReturnType<typeof getSessionStore>;
  evaluator: {
    evaluate: (policyContext: PolicyContext) => Promise<PolicyAction[]>;
  };
  uemContext: UEMContext;
  fleetContext: FleetContext;
  isFleetCompliant: boolean;
  isUEMCompliant: boolean;
}) {
  const {
    event,
    deviceId,
    badgeMapping,
    sessionStore,
    evaluator,
    uemContext,
    fleetContext,
    isFleetCompliant,
    isUEMCompliant,
  } = params;

  const defaultBundleId = process.env.DEFAULT_LAUNCH_BUNDLE_ID ?? 'com.example.enterpriseapp';

  const session = await sessionStore.create({
    userId: badgeMapping.userId,
    badgeUid: event.badge.badgeId,
    deviceId,
    nextAction: resolveSessionNextAction(),
    bundleId: defaultBundleId,
    metadata: {
      employeeId: event.badge.employeeId,
      cardSerialNumber: event.badge.cardSerialNumber,
      readerType: event.reader.readerType,
      locationId: event.context?.locationId,
    },
  });

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
  }

  const { directive, ttlSeconds } = resolveEffectiveSessionDirective({
    session,
    policyActions,
  });

  if (ttlSeconds) {
    await sessionStore.update(session.sessionId, {
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
    directive.expiresAt = (await sessionStore.get(session.sessionId))?.expiresAt || directive.expiresAt;
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
}

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
      return handleExistingActiveSession({ existingActiveSession, sessionStore });
    }

    // Step 3: Check device posture BEFORE creating session
    const [rawFleetContext, rawUEMContext] = await Promise.all([
      getFleetContext(event.device?.deviceSerial || '', event.device?.deviceId || deviceId),
      getUEMContext(event.device?.deviceId || deviceId),
    ]);
    const fleetContext = toFleetContext(rawFleetContext);
    const uemContext = toUEMContext(rawUEMContext);

    const isFleetCompliant = fleetContext.status === 'compliant';
    const isUEMCompliant = uemContext.complianceStatus === 'compliant';
    const isDeviceCompliant = isFleetCompliant || isUEMCompliant;
    const isPostureUnknown = !fleetContext.enrolled && !uemContext.enrolled;
    const unknownPostureMode = getUnknownPostureMode();

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

    if (isPostureUnknown && unknownPostureMode === 'deny') {
      await recordAuthFailure('device_posture_unknown', { type: 'device', id: deviceId }, {
        meta: {
          reason: 'Unknown device posture denied by policy',
          unknownPostureMode,
        },
      });

      return NextResponse.json(
        {
          error: 'Device posture unknown',
          code: 'DEVICE_POSTURE_UNKNOWN',
          hint: 'Device must report posture before access is granted',
        },
        { status: 403 }
      );
    }

    if (!isDeviceCompliant && (fleetContext.enrolled || uemContext.enrolled)) {
      return handlePostureDeniedSessionStart({
        event,
        deviceId,
        badgeMapping,
        uemContext,
        fleetContext,
        isFleetCompliant,
        isDeviceCompliant,
        isUEMCompliant,
        evaluator,
      });
    }

    // Step 4: Create new session (device is compliant or explicitly allowed unknown posture)
    return handlePostureAllowedSessionStart({
      event,
      deviceId,
      badgeMapping,
      sessionStore,
      evaluator,
      uemContext,
      fleetContext,
      isFleetCompliant,
      isUEMCompliant,
    });
  } catch (error) {
    console.error('[SessionStart] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
