/**
 * WebAuthn Admin API Tests
 * 
 * Tests the /api/admin/webauthn endpoints for registration
 * and authentication of admin credentials.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3010';
const HEALTH_URL = `${SERVER_URL}/api/health`;

describe('WebAuthn Admin API', () => {
  beforeAll(async () => {
    // Verify server is running via health endpoint
    try {
      const response = await fetch(HEALTH_URL);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Server not reachable at ${SERVER_URL}. Start with: bun run scripts/test-server.ts start`);
    }
  });

  describe('Registration', () => {
    it('should have registration options endpoint', async () => {
      const response = await fetch(
        `${SERVER_URL}/api/admin/webauthn/register/options`,
        { method: 'OPTIONS' }
      );
      
      // Should handle OPTIONS or return method not allowed
      expect([200, 405]).toContain(response.status);
    });

    it('should reject registration without auth', async () => {
      const response = await fetch(
        `${SERVER_URL}/api/admin/webauthn/register/options`,
        { method: 'POST' }
      );
      
      // Should require authentication
      expect([401, 403]).toContain(response.status);
    });

    it('should reject verification without auth', async () => {
      const response = await fetch(
        `${SERVER_URL}/api/admin/webauthn/register/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: {},
          }),
        }
      );
      
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Authentication', () => {
    it('should have authentication options endpoint', async () => {
      const response = await fetch(
        `${SERVER_URL}/api/admin/webauthn/auth/options`,
        { method: 'OPTIONS' }
      );
      
      expect([200, 405]).toContain(response.status);
    });

    it('should reject authentication without credentials', async () => {
      const response = await fetch(
        `${SERVER_URL}/api/admin/webauthn/auth/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credential: {},
          }),
        }
      );
      
      // Should fail with invalid credential
      expect([400, 401, 403]).toContain(response.status);
    });
  });
});
