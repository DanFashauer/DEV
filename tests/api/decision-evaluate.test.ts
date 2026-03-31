import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateDecisionFlow } from '@/lib/decision/engine';
import { POST } from '@/app/api/decision/evaluate/route';

const mockAppendAuditRecord = vi.fn();

vi.mock('@/lib/auditLedger', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auditLedger')>('@/lib/auditLedger');
  return {
    ...actual,
    appendAuditRecord: mockAppendAuditRecord,
  };
});

const basePayload = {
  user: { id: 'u-1', token: 'token', riskScore: 10 },
  device: { id: 'd-1', enrolled: true, compliant: true, secureState: true },
  session: { id: 's-1', active: true, expired: false, needsExtension: false },
  app: { id: 'med.ehr' },
  action: { type: 'launch_app' },
  context: { location: 'hospital', networkType: 'wifi' as const, networkTrustLevel: 'trusted' as const },
};

describe('Decision Flow Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(body: unknown): Request {
    return new Request('https://example.test/api/decision/evaluate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns allow for compliant low-risk inputs', async () => {
    const response = await evaluateDecisionFlow(basePayload);
    expect(response.decision).toBe('allow');
    expect(response.reason).toContain('passed');
    expect(mockAppendAuditRecord).toHaveBeenCalledWith(
      'decision.allow',
      expect.any(Object),
      expect.objectContaining({
        meta: expect.objectContaining({
          branch: 'decision',
          decision: 'allow',
        }),
      })
    );
  });

  it('returns deny when canonical fields are missing', async () => {
    const response = await evaluateDecisionFlow({
      ...basePayload,
      user: { ...basePayload.user, id: undefined },
    });

    expect(response.decision).toBe('deny');
    expect(response.reason).toContain('Missing required canonical fields');
    expect(response.requiredActions).toContain('fix_request_payload');
    expect(mockAppendAuditRecord).toHaveBeenCalledWith(
      'decision.validation.failed',
      expect.any(Object),
      expect.objectContaining({
        meta: expect.objectContaining({
          branch: 'validation_failure',
        }),
      })
    );
  });

  it('returns deny when device validation fails', async () => {
    const response = await evaluateDecisionFlow({
      ...basePayload,
      device: { ...basePayload.device, compliant: false },
    });

    expect(response.decision).toBe('deny');
    expect(response.requiredActions).toContain('reenroll_device');
    expect(mockAppendAuditRecord).toHaveBeenCalledWith(
      'decision.validation.failed',
      expect.any(Object),
      expect.objectContaining({
        meta: expect.objectContaining({
          branch: 'validation_failure',
        }),
      })
    );
  });

  it('returns step_up for elevated risk', async () => {
    const response = await evaluateDecisionFlow({
      ...basePayload,
      user: { ...basePayload.user, riskScore: 65 },
    });

    expect(response.decision).toBe('step_up');
    expect(response.requiredActions).toContain('mfa_challenge');
    expect(mockAppendAuditRecord).toHaveBeenCalledWith(
      'decision.step_up',
      expect.any(Object),
      expect.objectContaining({
        meta: expect.objectContaining({
          branch: 'decision',
          decision: 'step_up',
        }),
      })
    );
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
    expect(mockAppendAuditRecord).toHaveBeenCalledWith(
      'decision.engine_error',
      expect.any(Object),
      expect.objectContaining({
        meta: expect.objectContaining({
          branch: 'engine_error',
        }),
      })
    );
  });

  it('route rejects empty canonical fields with explicit missing fields', async () => {
    const response = await POST(
      makeRequest({
        ...basePayload,
        user: { ...basePayload.user, id: '   ' },
        action: { ...basePayload.action, type: '' },
      })
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { success: boolean; missingFields?: string[] };
    expect(body.success).toBe(false);
    expect(body.missingFields).toEqual(expect.arrayContaining(['user.id', 'action.type']));
  });
});
