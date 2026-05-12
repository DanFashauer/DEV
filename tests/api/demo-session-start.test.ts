import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/demo/session-start/route';
import { demoScenarios } from '@/lib/demo/scenarios';

function makeRequest(body: unknown): Request {
  return new Request('https://example.test/api/demo/session-start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/demo/session-start', () => {
  it('returns deterministic safe demo output for each buyer scenario', async () => {
    for (const scenario of demoScenarios) {
      const response = await POST(makeRequest({ scenarioId: scenario.id }));
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toMatchObject({
        success: scenario.outcome === 'ACCESS_GRANTED',
        decision: scenario.outcome === 'ACCESS_GRANTED' ? 'ACCESS_GRANTED' : 'ACCESS_DENIED',
        actions: expect.any(Array),
        riskScore: scenario.riskScore,
        riskLevel: scenario.riskLevel,
        demo: {
          simulated: true,
          demoMode: true,
          scenarioId: scenario.id,
          outcome: scenario.outcome,
          simulatedHttpStatus: scenario.simulatedHttpStatus,
          safe: {
            deterministicDataOnly: true,
            webhooksCalled: false,
            productionDataMutated: false,
            secretsExposed: false,
          },
          operatorMessage: scenario.operatorMessage,
          audit: scenario.audit,
        },
      });
      expect(payload.demo.signals).toHaveLength(4);
      expect(payload.demo.timeline).toHaveLength(4);

      if (scenario.outcome === 'ACCESS_GRANTED') {
        expect(payload.session).toEqual({
          sessionId: `demo-session-${scenario.id}`,
          expiresAt: '2026-01-01T00:15:00.000Z',
          nextAction: 'LAUNCH_APP',
          bundleId: 'com.example.enterpriseapp',
        });
      } else {
        expect(payload.session).toBeUndefined();
        expect(payload.code).toBe(scenario.outcome);
        expect(payload.error).toBeDefined();
      }
    }
  });

  it('covers the three core runtime decision outcomes', async () => {
    expect(demoScenarios.map((scenario) => scenario.outcome).sort()).toEqual([
      'ACCESS_GRANTED',
      'DEVICE_NON_COMPLIANT',
      'DEVICE_POSTURE_UNKNOWN',
    ]);
  });

  it('rejects unknown scenarios without starting a demo session or exposing secrets', async () => {
    const response = await POST(makeRequest({ scenarioId: 'real-production-session' }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toMatchObject({
      success: false,
      decision: 'ACCESS_DENIED',
      error: 'Invalid demo scenario',
      code: 'INVALID_DEMO_SCENARIO',
      demo: {
        simulated: true,
        demoMode: true,
        safe: {
          deterministicDataOnly: true,
          webhooksCalled: false,
          productionDataMutated: false,
          secretsExposed: false,
        },
      },
    });
    expect(payload.validScenarioIds).toEqual(['compliant', 'non-compliant', 'unknown']);
  });
});
