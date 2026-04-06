import { NextResponse } from 'next/server';
import type { RemediationResult } from './posture';

export type SessionDecisionResponse = {
  decision: 'allow' | 'deny';
  reason: string;
  timestamp: string;
  remediation?: RemediationResult;
};

function buildResponse(
  decision: SessionDecisionResponse['decision'],
  reason: string,
  remediation?: RemediationResult
): SessionDecisionResponse {
  return {
    decision,
    reason,
    timestamp: new Date().toISOString(),
    ...(remediation ? { remediation } : {}),
  };
}

export function allow(reason: string, remediation?: RemediationResult): NextResponse<SessionDecisionResponse> {
  return NextResponse.json(buildResponse('allow', reason, remediation), { status: 200 });
}

export function deny(reason: string, remediation?: RemediationResult): NextResponse<SessionDecisionResponse> {
  return NextResponse.json(buildResponse('deny', reason, remediation), { status: 403 });
}
