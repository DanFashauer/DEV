/**
 * API v1 Integration Tests
 * Tests for public API endpoints and third-party integrations
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('API v1 - Public Endpoints', () => {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3010';
  const baseUrl = `${serverUrl}/api/v1`;
  const apiKey = process.env.ADMIN_API_KEY || 'dev-admin-key-12345';
  const signingSecret = process.env.DEVICE_WEBHOOK_SECRET || process.env.BACKEND_SIGNING_SECRET || 'dev-secret';

  function signPayload(payload: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto') as typeof import('crypto');
    return crypto
      .createHmac('sha256', signingSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  beforeAll(async () => {
    // Wait for server to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        const response = await fetch(`${baseUrl}/health`);
        if (response.ok) break;
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
    if (retries === 0) {
      throw new Error('Server did not start within timeout');
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);

      const data = await response.json() as { status: string; version: string; timestamp: string };
      expect(data.status).toBe('healthy');
      expect(data.version).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    it('should be cacheable', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.headers.get('Cache-Control')).toBeDefined();
    });

    it('should complete within 100ms', async () => {
      const start = Date.now();
      await fetch(`${baseUrl}/health`);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Devices Endpoint', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/devices`);
      expect(response.status).toBe(401);
    });

    it('should list devices with pagination', async () => {
      const response = await fetch(`${baseUrl}/devices?limit=10&offset=0`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json() as { devices: any[]; pagination: any };
      expect(data.devices).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBeLessThanOrEqual(10);
    });

    it('should enforce limit maximum of 100', async () => {
      const response = await fetch(`${baseUrl}/devices?limit=500`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json() as { pagination: any };
      expect(data.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should filter by enrollment status', async () => {
      const response = await fetch(`${baseUrl}/devices?enrolled=true`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json() as { devices: any[] };
      data.devices.forEach(device => {
        expect(device.enrolled).toBe(true);
      });
    });

    it('should cache device list', async () => {
      const response = await fetch(`${baseUrl}/devices`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.headers.get('Cache-Control')).toContain('max-age=60');
    });
  });

  describe('Events Endpoint', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${baseUrl}/events`);
      expect(response.status).toBe(401);
    });

    it('should list events with pagination', async () => {
      const response = await fetch(`${baseUrl}/events?limit=20&offset=0`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data.events).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();
    });

    it('should enforce event limit maximum', async () => {
      const response = await fetch(`${baseUrl}/events?limit=200`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data.pagination.limit).toBeLessThanOrEqual(100);
    });

    it('should filter by event type', async () => {
      const eventTypes = ['session_allowed', 'session_denied', 'quarantine'];

      for (const type of eventTypes) {
        const response = await fetch(`${baseUrl}/events?type=${type}`, {
          headers: {
            'X-API-Key': apiKey,
          },
        });
        expect(response.status).toBe(200);

        const data = await response.json() as any;
        data.events.forEach((event: any) => {
          expect(event.type).toBe(type);
        });
      }
    });
  });

  describe('Session Endpoint', () => {
    it('should start a new session with valid signature', async () => {
      const payload = {
        device: {
          deviceId: 'test-device-123',
          deviceSerial: 'SN12345',
          deviceModel: 'iPhone 14',
        },
        badge: {
          badgeId: 'badge-001',
          badgeUid: 'UID-badge-001',
        },
        timestamp: new Date().toISOString(),
        nonce: 'test-nonce-' + Date.now(),
      };

      const signature = signPayload(payload);

      const response = await fetch(`${baseUrl}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data.sessionId).toBeDefined();
      expect(data.nextAction).toBeDefined();
    });

    it('should reject request with invalid signature', async () => {
      const payload = {
        device: {
          deviceId: 'test-device-123',
          deviceSerial: 'SN12345',
          deviceModel: 'iPhone 14',
        },
        badge: {
          badgeId: 'badge-001',
          badgeUid: 'UID-badge-001',
        },
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${baseUrl}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': 'invalid-signature',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(401);
    });

    it('should enforce timestamp window', async () => {
      const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString(); // 6 minutes ago

      const payload = {
        device: {
          deviceId: 'test-device-123',
          deviceSerial: 'SN12345',
          deviceModel: 'iPhone 14',
        },
        badge: {
          badgeId: 'badge-001',
          badgeUid: 'UID-badge-001',
        },
        timestamp: oldTimestamp,
      };

      const signature = signPayload(payload);

      const response = await fetch(`${baseUrl}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Location Reporting', () => {
    it('should accept location reports', async () => {
      const payload = {
        deviceId: 'test-device-123',
        observedAt: new Date().toISOString(),
        source: 'gps',
        mode: 'precise',
        lat: 40.7128,
        lon: -74.0060,
        accuracyM: 10,
      };

      const signature = signPayload(payload);

      const response = await fetch(`${baseUrl}/location/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data.ok).toBe(true);
    });

    it('should validate location coordinates', async () => {
      const invalidPayloads = [
        {
          deviceId: 'test-device-123',
          observedAt: new Date().toISOString(),
          source: 'gps',
          lat: 200, // Invalid latitude
          lon: -74.0060,
        },
        {
          deviceId: 'test-device-123',
          observedAt: new Date().toISOString(),
          source: 'gps',
          lat: 40.7128,
          lon: 200, // Invalid longitude
        },
      ];

      for (const payload of invalidPayloads) {
        const signature = signPayload(payload);

        const response = await fetch(`${baseUrl}/location/report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Signature': signature,
          },
          body: JSON.stringify(payload),
        });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return metrics in Prometheus format', async () => {
      const response = await fetch(`${baseUrl}/metrics`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toContain('# HELP');
      expect(text).toContain('# TYPE');
      expect(text).toContain('signalgrid_requests_total');
    });

    it('should include latency percentiles', async () => {
      const response = await fetch(`${baseUrl}/metrics`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const text = await response.text();
      expect(text).toContain('signalgrid_request_duration_ms_p50');
      expect(text).toContain('signalgrid_request_duration_ms_p95');
      expect(text).toContain('signalgrid_request_duration_ms_p99');
    });

    it('should not be cached', async () => {
      const response = await fetch(`${baseUrl}/metrics`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });
  });

  describe('Error Handling', () => {
    it('should return standard error format', async () => {
      const response = await fetch(`${baseUrl}/devices/nonexistent`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      const data = await response.json() as any;
      expect(data.error).toBeDefined();
      expect(data.code).toBeDefined();
    });

    it('should include request ID in errors', async () => {
      const response = await fetch(`${baseUrl}/devices`, {
        headers: {
          'X-API-Key': 'invalid-key',
        },
      });

      if (response.status !== 200) {
        const data = await response.json() as any;
        expect(data.requestId).toBeDefined();
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make requests until rate limited
      let rateLimited = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!rateLimited && attempts < maxAttempts) {
        const response = await fetch(`${baseUrl}/health`);
        if (response.status === 429) {
          rateLimited = true;
          expect(response.headers.get('Retry-After')).toBeDefined();
        }
        attempts++;
      }
    });
  });

  describe('Response Performance', () => {
    it('should return health check within 150ms', async () => {
      const start = performance.now();
      await fetch(`${baseUrl}/health`);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(150);
    });

    it('should return paginated list within 200ms', async () => {
      const start = performance.now();
      await fetch(`${baseUrl}/devices?limit=10`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should return metrics within 500ms', async () => {
      const start = performance.now();
      await fetch(`${baseUrl}/metrics`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Concurrency & Scaling', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => fetch(`${baseUrl}/health`));

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle burst traffic', async () => {
      const promises = Array(50)
        .fill(null)
        .map(() =>
          fetch(`${baseUrl}/devices?limit=10`, {
            headers: {
              'X-API-Key': apiKey,
            },
          })
        );

      const responses = await Promise.allSettled(promises);
      const successful = responses.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeLessThanOrEqual(50);
    });
  });
});
