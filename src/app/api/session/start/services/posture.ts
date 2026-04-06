export type Posture = 'compliant' | 'non_compliant' | 'unknown';

export type SessionStartInput = {
  userId: string;
  deviceId: string;
  posture: Posture;
  issue?: string;
};

export type RemediationResult = {
  attempted: boolean;
  issue?: string;
  action?: string;
  result: 'success' | 'failed' | 'not_attempted';
};

export function detectIssue(input: SessionStartInput): string {
  if (input.issue && input.issue.trim().length > 0) {
    return input.issue;
  }

  return 'policy_violation';
}

export function attemptRemediation(issue: string): RemediationResult {
  if (!issue) {
    return {
      attempted: false,
      result: 'not_attempted',
    };
  }

  if (issue === 'os_outdated') {
    return {
      attempted: true,
      issue,
      action: 'trigger_os_update',
      result: 'success',
    };
  }

  return {
    attempted: true,
    issue,
    action: 'open_helpdesk_ticket',
    result: 'failed',
  };
}
