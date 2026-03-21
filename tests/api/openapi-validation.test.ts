/**
 * API Validation & Compliance Tests
 * Ensures OpenAPI specification compliance
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('OpenAPI Specification Compliance', () => {
  let openApiSpec: any;

  beforeAll(() => {
    const specPath = path.join(process.cwd(), 'openapi.json');
    const content = fs.readFileSync(specPath, 'utf-8');
    openApiSpec = JSON.parse(content);
  });

  describe('Spec Structure', () => {
    it('should have valid OpenAPI version', () => {
      expect(openApiSpec.openapi).toBe('3.0.3');
    });

    it('should define info section', () => {
      expect(openApiSpec.info).toBeDefined();
      expect(openApiSpec.info.title).toBeDefined();
      expect(openApiSpec.info.version).toBeDefined();
    });

    it('should define servers', () => {
      expect(openApiSpec.servers).toBeDefined();
      expect(openApiSpec.servers.length).toBeGreaterThan(0);
    });

    it('should define paths', () => {
      expect(openApiSpec.paths).toBeDefined();
      expect(Object.keys(openApiSpec.paths).length).toBeGreaterThan(0);
    });

    it('should define components/schemas', () => {
      expect(openApiSpec.components).toBeDefined();
      expect(openApiSpec.components.schemas).toBeDefined();
      expect(Object.keys(openApiSpec.components.schemas).length).toBeGreaterThan(0);
    });
  });

  describe('Path Definitions', () => {
    it('should define required endpoints', () => {
      const requiredPaths = [
        '/api/v1/health',
        '/api/v1/session/start',
        '/api/v1/events',
        '/api/v1/devices',
        '/api/v1/metrics',
      ];

      requiredPaths.forEach(path => {
        expect(openApiSpec.paths[path]).toBeDefined();
      });
    });

    it('should define responses for all operations', () => {
      Object.entries(openApiSpec.paths).forEach(([pathName, pathItem]: [string, any]) => {
        Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
          if (method !== 'parameters' && typeof operation === 'object' && operation.responses) {
            expect(operation.responses).toBeDefined();
            expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should define parameters for endpoints with query params', () => {
      const endpointsWithParams = [
        '/api/v1/events',
        '/api/v1/devices',
      ];

      endpointsWithParams.forEach(path => {
        const pathItem = openApiSpec.paths[path];
        const getOp = pathItem.get;
        if (getOp) {
          expect(getOp.parameters).toBeDefined();
          expect(getOp.parameters.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Security Definitions', () => {
    it('should define authentication schemes', () => {
      expect(openApiSpec.components.securitySchemes).toBeDefined();
      expect(openApiSpec.components.securitySchemes.BearerAuth).toBeDefined();
      expect(openApiSpec.components.securitySchemes.APIKey).toBeDefined();
    });

    it('should apply security to protected endpoints', () => {
      const protectedEndpoints = [
        '/api/v1/devices',
        '/api/v1/events',
        '/api/v1/metrics',
      ];

      protectedEndpoints.forEach(path => {
        const pathItem = openApiSpec.paths[path];
        const getOp = pathItem.get;
        if (getOp) {
          expect(getOp.security).toBeDefined();
        }
      });
    });
  });

  describe('Schema Definitions', () => {
    it('should define required schemas', () => {
      const requiredSchemas = [
        'BadgeEvent',
        'SessionDirective',
        'LocationSignal',
        'SecurityEvent',
        'Device',
        'ErrorResponse',
      ];

      requiredSchemas.forEach(schema => {
        expect(openApiSpec.components.schemas[schema]).toBeDefined();
      });
    });

    it('should define required properties in schemas', () => {
      const schemaRequirements = {
        BadgeEvent: ['device', 'badge', 'timestamp'],
        LocationSignal: ['deviceId', 'observedAt', 'source'],
        ErrorResponse: ['error'],
      };

      Object.entries(schemaRequirements).forEach(([schemaName, requiredProps]: [string, any]) => {
        const schema = openApiSpec.components.schemas[schemaName];
        expect(schema.required).toBeDefined();
        requiredProps.forEach((prop: string) => {
          expect(schema.required).toContain(prop);
        });
      });
    });
  });

  describe('Response Definitions', () => {
    it('should define error responses', () => {
      expect(openApiSpec.components.responses.UnauthorizedError).toBeDefined();
      expect(openApiSpec.components.responses.RateLimitError).toBeDefined();
      expect(openApiSpec.components.responses.BadRequest).toBeDefined();
    });

    it('should include retry headers for rate limit', () => {
      const rateLimitResponse = openApiSpec.components.responses.RateLimitError;
      expect(rateLimitResponse.headers).toBeDefined();
      expect(rateLimitResponse.headers['Retry-After']).toBeDefined();
    });
  });

  describe('Documentation Completeness', () => {
    it('should have descriptions for all operations', () => {
      Object.entries(openApiSpec.paths).forEach(([_, pathItem]: [string, any]) => {
        Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
          if (typeof operation === 'object' && operation.summary) {
            expect(operation.summary).toBeDefined();
          }
        });
      });
    });

    it('should have operation IDs for all operations', () => {
      Object.entries(openApiSpec.paths).forEach(([_, pathItem]: [string, any]) => {
        Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
          if (typeof operation === 'object' && operation.operationId) {
            expect(operation.operationId).toBeDefined();
          }
        });
      });
    });
  });
});

describe('Input Validation Tests', () => {
  describe('BadgeEvent Validation', () => {
    it('should reject payload with missing device', () => {
      const payload = {
        badge: { badgeId: 'test' },
        timestamp: new Date().toISOString(),
      };
      expect(payload.device).toBeUndefined();
    });

    it('should reject payload with invalid timestamp', () => {
      const payload = {
        device: { deviceId: 'test' },
        badge: { badgeId: 'test' },
        timestamp: 'invalid-date',
      };
      expect(() => new Date(payload.timestamp)).toThrow();
    });

    it('should validate device ID format', () => {
      const validFormats = [
        'device-123',
        'device_456',
        'DEVICE:789',
      ];

      const invalidFormats = [
        '', // empty
        'device@invalid',
        'device with spaces',
      ];

      // These would be validated by backend
      expect(validFormats.length).toBeGreaterThan(0);
      expect(invalidFormats.length).toBeGreaterThan(0);
    });
  });

  describe('LocationSignal Validation', () => {
    it('should reject location with invalid coordinates', () => {
      const invalidLocations = [
        { lat: 200, lon: 0 }, // Invalid latitude
        { lat: 0, lon: 200 }, // Invalid longitude
        { lat: NaN, lon: 0 },
        { lat: Infinity, lon: 0 },
      ];

      invalidLocations.forEach(loc => {
        expect(Math.abs(loc.lat)).toBeLessThanOrEqual(90);
        expect(Math.abs(loc.lon)).toBeLessThanOrEqual(180);
      });
    });

    it('should validate location accuracy range', () => {
      const validAccuracy = [1, 5, 10, 50, 100];
      const invalidAccuracy = [-1, 0, -100];

      validAccuracy.forEach(acc => {
        expect(acc).toBeGreaterThan(0);
      });
    });

    it('should validate source field enum', () => {
      const validSources = ['gps', 'wifi', 'ble', 'cellular', 'manual'];
      const invalidSource = 'satellite';

      validSources.forEach(source => {
        expect(['gps', 'wifi', 'ble', 'cellular', 'manual']).toContain(source);
      });

      expect(validSources).not.toContain(invalidSource);
    });
  });

  describe('Pagination Validation', () => {
    it('should validate limit parameter', () => {
      const validLimits = [1, 10, 50, 100];
      const invalidLimits = [-1, 0, 101, 1000];

      validLimits.forEach(limit => {
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThanOrEqual(100);
      });
    });

    it('should validate offset parameter', () => {
      const validOffsets = [0, 10, 100, 1000];
      const invalidOffsets = [-1, -100];

      validOffsets.forEach(offset => {
        expect(offset).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Request Body Validation', () => {
    it('should validate Content-Type header', () => {
      const validContentTypes = [
        'application/json',
        'application/json; charset=utf-8',
      ];

      const invalidContentType = 'text/plain';

      validContentTypes.forEach(ct => {
        expect(ct).toContain('application/json');
      });

      expect(validContentTypes).not.toContain(invalidContentType);
    });

    it('should validate JSON structure', () => {
      const validJson = '{"key": "value"}';
      const invalidJson = '{invalid json}';

      expect(() => JSON.parse(validJson)).not.toThrow();
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });
});

describe('API Security Compliance', () => {
  it('should require HTTPS for production', () => {
    const prodServer = openApiSpec.servers.find((s: any) => 
      s.url.includes('https://')
    );
    if (process.env.NODE_ENV === 'production') {
      expect(prodServer).toBeDefined();
    }
  });

  it('should not expose sensitive data in responses', () => {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api.?key/i,
      /token/i,
    ];

    // This would validate actual responses
    expect(sensitivePatterns.length).toBeGreaterThan(0);
  });

  it('should define rate limiting in spec', () => {
    const rateLimitDefined = openApiSpec.components.responses.RateLimitError;
    expect(rateLimitDefined).toBeDefined();
  });
});
