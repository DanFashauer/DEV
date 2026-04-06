import { NextRequest, NextResponse } from 'next/server';
import { appendAuditRecord } from '@/lib/auditLedger';
import { attemptRemediation, detectIssue, type SessionStartInput } from './services/posture';
import { allow, deny } from './services/responses';

function isPosture(value: unknown): value is SessionStartInput['posture'] {
  return value === 'compliant' || value === 'non_compliant' || value === 'unknown';
}

function validateInput(payload: unknown): SessionStartInput | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const userId = value.userId;
  const deviceId = value.deviceId;
  const posture = value.posture;
  const issue = value.issue;

  if (typeof userId !== 'string' || typeof deviceId !== 'string' || !isPosture(posture)) {
    return null;
  }

  return {
    userId,
    deviceId,
    posture,
    issue: typeof issue === 'string' ? issue : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const input = validateInput(payload);

    if (!input) {
      return NextResponse.json(
        {
          error:
            'Invalid payload. Expected: { userId: string, deviceId: string, posture: compliant|non_compliant|unknown, issue?: string }',
        },
        { status: 400 }
      );
    }

    if (input.posture === 'compliant') {
      await appendAuditRecord('decision.allow', { type: 'user', id: input.userId }, {
        target: { type: 'device', id: input.deviceId },
        meta: { reason: 'device compliant', posture: input.posture },
      });

      return allow('device compliant');
    }

    if (input.posture === 'non_compliant') {
      const issue = detectIssue(input);
      const remediation = attemptRemediation(issue);

      if (remediation.result === 'success') {
        await appendAuditRecord('decision.allow', { type: 'user', id: input.userId }, {
          target: { type: 'device', id: input.deviceId },
          meta: { reason: 'device remediated', posture: input.posture, remediation },
        });

        return allow('device remediated', remediation);
      }

      await appendAuditRecord('decision.deny', { type: 'user', id: input.userId }, {
        target: { type: 'device', id: input.deviceId },
        meta: { reason: 'device non-compliant', posture: input.posture, remediation },
      });

      return deny('device non-compliant', remediation);
    }

    await appendAuditRecord('decision.deny', { type: 'user', id: input.userId }, {
      target: { type: 'device', id: input.deviceId },
      meta: { reason: 'unknown posture', posture: input.posture },
    });

    return deny('unknown posture');
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
