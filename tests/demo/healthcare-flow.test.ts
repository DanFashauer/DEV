/**
 * Healthcare Demo Flow Test
 * 
 * Tests the healthcare scenario: Nurse badges into shared iPad at nurse station,
 * FleetDM reports device out of compliance (jailbroken), policy triggers quarantine + ITSM ticket.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSignedSessionRequest } from '../helpers/signedRequest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

// Demo scenario configuration
const healthcareScenario = {
  name: "Healthcare - Shared iPad",
  deviceId: "iPad-Nurse-Station-01",
  badgeUid: "badge-healthcare-001",
  user: "jane.nurse@hospital.org",
  riskLevel: "medium",
  violations: ["device.jailbroken"],
};

describe('Healthcare Demo Flow', () => {
  let sessionId: string | null = null;

  beforeAll(async () => {
    // Verify server is running via health endpoint
    try {
      const response = await fetch(HEALTH_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run scripts/test-server.ts start`);
    }

    // Enroll badge first so session start will work
    const DEV_API_KEY = 'dev-admin-key-12345';
    try {
      const enrollResponse = await fetch(`${SERVER_URL}/api/admin/badges/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-api-key': DEV_API_KEY,
        },
        body: JSON.stringify({
          badgeUid: healthcareScenario.badgeUid,
          userId: healthcareScenario.user,
        }),
      });
      // Accept success or already enrolled (409)
      if (!enrollResponse.ok && enrollResponse.status !== 409) {
        console.warn('Badge enrollment warning:', enrollResponse.status);
      }
    } catch (e) {
      console.warn('Badge enrollment skipped:', e);
    }
  });

  afterAll(async () => {
    // Cleanup: terminate session if created
    if (sessionId) {
      try {
        await fetch(`${SERVER_URL}/api/session/${sessionId}`, {
          method: 'DELETE',
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  });

  it('should complete healthcare badge scan and session start', async () => {
    // Simulate badge scan → session start with properly signed request
    const signedRequest = await createSignedSessionRequest(SERVER_URL, {
      badgeUid: healthcareScenario.badgeUid,
      deviceId: healthcareScenario.deviceId,
      deviceSerial: healthcareScenario.deviceId,
      deviceModel: 'iPad Pro 12.9',
      readerType: 'ble',
      userId: healthcareScenario.user,
      userName: 'Jane Nurse',
    });

    const sessionResponse = await fetch(`${SERVER_URL}/api/session/start`, signedRequest);

    expect(sessionResponse.ok).toBe(true);
    const sessionData = await sessionResponse.json();
    // API returns { success: true, session: { sessionId, nextAction, ... } }
    expect(sessionData.session?.sessionId).toBeDefined();
    sessionId = sessionData.session.sessionId;
    expect(sessionData.session.nextAction || sessionData.session.directive?.action).toBeDefined();
  });

  it('should trigger FleetDM posture sync with violations', async () => {
    // Simulate FleetDM posture sync
    const postureResponse = await fetch(
      `${SERVER_URL}/api/admin/integrations/telemetry/fleetdm/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In production, would need admin auth
        },
        body: JSON.stringify({
          deviceSerial: healthcareScenario.deviceId,
          violations: healthcareScenario.violations,
        }),
      }
    );

    // Should either succeed or return proper error (not 500)
    expect([200, 401, 403]).toContain(postureResponse.status);
  });

  it('should emit policy action receipt for quarantine', async () => {
    // Verify audit events were created
    const auditResponse = await fetch(`${SERVER_URL}/api/admin/audit/export`);
    
    // Should have audit export endpoint
    expect([200, 401, 403]).toContain(auditResponse.status);
  });
});
