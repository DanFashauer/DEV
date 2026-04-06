import { BadgeEvent } from '@/lib/backend/validation';

export type PostureStatus = 'compliant' | 'non_compliant' | 'unknown';

export type RemediationStatus = 'succeeded' | 'failed';

export interface RemediationAttempt {
  attempted: true;
  status: RemediationStatus;
  reason: string;
}

export interface PostureDecision {
  initialStatus: PostureStatus;
  finalStatus: PostureStatus;
  remediation?: RemediationAttempt;
}

function normalizePostureStatus(raw: string | undefined): PostureStatus {
  if (!raw) return 'unknown';

  const value = raw.trim().toLowerCase();
  if (value === 'compliant') return 'compliant';
  if (value === 'non_compliant' || value === 'non-compliant') return 'non_compliant';
  return 'unknown';
}

function asBoolean(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === 'true';
}

/**
 * MVP posture/resolution contract:
 * - complianceStatus comes from mdm.personaAttributes.complianceStatus
 * - non_compliant posture always attempts remediation when remediationAttempted=true
 * - remediation outcome can set final status to compliant
 */
export function evaluatePostureDecision(event: BadgeEvent): PostureDecision {
  const attrs = event.mdm.personaAttributes ?? {};
  const initialStatus = normalizePostureStatus(attrs.complianceStatus);

  if (initialStatus !== 'non_compliant') {
    return {
      initialStatus,
      finalStatus: initialStatus,
    };
  }

  const remediationRequested = asBoolean(attrs.remediationAttempted);
  if (!remediationRequested) {
    return {
      initialStatus,
      finalStatus: 'non_compliant',
      remediation: {
        attempted: true,
        status: 'failed',
        reason: 'Remediation required but not attempted',
      },
    };
  }

  const remediationSucceeded = asBoolean(attrs.remediationSucceeded);

  if (remediationSucceeded) {
    return {
      initialStatus,
      finalStatus: 'compliant',
      remediation: {
        attempted: true,
        status: 'succeeded',
        reason: 'Remediation completed and posture became compliant',
      },
    };
  }

  return {
    initialStatus,
    finalStatus: 'non_compliant',
    remediation: {
      attempted: true,
      status: 'failed',
      reason: 'Remediation attempted but posture remains non-compliant',
    },
  };
}
