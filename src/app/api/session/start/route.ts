import { NextRequest, NextResponse } from 'next/server';
import { appendAuditRecord, recordAuthFailure } from '@/lib/auditLedger';
import { validateAndAuthorizeSessionStart } from '@/lib/backend/validation';
import { getBadgeRegistry } from '@/lib/tenant/badgeRegistry';
import { badgeRegistry as globalBadgeRegistry } from '@/lib/badgeRegistry';
import { getSessionStore } from '@/lib/tenant/sessionStore';
import { getEvaluator } from '@/lib/tenant/policyEvaluator';
import { resolveTenantId } from '@/lib/tenant/tenantContext';
import { emitAuthFailure, emitSessionStart } from '@/lib/integrations/webhooks/emitter';
import { checkDeviceRateLimit, checkIpRateLimit } from './services/rateLimit';
import { getFleetContext, getUEMContext } from './services/posture';
import { buildDeniedPolicyInput, buildGrantedPolicyInput, recordDeniedPolicySideEffects } from './services/policy';
import { createDeniedDeviceResponse } from './services/responses';

function toMode(nextAction?: string, bundleId?: string) {
  return {
    nextAction: nextAction || 'LAUNCH_APP',
    bundleId: bundleId || 'com.example.enterpriseapp',
  };
}

function ttlSeconds(): number {
  const value = Number.parseInt(process.env.SESSION_TTL_SECONDS ?? '28800', 10);
  return Number.isFinite(value) && value > 0 ? value : 28800;
}

export async function POST(request: NextRequest) {
  const tenantId = resolveTenantId(request);
  const badgeRegistry = getBadgeRegistry(tenantId);
  const sessionStore = getSessionStore(tenantId);
  const evaluator = getEvaluator(tenantId);

  const body = await request.json().catch(() => null);
  const headers = {
    'x-signature': request.headers.get('x-signature') ?? undefined,
    'x-timestamp': request.headers.get('x-timestamp') ?? undefined,
    'x-nonce': request.headers.get('x-nonce') ?? undefined,
  };

  const validation = await validateAndAuthorizeSessionStart(headers, body, request.url, request.method, tenantId);
  if (!validation.valid || !validation.event) {
    await recordAuthFailure('validation_failed', { type: 'device' }, { meta: { code: validation.code } });
    await emitAuthFailure({ deviceId: 'unknown', reason: validation.error || 'Validation failed', code: validation.code, timestamp: new Date().toISOString() });
    const authFailureCodes = new Set(['missing_headers', 'invalid_nonce', 'invalid_timestamp', 'invalid_signature', 'replay_detected']);
    const invalidSignature = validation.code === 'invalid_signature' || /invalid signature/i.test(validation.error ?? '');
    const status = invalidSignature || authFailureCodes.has(validation.code ?? '') ? 401 : 400;
    return NextResponse.json({ error: validation.error || 'Unauthorized' }, { status });
  }

  const event = validation.event;
  const deviceId = event.device.deviceId;
  const clientIp = request.headers.get('x-forwarded-for') ?? 'unknown';

  if (!checkIpRateLimit(clientIp) || !checkDeviceRateLimit(deviceId)) {
    await recordAuthFailure('rate_limit_exceeded', { type: 'device', id: deviceId });
    return NextResponse.json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' }, { status: 429 });
  }

  let badgeMapping =
    (await badgeRegistry.get(event.badge.badgeId)) ||
    (await globalBadgeRegistry.get(event.badge.badgeId));

  const allowSignedAutoEnroll =
    process.env.ALLOW_SIGNED_BADGE_AUTO_ENROLL === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.ALLOW_SIGNED_BADGE_AUTO_ENROLL !== 'false');

  if (
    !badgeMapping &&
    allowSignedAutoEnroll &&
    event.badge.employeeId &&
    'enroll' in badgeRegistry &&
    typeof badgeRegistry.enroll === 'function'
  ) {
    badgeMapping = await badgeRegistry.enroll({
      badgeUid: event.badge.badgeId,
      userId: event.badge.employeeId,
    });
    await globalBadgeRegistry.enroll({
      badgeUid: event.badge.badgeId,
      userId: event.badge.employeeId,
    });
  }

  if (!badgeMapping) {
    return NextResponse.json({ error: 'Badge not enrolled', code: 'BADGE_NOT_ENROLLED' }, { status: 404 });
  }
  if (badgeMapping.active === false) {
    return NextResponse.json({ error: 'Badge is deactivated', code: 'BADGE_INACTIVE' }, { status: 403 });
  }

  const existingSessions = await sessionStore.getByDeviceId(deviceId);
  const existing = existingSessions.find((s) => s.status === 'active');
  if (existing) {
    const expiresAt = new Date(Date.now() + ttlSeconds() * 1000).toISOString();
    await sessionStore.update(existing.sessionId, { expiresAt, lastActivityAt: new Date().toISOString() });
    const updated = await sessionStore.get(existing.sessionId);
    return NextResponse.json({
      success: true,
      message: 'Existing session extended',
      session: {
        sessionId: existing.sessionId,
        expiresAt: updated?.expiresAt ?? expiresAt,
        ...toMode(existing.nextAction, existing.bundleId),
      },
    });
  }

  const postureKey = event.device.deviceId || event.device.deviceSerial;
  const fleetContext = await getFleetContext(postureKey);
  const uemContext = await getUEMContext(postureKey);

  const isUnknown = fleetContext.status === 'unknown' || uemContext.complianceStatus === 'unknown';
  if (isUnknown && process.env.UNKNOWN_POSTURE_MODE !== 'allow') {
    await recordAuthFailure('device_posture_unknown', { type: 'device', id: deviceId }, {
      meta: { unknownPostureMode: 'deny' },
    });
    return NextResponse.json({ error: 'Device posture unknown', code: 'DEVICE_POSTURE_UNKNOWN' }, { status: 403 });
  }

  const isNonCompliant = fleetContext.status === 'non_compliant' || uemContext.complianceStatus === 'non_compliant';
  if (isNonCompliant) {
    const deniedInput = await buildDeniedPolicyInput({
      event,
      deviceId,
      badgeMapping,
      uemContext,
      fleetContext,
      isFleetCompliant: false,
      isDeviceCompliant: false,
    });

    const actions = await evaluator.evaluate(deniedInput.policyContext as any);
    recordDeniedPolicySideEffects({
      policyActions: actions as any,
      deviceId,
      userId: badgeMapping.userId,
      badgeId: event.badge.badgeId,
      userName: badgeMapping.userName,
      riskScore: deniedInput.riskScore.riskScore,
    });

    return createDeniedDeviceResponse();
  }

  const created = await sessionStore.create({
    userId: badgeMapping.userId,
    badgeUid: event.badge.badgeId,
    deviceId,
    nextAction: 'LAUNCH_APP',
    bundleId: 'com.example.enterpriseapp',
  });

  const granted = await buildGrantedPolicyInput({
    event,
    deviceId,
    badgeMapping,
    uemContext,
    fleetContext,
    sessionId: created.sessionId,
    sessionCreatedAt: created.createdAt,
  });

  const actions = await evaluator.evaluate(granted.policyContext as any);
  const launchAction = actions.find((a: any) => a.type === 'launch_app');
  const ttlAction = actions.find((a: any) => a.type === 'set_session_ttl');

  const resolvedMode = toMode(
    launchAction ? 'LAUNCH_APP' : created.nextAction,
    launchAction?.params?.appBundleId || created.bundleId
  );

  if (ttlAction?.params?.seconds) {
    const nextExpiry = new Date(Date.now() + Number(ttlAction.params.seconds) * 1000).toISOString();
    await sessionStore.update(created.sessionId, { expiresAt: nextExpiry });
  }

  const hydratedSession = await sessionStore.get(created.sessionId);
  const session = {
    sessionId: created.sessionId,
    expiresAt: hydratedSession?.expiresAt ?? created.expiresAt,
    ...resolvedMode,
  };

  await badgeRegistry.updateLastUsed(event.badge.badgeId);
  await appendAuditRecord('session.start', { type: 'user', id: badgeMapping.userId }, { target: { type: 'session', id: created.sessionId } });
  await emitSessionStart({ sessionId: created.sessionId, userId: badgeMapping.userId, deviceId, badgeId: event.badge.badgeId, timestamp: new Date().toISOString() });

  return NextResponse.json({
    success: true,
    decision: 'ACCESS_GRANTED',
    session,
    actions,
    riskScore: granted.riskScore.riskScore,
    riskLevel: granted.riskScore.riskLevel,
  });
}
