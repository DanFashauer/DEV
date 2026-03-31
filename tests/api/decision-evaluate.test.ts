import { describe, expect, it } from 'vitest';
import { evaluateDecisionFlow } from '@/lib/decision/engine';

const basePayload = {
  user: { id: 'u-1', token: 'token', riskScore: 10 },
  device: { id: 'd-1', enrolled: true, compliant: true, secureState: true },
  session: { id: 's-1', active: true, expired: false, needsExtension: false },
  app: { id: 'med.ehr' },
  action: { type: 'launch_app' },
  context: { location: 'hospital', networkType: 'wifi' as const, networkTrustLevel: 'trusted' as const },
};

describe('Decision Flow Engine', () => {
  it('returns allow for compliant low-risk inputs', async () => {
    const response = await evaluateDecisionFlow(basePayload);
    expect(response.decision).toBe('allow');
    expect(response.reason).toContain('passed');
  });

  it('returns deny when canonical fields are missing', async () => {
    const response = await evaluateDecisionFlow({
      ...basePayload,
      user: { ...basePayload.user, id: undefined },
    });

    expect(response.decision).toBe('deny');
    expect(response.reason).toContain('Missing required canonical fields');
    expect(response.requiredActions).toContain('fix_request_payload');
  });

  it('returns deny when device validation fails', async () => {
    const response = await evaluateDecisionFlow({
      ...basePayload,
      device: { ...basePayload.device, compliant: false },
    });

    expect(response.decision).toBe('deny');
    expect(response.requiredActions).toContain('reenroll_device');
  });

  it('returns step_up for elevated risk', async () => {
    const response = await evaluateDecisionFlow({
      ...basePayload,
      user: { ...basePayload.user, riskScore: 65 },
    });

    expect(response.decision).toBe('step_up');
    expect(response.requiredActions).toContain('mfa_challenge');
  });

  it('fails closed on adapter errors', async () => {
    const response = await evaluateDecisionFlow(basePayload, {
      identity: {
        validateUser: async () => {
          throw new Error('adapter unavailable');
        },
        getRiskScore: async () => 0,
      },
    });

    expect(response.decision).toBe('deny');
    expect(response.reason).toContain('fail-closed');
  });
});
