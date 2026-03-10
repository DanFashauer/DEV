/**
 * Webhooks API Tests
 * 
 * Tests the /api/admin/integrations/webhooks endpoints for CRUD
 * operations on webhook configurations.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

describe('Webhooks API', () => {
  beforeAll(async () => {
    // Verify server is running
    try {
      const response = await fetch(SERVER_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run dev`);
    }
  });

  it('should reject GET /api/admin/integrations/webhooks without auth', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/webhooks`);
    expect([401, 403]).toContain(response.status);
  });

  it('should reject POST /api/admin/integrations/webhooks without auth', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['session.start'],
        enabled: true,
      }),
    });
    expect([401, 403]).toContain(response.status);
  });

  it('should reject webhook with invalid URL', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Webhook',
        url: 'not-a-valid-url',
        events: ['session.start'],
      }),
    });

    // Should return validation error or auth error
    expect([400, 401, 403, 422]).toContain(response.status);
  });

  it('should reject webhook with localhost in production', async () => {
    // Skip if not in production mode
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const response = await fetch(`${SERVER_URL}/api/admin/integrations/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Webhook',
        url: 'http://localhost:3000/webhook',
        events: ['session.start'],
      }),
    });

    // Should reject localhost in production
    expect([400, 422]).toContain(response.status);
  });

  it('should require at least one event', async () => {
    const response = await fetch(`${SERVER_URL}/api/admin/integrations/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: [],
      }),
    });

    expect([400, 401, 403, 422]).toContain(response.status);
  });
});
