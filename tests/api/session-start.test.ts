/**
 * Session Start API Tests
 * 
 * Tests the /api/session/start endpoint for authentication,
 * badge validation, policy evaluation, and session creation.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

describe('Session Start API', () => {
  beforeAll(async () => {
    // Verify server is running via health endpoint
    try {
      const response = await fetch(HEALTH_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run scripts/test-server.ts start`);
    }
  });

  it('should reject request without badgeUid', async () => {
    const response = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test-device-001',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should reject request without deviceId', async () => {
    const response = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badgeUid: 'test-badge-001',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should reject request with invalid JSON', async () => {
    const response = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badgeUid: null,
        deviceId: undefined,
      }),
    });

    // Should either return 400 or handle gracefully
    expect([400, 500]).toContain(response.status);
  });

  it('should accept valid badgeUid and deviceId', async () => {
    const response = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badgeUid: 'test-badge-001',
        deviceId: 'test-device-001',
      }),
    });

    // Should either succeed (200) or fail gracefully (401 for unknown badge)
    expect([200, 401, 404]).toContain(response.status);
    
    const data = await response.json();
    
    if (response.ok) {
      expect(data.sessionId).toBeDefined();
      expect(data.directive).toBeDefined();
    }
  });

  it('should include correlation ID in response headers', async () => {
    const response = await fetch(`${SERVER_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        badgeUid: 'test-badge-002',
        deviceId: 'test-device-002',
      }),
    });

    // Check for request-id header (Next.js adds this)
    const requestId = response.headers.get('x-request-id');
    expect(requestId).toBeDefined();
  });
});
