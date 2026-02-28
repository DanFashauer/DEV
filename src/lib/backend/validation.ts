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

/**
 * Configuration for request signing
 */
const SIGNING_CONFIG = {
  /** Secret key for HMAC-SHA256 - in production, use environment variable */
  secretKey: process.env.BACKEND_SIGNING_SECRET ?? 'development-secret-key',
  /** Time window for request validity (5 minutes in ms) */
  validityWindowMs: 5 * 60 * 1000,
  /** Nonce storage TTL (10 minutes in ms) */
  nonceTtlMs: 10 * 60 * 1000,
};

// In-memory nonce store (use Redis in production)
const nonceStore = new Map<string, number>();

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
 * Check if nonce exists and is still valid
 */
function isNonceValid(nonce: string): boolean {
  const existingTs = nonceStore.get(nonce);
  if (existingTs) {
    return false; // Nonce already used
  }
  
  // Store nonce with current timestamp
  nonceStore.set(nonce, Date.now());
  
  // Clean up old nonces
  const now = Date.now();
  for (const [key, ts] of nonceStore.entries()) {
    if (now - ts > SIGNING_CONFIG.nonceTtlMs) {
      nonceStore.delete(key);
    }
  }
  
  return true;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
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
  
  // 1. Check required headers
  if (!signature || !timestamp || !nonce) {
    return {
      valid: false,
      error: 'Missing required security headers: x-signature, x-timestamp, x-nonce',
    };
  }
  
  // 2. Validate timestamp is within window
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }
  
  const now = Date.now();
  const timeDiff = Math.abs(now - requestTime);
  if (timeDiff > SIGNING_CONFIG.validityWindowMs) {
    return { valid: false, error: 'Request timestamp outside valid window' };
  }
  
  // 3. Check replay prevention (nonce)
  if (!isNonceValid(nonce)) {
    return { valid: false, error: 'Nonce already used or invalid' };
  }
  
  // 4. Validate schema
  const parseResult = BadgeEventSchema.safeParse(body);
  if (!parseResult.success) {
    return {
      valid: false,
      error: `Invalid BadgeEvent schema: ${parseResult.error.message}`,
    };
  }
  
  const event = parseResult.data;
  
  // 5. Verify signature
  const bodyString = JSON.stringify(body);
  const signatureBase = generateSignatureBase(
    method,
    fullUrl,
    requestTime,
    nonce,
    bodyString
  );
  
  if (!verifySignature(signatureBase, SIGNING_CONFIG.secretKey, signature)) {
    return { valid: false, error: 'Invalid signature' };
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
