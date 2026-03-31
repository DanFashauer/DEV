import type { DecisionRequest } from './types';

export interface IdentityAdapter {
  validateUser(input: DecisionRequest['user']): Promise<{ valid: boolean; reason?: string }>;
  getRiskScore(input: DecisionRequest['user']): Promise<number>;
}

export interface DeviceAdapter {
  validateDevice(input: DecisionRequest['device']): Promise<{ enrolled: boolean; compliant: boolean; secureState: boolean }>;
}

export interface NetworkAdapter {
  evaluateNetwork(input: DecisionRequest['context']): Promise<{ trustLevel: 'trusted' | 'untrusted' | 'unknown'; anomalyScore: number }>;
}

export type DecisionAdapters = {
  identity: IdentityAdapter;
  device: DeviceAdapter;
  network: NetworkAdapter;
};

export const defaultAdapters: DecisionAdapters = {
  identity: {
    async validateUser(user) {
      const valid = Boolean(user?.id && user?.token);
      return valid ? { valid } : { valid, reason: 'Missing or invalid user identity token' };
    },
    async getRiskScore(user) {
      const risk = typeof user?.riskScore === 'number' ? user.riskScore : 0;
      return Math.min(Math.max(risk, 0), 100);
    },
  },
  device: {
    async validateDevice(device) {
      return {
        enrolled: Boolean(device?.enrolled),
        compliant: Boolean(device?.compliant),
        secureState: Boolean(device?.secureState),
      };
    },
  },
  network: {
    async evaluateNetwork(context) {
      return {
        trustLevel: context?.networkTrustLevel ?? 'unknown',
        anomalyScore: typeof context?.anomalyScore === 'number' ? context.anomalyScore : 0,
      };
    },
  },
};
