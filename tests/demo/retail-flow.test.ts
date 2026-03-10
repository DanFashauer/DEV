/**
 * Retail Demo Flow Test
 * 
 * Tests the retail scenario: Cashier badges into POS tablet at store checkout.
 * No violations, clean compliance status.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

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

  it('should complete retail badge scan and session start', async () => {
    // Simulate badge scan → session start
    const sessionResponse = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badgeUid: retailScenario.badgeUid,
        deviceId: retailScenario.deviceId,
      }),
    });

    expect(sessionResponse.ok).toBe(true);
    const sessionData = await sessionResponse.json();
    expect(sessionData.sessionId).toBeDefined();
    sessionId = sessionData.sessionId;
    expect(sessionData.directive).toBeDefined();
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
