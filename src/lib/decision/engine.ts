import { randomUUID } from 'crypto';
import { appendAuditRecord, type AuditEventType } from '@/lib/auditLedger';
import { defaultAdapters, type DecisionAdapters } from './adapters';
import { REQUIRED_DECISION_FIELDS, type DecisionRequest, type DecisionResponse, type DecisionResult, type PolicyRule } from './types';

function pick<T>(obj: Record<string, unknown>, path: string): T | undefined {
  const parts = path.split('.');
  let cursor: unknown = obj;
  for (const part of parts) {
    if (typeof cursor !== 'object' || cursor === null) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor as T | undefined;
}

function matchesRule(rule: PolicyRule, payload: DecisionRequest): boolean {
  return rule.when.every((condition) => {
    const value = pick<unknown>(payload as unknown as Record<string, unknown>, condition.field);
    if (condition.equals !== undefined) {
      return value === condition.equals;
    }
    if (condition.gte !== undefined && typeof value === 'number') {
      return value >= condition.gte;
    }
    if (condition.lte !== undefined && typeof value === 'number') {
      return value <= condition.lte;
    }
    if (condition.includes !== undefined && Array.isArray(value)) {
      return value.includes(condition.includes);
    }
    return false;
  });
}

function policyEngine(
  payload: DecisionRequest,
  riskScore: number
): Pick<DecisionResponse, 'decision' | 'reason' | 'requiredActions' | 'decisionSource' | 'matchedPolicyId'> {
  const rules = payload.context.policyRules ?? [];
  const matched = rules.find((rule) => matchesRule(rule, payload));

  if (matched) {
    return {
      decision: matched.decision,
      reason: `Policy matched: ${matched.reason}`,
      decisionSource: 'policy',
      matchedPolicyId: matched.id,
      requiredActions: matched.requiredActions ?? [],
    };
  }

  if (riskScore >= 80) {
    return {
      decision: 'deny',
      reason: 'Risk score exceeds deny threshold',
      decisionSource: 'threshold',
      requiredActions: ['investigate_user', 'open_incident'],
    };
  }

  if (riskScore >= 50 || payload.context.networkTrustLevel === 'untrusted') {
    return {
      decision: 'step_up',
      reason: 'Additional verification required',
      decisionSource: 'threshold',
      requiredActions: ['mfa_challenge'],
    };
  }

  return {
    decision: 'allow',
    reason: 'All validations and policy checks passed',
    decisionSource: 'threshold',
    requiredActions: [],
  };
}

function getMissingCanonicalFields(payload: DecisionRequest): string[] {
  return REQUIRED_DECISION_FIELDS.filter((field) => {
    const value = pick<unknown>(payload as unknown as Record<string, unknown>, field);
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

function resolveAuditEventType(params: {
  branch: 'validation_failure' | 'decision' | 'engine_error';
  decision: DecisionResult;
}): AuditEventType {
  if (params.branch === 'validation_failure') {
    return 'decision.validation.failed';
  }

  if (params.branch === 'engine_error') {
    return 'decision.engine_error';
  }

  if (params.decision === 'allow') {
    return 'decision.allow';
  }

  if (params.decision === 'step_up') {
    return 'decision.step_up';
  }

  return 'decision.deny';
}

async function writeDecisionAudit(params: {
  requestId: string;
  payload: DecisionRequest;
  result: DecisionResult;
  reason: string;
  decisionSource: DecisionResponse['decisionSource'];
  matchedPolicyId?: string;
  steps: Record<string, unknown>;
  branch: 'validation_failure' | 'decision' | 'engine_error';
}): Promise<void> {
  const { requestId, payload, result, reason, decisionSource, matchedPolicyId, steps, branch } = params;
  const eventType = resolveAuditEventType({ branch, decision: result });

  await appendAuditRecord(eventType, { type: 'system', id: 'decision-flow-engine' }, {
    target: { type: 'session', id: payload.session.id },
    requestId,
    meta: {
      userId: payload.user.id,
      deviceId: payload.device.id,
      appId: payload.app.id,
      actionType: payload.action.type,
      decision: result,
      reason,
      decisionSource,
      matchedPolicyId,
      branch,
      steps,
    },
  });
}

export async function evaluateDecisionFlow(
  payload: DecisionRequest,
  adapters: Partial<DecisionAdapters> = {}
): Promise<DecisionResponse> {
  const requestId = randomUUID();
  const evaluatedAt = new Date().toISOString();
  const resolvedAdapters = {
    identity: adapters.identity ?? defaultAdapters.identity,
    device: adapters.device ?? defaultAdapters.device,
    network: adapters.network ?? defaultAdapters.network,
  };

  let result: DecisionResult = 'deny';
  let reason = 'Fail-closed default';
  let requiredActions: string[] = ['manual_review'];
  let decisionSource: DecisionResponse['decisionSource'] = 'engine_error';
  let matchedPolicyId: string | undefined;
  let branch: 'validation_failure' | 'decision' | 'engine_error' = 'decision';
  const steps: Record<string, unknown> = {};

  const toResponse = async (): Promise<DecisionResponse> => {
    await writeDecisionAudit({ requestId, payload, result, reason, decisionSource, matchedPolicyId, steps, branch });

    return {
      decision: result,
      reason,
      decisionSource,
      matchedPolicyId,
      requiredActions,
      sessionUpdate: {
        keepAliveRecommended: result !== 'deny',
        extendBySeconds: payload.session.needsExtension && result !== 'deny' ? 1800 : undefined,
      },
      auditLog: {
        requestId,
        evaluatedAt,
        steps: {
          ...steps,
          decision: result,
          reason,
          decisionSource,
          matchedPolicyId,
        },
      },
    };
  };

  try {
    const missingCanonicalFields = getMissingCanonicalFields(payload);
    if (missingCanonicalFields.length > 0) {
      result = 'deny';
      reason = `Missing required canonical fields: ${missingCanonicalFields.join(', ')}`;
      requiredActions = ['fix_request_payload'];
      decisionSource = 'validation';
      matchedPolicyId = undefined;
      branch = 'validation_failure';
      steps.validationFailure = { missingCanonicalFields };
      return toResponse();
    }

    const identityValidation = await resolvedAdapters.identity.validateUser(payload.user);
    const riskScore = await resolvedAdapters.identity.getRiskScore(payload.user);
    steps.identityValidation = { ...identityValidation, riskScore };

    if (!identityValidation.valid) {
      reason = identityValidation.reason ?? 'Identity validation failed';
      requiredActions = ['reauthenticate'];
      decisionSource = 'validation';
      matchedPolicyId = undefined;
      branch = 'validation_failure';
      return toResponse();
    }

    const deviceValidation = await resolvedAdapters.device.validateDevice(payload.device);
    steps.deviceValidation = deviceValidation;
    if (!deviceValidation.enrolled || !deviceValidation.compliant || !deviceValidation.secureState) {
      reason = 'Device validation failed';
      requiredActions = ['reenroll_device', 'recheck_posture'];
      decisionSource = 'validation';
      matchedPolicyId = undefined;
      branch = 'validation_failure';
      return toResponse();
    }

    const sessionValidation = {
      active: Boolean(payload.session.active),
      expired: Boolean(payload.session.expired),
      needsExtension: Boolean(payload.session.needsExtension),
    };
    steps.sessionValidation = sessionValidation;
    if (!sessionValidation.active || sessionValidation.expired) {
      reason = 'Session is inactive or expired';
      requiredActions = ['reauthenticate'];
      decisionSource = 'validation';
      matchedPolicyId = undefined;
      branch = 'validation_failure';
      return toResponse();
    }

    const networkEvaluation = await resolvedAdapters.network.evaluateNetwork(payload.context);
    steps.contextEvaluation = {
      location: payload.context.location ?? 'unknown',
      networkType: payload.context.networkType ?? 'unknown',
      ...networkEvaluation,
    };

    const policyResult = policyEngine(
      {
        ...payload,
        user: {
          ...payload.user,
          riskScore,
        },
      },
      riskScore + networkEvaluation.anomalyScore
    );

    result = policyResult.decision;
    reason = policyResult.reason;
    decisionSource = policyResult.decisionSource;
    matchedPolicyId = policyResult.matchedPolicyId;
    requiredActions = policyResult.requiredActions;
    branch = 'decision';

    return toResponse();
  } catch (error) {
    result = 'deny';
    reason = 'Decision engine error (fail-closed)';
    requiredActions = ['manual_review'];
    decisionSource = 'engine_error';
    matchedPolicyId = undefined;
    branch = 'engine_error';
    steps.error = error instanceof Error ? error.message : 'unknown_error';
    return toResponse();
  }
}
