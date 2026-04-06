import { NextRequest, NextResponse } from 'next/server';
import { validateAndAuthorizeSessionStart } from '@/lib/backend/validation';
import { badgeRegistry } from '@/lib/badgeRegistry';
import { getSessionStoreFromRequest } from '@/lib/tenant/sessionStore';
import { appendAuditRecord } from '@/lib/auditLedger';
import { checkDeviceRateLimit, checkIpRateLimit } from './services/rateLimit';
import { evaluatePostureDecision, RemediationAttempt } from './services/posture';

export const runtime = 'nodejs';

type SessionStartDecision = 'allow' | 'deny';

interface DecisionMeta {
  decision: SessionStartDecision;
  reason: string;
  timestamp: string;
  remediation?: RemediationAttempt;
}

function buildDecisionResponse(params: {
  success: boolean;
  status: number;
  decision: SessionStartDecision;
  reason: string;
  session?: {
    sessionId: string;
    userId: string;
    deviceId: string;
    nextAction?: string;
    bundleId?: string;
    createdAt: string;
    expiresAt: string;
  };
  remediation?: RemediationAttempt;
}) {
  const timestamp = new Date().toISOString();

  return NextResponse.json(
    {
      success: params.success,
      decision: params.decision,
      reason: params.reason,
      timestamp,
      remediation: params.remediation,
      session: params.session,
    },
    { status: params.status }
  );
}

async function writeSessionStartAudit(params: {
  eventType: 'decision.allow' | 'decision.deny';
  actorId: string;
  deviceId: string;
  badgeId: string;
  requestId?: string;
  meta: DecisionMeta;
}) {
  await appendAuditRecord('session.start', { type: 'device', id: params.actorId }, {
    requestId: params.requestId,
    target: { type: 'session', id: params.deviceId },
    meta: {
      badgeId: params.badgeId,
      ...params.meta,
    },
  });

  await appendAuditRecord(params.eventType, { type: 'device', id: params.actorId }, {
    requestId: params.requestId,
    target: { type: 'device', id: params.deviceId },
    meta: {
      badgeId: params.badgeId,
      ...params.meta,
    },
  });
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const requestId = request.headers.get('x-request-id') ?? undefined;

  try {
    const rawBody = (await request.json()) as unknown;

    const validation = await validateAndAuthorizeSessionStart(
      {
        'x-signature': request.headers.get('x-signature') ?? undefined,
        'x-timestamp': request.headers.get('x-timestamp') ?? undefined,
        'x-nonce': request.headers.get('x-nonce') ?? undefined,
      },
      rawBody,
      request.url,
      request.method
    );

    if (!validation.valid || !validation.event) {
      const reason = validation.error ?? 'Session start validation failed';
      await appendAuditRecord('session.start', { type: 'device', id: 'unknown' }, {
        requestId,
        target: { type: 'session', id: 'unknown' },
        meta: {
          decision: 'deny',
          reason,
          code: validation.code,
          timestamp,
        },
      });

      await appendAuditRecord('decision.deny', { type: 'device', id: 'unknown' }, {
        requestId,
        target: { type: 'device', id: 'unknown' },
        meta: {
          decision: 'deny',
          reason,
          code: validation.code,
          timestamp,
        },
      });

      return NextResponse.json(
        {
          success: false,
          decision: 'deny',
          reason,
          timestamp,
        },
        { status: 401 }
      );
    }

    const event = validation.event;
    const deviceId = event.device.deviceId;
    const badgeId = event.badge.badgeId;
    const actorId = event.reader.readerId || deviceId;

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';

    if (!checkIpRateLimit(clientIp) || !checkDeviceRateLimit(deviceId)) {
      const reason = 'Rate limit exceeded for session start';
      await writeSessionStartAudit({
        eventType: 'decision.deny',
        actorId,
        deviceId,
        badgeId,
        requestId,
        meta: {
          decision: 'deny',
          reason,
          timestamp,
        },
      });

      return buildDecisionResponse({
        success: false,
        status: 429,
        decision: 'deny',
        reason,
      });
    }

    const badgeMapping = await badgeRegistry.get(badgeId);
    if (!badgeMapping || !badgeMapping.active) {
      const reason = 'Badge is not enrolled or inactive';
      await writeSessionStartAudit({
        eventType: 'decision.deny',
        actorId,
        deviceId,
        badgeId,
        requestId,
        meta: {
          decision: 'deny',
          reason,
          timestamp,
        },
      });

      return buildDecisionResponse({
        success: false,
        status: 403,
        decision: 'deny',
        reason,
      });
    }

    const posture = evaluatePostureDecision(event);

    if (posture.finalStatus === 'unknown') {
      const reason = 'Posture unknown; fail-closed deny';
      await writeSessionStartAudit({
        eventType: 'decision.deny',
        actorId,
        deviceId,
        badgeId,
        requestId,
        meta: {
          decision: 'deny',
          reason,
          timestamp,
          remediation: posture.remediation,
        },
      });

      return buildDecisionResponse({
        success: false,
        status: 403,
        decision: 'deny',
        reason,
        remediation: posture.remediation,
      });
    }

    if (posture.finalStatus === 'non_compliant') {
      const reason = posture.remediation?.attempted
        ? 'Remediation attempted but device remains non-compliant'
        : 'Device is non-compliant';

      await writeSessionStartAudit({
        eventType: 'decision.deny',
        actorId,
        deviceId,
        badgeId,
        requestId,
        meta: {
          decision: 'deny',
          reason,
          timestamp,
          remediation: posture.remediation,
        },
      });

      return buildDecisionResponse({
        success: false,
        status: 403,
        decision: 'deny',
        reason,
        remediation: posture.remediation,
      });
    }

    const sessionStore = getSessionStoreFromRequest(request);
    const session = await sessionStore.create({
      userId: badgeMapping.userId,
      badgeUid: badgeId,
      deviceId,
      nextAction: 'LAUNCH_APP',
      bundleId: 'com.signalgrid.demo',
      metadata: {
        badgeReaderId: event.reader.readerId,
        postureInitialStatus: posture.initialStatus,
        postureFinalStatus: posture.finalStatus,
        remediation: posture.remediation,
      },
    });

    await badgeRegistry.updateLastUsed(badgeId);

    const reason = posture.remediation?.attempted
      ? 'Remediation succeeded; access allowed'
      : 'Device posture is compliant';

    await writeSessionStartAudit({
      eventType: 'decision.allow',
      actorId,
      deviceId,
      badgeId,
      requestId,
      meta: {
        decision: 'allow',
        reason,
        timestamp,
        remediation: posture.remediation,
      },
    });

    return buildDecisionResponse({
      success: true,
      status: 200,
      decision: 'allow',
      reason,
      remediation: posture.remediation,
      session: {
        sessionId: session.sessionId,
        userId: session.userId,
        deviceId: session.deviceId,
        nextAction: session.nextAction,
        bundleId: session.bundleId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Session start failed unexpectedly';
    await appendAuditRecord('session.start', { type: 'system', id: 'session-start-api' }, {
      requestId,
      target: { type: 'session', id: 'unknown' },
      meta: {
        decision: 'deny',
        reason,
        timestamp,
      },
    });

    await appendAuditRecord('decision.deny', { type: 'system', id: 'session-start-api' }, {
      requestId,
      target: { type: 'device', id: 'unknown' },
      meta: {
        decision: 'deny',
        reason,
        timestamp,
      },
    });

    return buildDecisionResponse({
      success: false,
      status: 500,
      decision: 'deny',
      reason: 'Internal error during session start',
    });
  }
}
