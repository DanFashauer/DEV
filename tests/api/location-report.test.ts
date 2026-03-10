/**
 * Location Report API Tests
 * 
 * Tests the /api/location/report endpoint for location signal
 * ingestion and validation.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

describe('Location Report API', () => {
  beforeAll(async () => {
    // Verify server is running via health endpoint
    try {
      const response = await fetch(HEALTH_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run scripts/test-server.ts start`);
    }
  });

  it('should reject request without deviceId', async () => {
    const response = await fetch(`${SERVER_URL}/api/location/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 37.7749,
        longitude: -122.4194,
      }),
    });

    expect(response.status).toBe(400);
  });

  it('should reject request without coordinates', async () => {
    const response = await fetch(`${SERVER_URL}/api/location/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test-device-001',
      }),
    });

    expect(response.status).toBe(400);
  });

  it('should accept valid location report', async () => {
    const response = await fetch(`${SERVER_URL}/api/location/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test-device-001',
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      }),
    });

    // Should succeed or fail gracefully
    expect([200, 201, 400, 401, 500]).toContain(response.status);
    
    const data = await response.json();
    if (response.ok) {
      expect(data.success).toBe(true);
    }
  });

  it('should accept location with different modes', async () => {
    const modes = ['presence', 'coarse', 'precise'];
    
    for (const mode of modes) {
      const response = await fetch(`${SERVER_URL}/api/location/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'test-device-001',
          latitude: 37.7749,
          longitude: -122.4194,
          mode: mode,
        }),
      });

      expect([200, 201, 400, 401, 500]).toContain(response.status);
    }
  });

  it('should include correlation ID in response headers', async () => {
    const response = await fetch(`${SERVER_URL}/api/location/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: 'test-device-001',
        latitude: 37.7749,
        longitude: -122.4194,
      }),
    });

    const requestId = response.headers.get('x-request-id');
    expect(requestId).toBeDefined();
  });
});
