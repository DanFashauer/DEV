export type DecisionResult = 'allow' | 'deny' | 'step_up';

export const REQUIRED_DECISION_FIELDS = ['user.id', 'device.id', 'session.id', 'app.id', 'action.type'] as const;

export type RequiredDecisionField = (typeof REQUIRED_DECISION_FIELDS)[number];

export type DecisionRequest = {
  user: {
    id?: string;
    token?: string;
    role?: string;
    riskScore?: number;
    [key: string]: unknown;
  };
  device: {
    id?: string;
    enrolled?: boolean;
    compliant?: boolean;
    secureState?: boolean;
    rebooted?: boolean;
    [key: string]: unknown;
  };
  session: {
    id?: string;
    active?: boolean;
    expired?: boolean;
    needsExtension?: boolean;
    [key: string]: unknown;
  };
  app: {
    id?: string;
    [key: string]: unknown;
  };
  action: {
    type?: string;
    [key: string]: unknown;
  };
  context: {
    location?: string;
    networkType?: 'wifi' | 'cellular' | 'unknown';
    networkTrustLevel?: 'trusted' | 'untrusted' | 'unknown';
    anomalyScore?: number;
    policyRules?: PolicyRule[];
    [key: string]: unknown;
  };
};

export type PolicyRule = {
  id: string;
  when: {
    field: string;
    equals?: unknown;
    gte?: number;
    lte?: number;
    includes?: unknown;
  }[];
  decision: DecisionResult;
  reason: string;
  requiredActions?: string[];
};

export type DecisionResponse = {
  decision: DecisionResult;
  reason: string;
  decisionSource: 'policy' | 'threshold' | 'validation' | 'engine_error';
  matchedPolicyId?: string;
  requiredActions: string[];
  sessionUpdate: {
    extendBySeconds?: number;
    keepAliveRecommended: boolean;
  };
  auditLog: {
    requestId: string;
    evaluatedAt: string;
    steps: Record<string, unknown>;
  };
};
