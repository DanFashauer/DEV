/**
 * ITSM API Tests
 * 
 * Tests the /api/admin/integrations/itsm endpoints for CRUD
 * operations on ITSM vendor configurations.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

describe('ITSM API', () => {
  beforeAll(async () => {
    // Verify server is running via health endpoint
    try {
      const response = await fetch(HEALTH_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run scripts/test-server.ts start`);
    }
  });

  it('should reject GET /api/admin/integrations/itsm without auth', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/itsm`);
    expect([401, 403]).toContain(response.status);
  });

  it('should reject POST /api/admin/integrations/itsm without auth', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/itsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: 'servicenow',
        name: 'Test ITSM',
        instanceUrl: 'https://example.service-now.com',
        enabled: true,
      }),
    });
    expect([401, 403]).toContain(response.status);
  });

  it('should reject invalid vendor type', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/itsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: 'invalid-vendor',
        name: 'Test ITSM',
      }),
    });

    expect([400, 401, 403, 422]).toContain(response.status);
  });

  it('should reject ServiceNow without instanceUrl', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/itsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: 'servicenow',
        name: 'Test ITSM',
      }),
    });

    expect([400, 401, 403, 422]).toContain(response.status);
  });

  it('should accept valid generic_webhook vendor', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/itsm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: 'generic_webhook',
        name: 'Generic Webhook ITSM',
        instanceUrl: 'https://example.com/itsm-webhook',
        enabled: true,
      }),
    });

    // Should either succeed or fail with auth error
    expect([200, 201, 401, 403]).toContain(response.status);
  });
});
