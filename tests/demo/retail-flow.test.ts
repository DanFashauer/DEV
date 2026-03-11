/**
 * Retail Demo Flow Test
 * 
 * Tests the retail scenario: Cashier badges into POS tablet at store checkout.
 * No violations, clean compliance status.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSignedSessionRequest } from '../helpers/signedRequest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

// Demo scenario configuration
const retailScenario = {
  name: "Retail - POS Tablet",
  deviceId: "POS-Tablet-Store-42",
  badgeUid: "badge-retail-001",
  user: "bob.cashier@retail.com",
  riskLevel: "low",
  violations: [],
};

describe('Retail Demo Flow', () => {
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
          badgeUid: retailScenario.badgeUid,
          userId: retailScenario.user,
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

  it('should complete retail badge scan and session start', async () => {
    // Simulate badge scan → session start with properly signed request
    const signedRequest = await createSignedSessionRequest(SERVER_URL, {
      badgeUid: retailScenario.badgeUid,
      deviceId: retailScenario.deviceId,
      deviceSerial: retailScenario.deviceId,
      deviceModel: 'iPad Pro 11"',
      readerType: 'ble',
      userId: retailScenario.user,
      userName: 'Bob Cashier',
    });

    const sessionResponse = await fetch(`${SERVER_URL}/api/session/start`, signedRequest);

    expect(sessionResponse.ok).toBe(true);
    const sessionData = await sessionResponse.json();
    // API returns { success: true, session: { sessionId, nextAction, ... } }
    expect(sessionData.session?.sessionId).toBeDefined();
    sessionId = sessionData.session.sessionId;
    expect(sessionData.session?.nextAction || sessionData.session?.directive?.action).toBeDefined();
  });

  it('should allow session polling', async () => {
    if (!sessionId) {
      // Skip if no session was created
      return;
    }

    const pollResponse = await fetch(`${SERVER_URL}/api/session/${sessionId}`);
    
    // Should either return session state or 404 if expired
    expect([200, 404]).toContain(pollResponse.status);
  });
});
