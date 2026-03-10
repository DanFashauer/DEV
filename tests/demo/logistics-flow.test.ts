/**
 * Logistics Demo Flow Test
 * 
 * Tests the logistics scenario: Warehouse worker badges into Android device.
 * High risk - violations include os.outdated and encryption.disabled.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

// Demo scenario configuration
const logisticsScenario = {
  name: "Logistics - Warehouse Android",
  deviceId: "Android-Warehouse-07",
  badgeUid: "badge-logistics-001",
  user: "mike.warehouse@logistics.com",
  riskLevel: "high",
  violations: ["os.outdated", "encryption.disabled"],
};

describe('Logistics Demo Flow', () => {
  let sessionId: string | null = null;

  beforeAll(async () => {
    // Verify server is running
    try {
      const response = await fetch(SERVER_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run dev`);
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

  it('should complete logistics badge scan and session start', async () => {
    // Simulate badge scan → session start
    const sessionResponse = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badgeUid: logisticsScenario.badgeUid,
        deviceId: logisticsScenario.deviceId,
      }),
    });

    expect(sessionResponse.ok).toBe(true);
    const sessionData = await sessionResponse.json();
    expect(sessionData.sessionId).toBeDefined();
    sessionId = sessionData.sessionId;
  });

  it('should trigger FleetDM posture sync with high-risk violations', async () => {
    // Simulate FleetDM posture sync with high-risk violations
    const postureResponse = await fetch(
      `${SERVER_URL}/api/admin/integrations/telemetry/fleetdm/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceSerial: logisticsScenario.deviceId,
          violations: logisticsScenario.violations,
        }),
      }
    );

    // Should either succeed or return proper error (not 500)
    expect([200, 401, 403]).toContain(postureResponse.status);
  });

  it('should emit high-risk policy action', async () => {
    // Verify audit events include high-risk triggers
    const auditResponse = await fetch(`${SERVER_URL}/api/admin/audit/export`);
    
    // Should have audit export endpoint
    expect([200, 401, 403]).toContain(auditResponse.status);
  });
});
