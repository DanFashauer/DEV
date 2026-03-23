/**
 * Backend validation module for BadgeEvent v1
 * 
 * Provides:
 * - HMAC-SHA256 request signature verification
 * - Replay attack prevention (nonce store)
 * - Schema validation using Zod
 */

import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { nonceStore, CONFIG } from './nonceStore';

/**
 * Configuration for request signing
 * Lazy-loaded to avoid build-time errors
 */
let signingSecret: string | null = null;

function getSigningSecret(): string {
  if (signingSecret) {
    return signingSecret;
  }
  
  const secret = process.env.BACKEND_SIGNING_SECRET;
  
  if (!secret) {
    // Only throw at runtime in production, not at build time
    // Use a flag to track if we've already warned
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      console.error('[SECURITY] BACKEND_SIGNING_SECRET must be set in production');
      throw new Error('[SECURITY] BACKEND_SIGNING_SECRET must be set in production');
    }
    console.warn('[SECURITY] Using insecure default secret - set BACKEND_SIGNING_SECRET for production');
    signingSecret = 'development-secret-key-do-not-use-in-production';
    return signingSecret;
  }
  
  if (secret.length < 32) {
    console.warn('[SECURITY] BACKEND_SIGNING_SECRET should be 32+ characters');
  }
  
  signingSecret = secret;
  return signingSecret;
}

const SIGNING_CONFIG = {
  /** Secret key for HMAC-SHA256 - must be set in production */
  get secretKey(): string {
    return getSigningSecret();
  },
  /** Time window for request validity (5 minutes in ms) */
  validityWindowMs: 5 * 60 * 1000,
};

/**
 * BadgeEvent v1 schema validation
 */
const BadgeDataSchema = z.object({
  badgeId: z.string().min(1),
  employeeId: z.string().optional(),
  cardSerialNumber: z.string().optional(),
});

const ReaderDataSchema = z.object({
  readerId: z.string().min(1),
  readerType: z.enum(['ble', 'usb', 'nfc']),
  readerName: z.string().optional(),
});

const DeviceDataSchema = z.object({
  deviceId: z.string().min(1),
  deviceSerial: z.string().min(1),
  deviceModel: z.string().min(1),
  osVersion: z.string().min(1),
});

const MDMDataSchema = z.object({
  enrolled: z.boolean(),
  managementId: z.string().optional(),
  personaAttributes: z.record(z.string(), z.string()).optional(),
});

const EventContextSchema = z.object({
  locationId: z.string().optional(),
  locationName: z.string().optional(),
  applicationId: z.string().optional(),
});

export const BadgeEventSchema = z.object({
  schemaVersion: z.literal('1.0'),
  eventType: z.literal('badge.scan'),
  eventId: z.string().uuid(),
  timestamp: z.string().datetime(),
  badge: BadgeDataSchema,
  reader: ReaderDataSchema,
  device: DeviceDataSchema,
  mdm: MDMDataSchema,
  context: EventContextSchema.optional(),
});

export type BadgeEvent = z.infer<typeof BadgeEventSchema>;

/**
 * Generate a random hex string
 */
export function generateRandomHex(byteLength: number): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generate a signature base string for HMAC
 * Format: METHOD|FFULL_URL|TIMESTAMP|NONCE|BODY_STRING
 */
function generateSignatureBase(
  method: string,
  fullUrl: string,
  timestamp: number,
  nonce: string,
  bodyString: string
): string {
  return `${method}|${fullUrl}|${timestamp}|${nonce}|${bodyString}`;
}

/**
 * Create HMAC-SHA256 signature
 */
function createSignature(data: string, key: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature using constant-time comparison
 */
function verifySignature(data: string, key: string, signature: string): boolean {
  const expectedSignature = createSignature(data, key);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  
  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

/**
 * Check if nonce exists and is still valid (per-device)
 * Uses Redis-backed store for production, in-memory for dev
 */
async function isNonceValid(deviceId: string, nonce: string): Promise<boolean> {
  // Try to set nonce atomically - returns false if already exists
  const added = await nonceStore.setNonce(deviceId, nonce);
  return added;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: 'missing_headers' | 'invalid_nonce' | 'invalid_timestamp' | 'invalid_signature' | 'invalid_schema' | 'replay_detected';
  event?: BadgeEvent;
}

/**
 * Validate and authorize a session start request
 * 
 * @param headers - Request headers containing signature, timestamp, nonce
 * @param body - Request body (parsed BadgeEvent)
 * @param fullUrl - Full URL of the request
 * @param method - HTTP method
 */
export async function validateAndAuthorizeSessionStart(
  headers: {
    'x-signature'?: string;
    'x-timestamp'?: string;
    'x-nonce'?: string;
  },
  body: unknown,
  fullUrl: string,
  method: string
): Promise<ValidationResult> {
  const { 'x-signature': signature, 'x-timestamp': timestamp, 'x-nonce': nonce } = headers;
  
  // DEV BYPASS: Only allow bypass in development with explicit opt-in
  // Never bypass in production or staging
  const isDevMode = process.env.NODE_ENV === 'development';
  const devBypassEnabled = process.env.ENABLE_DEV_BYPASS === 'true';
  const canBypass = isDevMode && devBypassEnabled;
  
  // 1. Check required headers (skip in dev mode only with explicit bypass enabled)
  if (!signature || !timestamp || !nonce) {
    if (canBypass) {
      // In dev mode with bypass enabled, skip security validation
      // Parse and return the body as-is
      const parseResult = BadgeEventSchema.safeParse(body);
      if (!parseResult.success) {
        return {
          valid: false,
          error: `Invalid BadgeEvent schema: ${parseResult.error.message}`,
          code: 'invalid_schema',
        };
      }
      return { valid: true, event: parseResult.data };
    }
    return {
      valid: false,
      error: 'Missing required security headers: x-signature, x-timestamp, x-nonce',
      code: 'missing_headers',
    };
  }

  // 2. Validate nonce length (minimum 16 characters)
  if (nonce.length < CONFIG.minNonceLength) {
    return { valid: false, error: `Nonce must be at least ${CONFIG.minNonceLength} characters`, code: 'invalid_nonce' };
  }

  // 3. Validate timestamp is within window
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { valid: false, error: 'Invalid timestamp format', code: 'invalid_timestamp' };
  }
  
  const now = Date.now();
  const timeDiff = Math.abs(now - requestTime);
  if (timeDiff > SIGNING_CONFIG.validityWindowMs) {
    return { valid: false, error: 'Request timestamp outside valid window', code: 'invalid_timestamp' };
  }

  // 4. Validate schema BEFORE signature verification (to get deviceId safely)
  const parseResult = BadgeEventSchema.safeParse(body);
  if (!parseResult.success) {
    return {
      valid: false,
      error: `Invalid BadgeEvent schema: ${parseResult.error.message}`,
      code: 'invalid_schema',
    };
  }
  
  const event = parseResult.data;

  // 5. Verify HMAC signature FIRST (before any stateful operations)
  const bodyString = JSON.stringify(body);
  const signatureBase = generateSignatureBase(
    method,
    fullUrl,
    requestTime,
    nonce,
    bodyString
  );
  
  if (!verifySignature(signatureBase, SIGNING_CONFIG.secretKey, signature)) {
    return { valid: false, error: 'Invalid signature', code: 'invalid_signature' };
  }

  // 6. Check replay prevention (nonce) - per-device isolation (LAST, after signature verified)
  const deviceId = event.device?.deviceId ?? 'unknown';
  
  if (!(await isNonceValid(deviceId, nonce))) {
    return { valid: false, error: 'Nonce already used or invalid', code: 'replay_detected' };
  }

  // All validations passed
  return {
    valid: true,
    event,
  };
}

/**
 * Generate expected signature for iOS to include
 * (For testing/documentation purposes)
 */
export function generateExpectedSignature(
  method: string,
  fullUrl: string,
  timestamp: number,
  nonce: string,
  bodyString: string
): string {
  const base = generateSignatureBase(method, fullUrl, timestamp, nonce, bodyString);
  return createSignature(base, SIGNING_CONFIG.secretKey);
}
