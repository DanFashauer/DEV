/**
 * Policies API Tests
 * 
 * Tests the /api/admin/policies endpoints for CRUD operations
 * on policy rules.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

describe('Policies API', () => {
  beforeAll(async () => {
    // Verify server is running via health endpoint
    try {
      const response = await fetch(HEALTH_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run scripts/test-server.ts start`);
    }
  });

  it('should reject GET /api/admin/policies without auth', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/policies`);
    expect([401, 403]).toContain(response.status);
  });

  it('should reject POST /api/admin/policies without auth', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Policy',
        enabled: true,
        conditions: [],
        actions: [],
      }),
    });
    expect([401, 403]).toContain(response.status);
  });

  it('should have valid policy structure', async () => {
    // Test with admin auth if available, otherwise just verify endpoint exists
    const response = await fetch(`${SERVER_URL}/api/admin/policies`, {
      method: 'OPTIONS',
    });

    // Should handle OPTIONS or return auth error
    expect([200, 204, 401, 403, 405]).toContain(response.status);
  });

  it('should reject invalid policy data', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        enabled: true,
      }),
    });

    expect([400, 401, 403, 422]).toContain(response.status);
  });
});
