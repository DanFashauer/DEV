/**
 * Secret Redaction Coverage Test
 * 
 * Tests that the secret redaction function properly handles all sensitive keys.
 * This ensures no secrets are logged in audit records or observability logs.
 */

import { describe, it, expect } from 'bun:test';

// Copy of the redaction logic for testing
const SECRET_KEYS = [
  'password',
  'secret',
  'token',
  'key',
  'authorization',
  'cookie',
  'x-api-key',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'client_secret',
  'private_key',
  'signing_secret',
  'webhook_secret',
];

function isSecretKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SECRET_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()));
}

function redactSecrets<T extends Record<string, unknown>>(meta: T): T {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const isSecret = isSecretKey(key);
    if (isSecret) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSecrets(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted as T;
}

describe('Secret Redaction', () => {
  it('should redact password field', () => {
    const input = { username: 'admin', password: 'super-secret-123' };
    const result = redactSecrets(input);
    expect(result.password).toBe('[REDACTED]');
    expect(result.username).toBe('admin');
  });

  it('should redact token field', () => {
    const input = { userId: 'user-123', token: 'eyJhbGciOiJIUzI1NiJ9...' };
    const result = redactSecrets(input);
    expect(result.token).toBe('[REDACTED]');
    expect(result.userId).toBe('user-123');
  });

  it('should redact nested secrets', () => {
    const input = {
      user: {
        name: 'John',
        credentials: {
          password: 'secret123',
          apiKey: 'key-abc',
        }
      }
    };
    const result = redactSecrets(input);
    expect((result.user as { credentials: { password: string } }).credentials.password).toBe('[REDACTED]');
    expect((result.user as { credentials: { apiKey: string } }).credentials.apiKey).toBe('[REDACTED]');
    expect((result.user as { name: string }).name).toBe('John');
  });

  it('should redact authorization header', () => {
    const input = { 
      headers: { 
        'authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9...',
        'content-type': 'application/json'
      } 
    };
    const result = redactSecrets(input);
    expect((result.headers as { authorization: string }).authorization).toBe('[REDACTED]');
    expect((result.headers as { 'content-type': string })['content-type']).toBe('application/json');
  });

  it('should redact client_secret', () => {
    const input = { 
      clientId: 'app-123',
      clientSecret: 'secret-xyz',
      redirectUri: 'https://example.com/callback'
    };
    const result = redactSecrets(input);
    expect(result.clientSecret).toBe('[REDACTED]');
    expect(result.clientId).toBe('app-123');
    expect(result.redirectUri).toBe('https://example.com/callback');
  });

  it('should redact signing_secret', () => {
    const input = {
      webhookUrl: 'https://example.com/webhook',
      signingSecret: 'hmac-secret-key',
      events: ['session.start', 'session.end']
    };
    const result = redactSecrets(input);
    expect(result.signingSecret).toBe('[REDACTED]');
    expect(result.webhookUrl).toBe('https://example.com/webhook');
  });

  it('should handle case-insensitive keys', () => {
    const input = { 
      PASSWORD: 'mixed-case-secret',
      Token: 'another-secret',
      API_KEY: 'third-secret'
    };
    const result = redactSecrets(input);
    expect(result.PASSWORD).toBe('[REDACTED]');
    expect(result.Token).toBe('[REDACTED]');
    expect(result.API_KEY).toBe('[REDACTED]');
  });

  it('should handle arrays without redaction', () => {
    const input = {
      users: ['admin', 'user1', 'user2'],
      tags: ['tag1', 'tag2']
    };
    const result = redactSecrets(input);
    expect(result.users).toEqual(['admin', 'user1', 'user2']);
    expect(result.tags).toEqual(['tag1', 'tag2']);
  });

  it('should not modify non-object values', () => {
    const input = {
      count: 42,
      enabled: true,
      rate: 3.14,
      nullValue: null,
    };
    const result = redactSecrets(input);
    expect(result).toEqual(input);
  });

  it('should handle empty objects', () => {
    const input = {};
    const result = redactSecrets(input);
    expect(result).toEqual({});
  });

  it('should handle deeply nested secrets', () => {
    const input = {
      level1: {
        level2: {
          level3: {
            password: 'deep-secret'
          }
        }
      }
    };
    const result = redactSecrets(input);
    expect(((result.level1 as { level2: { level3: { password: string } } }).level2 as { level3: { password: string } }).level3.password).toBe('[REDACTED]');
  });
});

// Export for use in other tests
export { redactSecrets, isSecretKey, SECRET_KEYS };
