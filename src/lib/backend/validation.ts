/**
 * Backend Validation Script (Frozen Contract)
 * 
 * This is a complete, frozen validator + verifier for the BadgeEvent schema.
 * Paste this into your Node/Express backend to validate and process badge scan events.
 * 
 * Version: 1.0
 * Status: FROZEN
 * 
 * @module backend/validation
 */

import crypto from 'crypto';

// =============================================================================
// Types
// =============================================================================

/** BadgeEvent from iOS */
interface BadgeEvent {
  schemaVersion: string;
  eventId: string;
  eventType: string;
  capturedAt: string;
  badge: {
    raw: string;
    masked: string;
    format: string;
    confidence: number;
  };
  reader: {
    transport: string;
    vendor: string;
    model: string;
    serial: string;
    firmware: string;
    rssi?: number;
  };
  device: {
    deviceId: string;
    deviceSerial: string;
    bundleId: string;
    appVersion: string;
    platform: string;
    osVersion: string;
    mdm?: {
      enrolled: boolean;
      tenant?: string;
      sharedDeviceMode?: boolean;
    };
  };
  context?: {
    locationId?: string;
    orgUnitId?: string;
    shiftId?: string;
    laneId?: string;
  };
}

/** Request metadata */
interface RequestMeta {
  method: string;
  fullUrl: string;
  headers: Record<string, string | undefined>;
  canonicalBodyString: string;
}

/** Validation result */
interface ValidationResult {
  ok: boolean;
  status?: number;
  body?: Record<string, unknown>;
  event?: BadgeEvent;
  reason?: string;
}

// =============================================================================
// Suspicious Pattern Detection
// =============================================================================

/** Check for suspicious patterns in badge ID (mirrors iOS SecurityManager) */
function containsSuspiciousPatterns(s: string): boolean {
  const patterns = [
    '..', '<script', 'javascript:', 'onerror=', 'onclick=',
    '--', 'union', 'select', 'drop', 'delete', '<%', '%>'
  ];
  const lower = s.toLowerCase();
  return patterns.some(p => lower.includes(p));
}

/** Mask badge ID (mirrors iOS SecurityManager.maskBadgeId) */
function maskBadge(badge: string): string {
  if (badge.length <= 4) return '****';
  return `${badge.slice(0, 2)}****${badge.slice(-2)}`;
}

// =============================================================================
// Replay Prevention Store (MVP - in-memory)
// =============================================================================

interface ReplayStoreEntry {
  expiresAtMs: number;
}

const replayStore = new Map<string, ReplayStoreEntry>();

/** Check for replay attack */
function isReplay(deviceId: string, nonce: string): boolean {
  const key = `${deviceId}|${nonce}`;
  const now = Date.now();
  
  // Opportunistic cleanup
  for (const [k, entry] of replayStore.entries()) {
    if (now > entry.expiresAtMs) {
      replayStore.delete(k);
    }
  }
  
  if (replayStore.has(key)) {
    return true;
  }
  
  // Store for 10 minutes
  replayStore.set(key, { expiresAtMs: now + 10 * 60 * 1000 });
  return false;
}

// =============================================================================
// Signature Verification (Frozen)
// =============================================================================

/**
 * Verify signed request
 * @param params Verification parameters
 * @returns Result with ok flag and optional reason
 */
export function verifySignedRequest(params: {
  method: string;
  fullUrl: string;
  bodyString: string;
  headers: Record<string, string | undefined>;
  signingSecret: string;
  nowEpochSeconds?: number;
}): { ok: boolean; reason?: string } {
  const ts = params.headers['x-request-timestamp'] || '';
  const nonce = params.headers['x-request-nonce'] || '';
  const sig = params.headers['x-request-signature'] || '';
  const deviceBinding = params.headers['x-device-binding'] || '';

  // Check required headers
  if (!ts || !nonce || !sig) {
    return { ok: false, reason: 'missing_signature_headers' };
  }
  if (!deviceBinding) {
    return { ok: false, reason: 'missing_device_binding' };
  }

  // Check timestamp window (5 minutes)
  const now = params.nowEpochSeconds ?? Math.floor(Date.now() / 1000);
  const tsInt = Number(ts);
  if (!Number.isFinite(tsInt) || Math.abs(now - tsInt) > 300) {
    return { ok: false, reason: 'timestamp_out_of_window' };
  }

  // Compute signature base (frozen format)
  // Format: METHOD|FULL_URL|TIMESTAMP|NONCE|BODY_STRING
  const base = `${params.method}|${params.fullUrl}${ts}${nonce}${params.bodyString}`;
  
  // Compute HMAC-SHA256
  const computed = crypto
    .createHmac('sha256', params.signingSecret)
    .update(base)
    .digest('hex');

  // Timing-safe comparison
  const a = Buffer.from(sig);
  const b = Buffer.from(computed);
  
  if (a.length !== b.length) {
    return { ok: false, reason: 'bad_signature' };
  }
  
  try {
    if (!crypto.timingSafeEqual(a, b)) {
      return { ok: false, reason: 'bad_signature' };
    }
  } catch {
    return { ok: false, reason: 'bad_signature' };
  }

  return { ok: true };
}

// =============================================================================
// BadgeEvent Schema Validation
// =============================================================================

/**
 * Validate BadgeEvent structure
 * @param input Raw input to validate
 * @returns Validation result
 */
function validateBadgeEventSchema(input: unknown): { ok: boolean; event?: BadgeEvent; error?: string } {
  const event = input as BadgeEvent | undefined;
  
  if (!event || typeof event !== 'object') {
    return { ok: false, error: 'invalid_request' };
  }

  // Schema version
  if (event.schemaVersion !== '1.0') {
    return { ok: false, error: 'invalid_schema_version' };
  }

  // Event ID (UUID v4)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!event.eventId || !uuidRegex.test(event.eventId)) {
    return { ok: false, error: 'invalid_event_id' };
  }

  // Event type
  if (event.eventType !== 'badge.scan') {
    return { ok: false, error: 'invalid_event_type' };
  }

  // Captured at (ISO-8601)
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!event.capturedAt || !dateRegex.test(event.capturedAt)) {
    return { ok: false, error: 'invalid_captured_at' };
  }

  // Badge validation
  if (!event.badge?.raw || event.badge.raw.length < 4 || event.badge.raw.length > 32) {
    return { ok: false, error: 'invalid_badge_raw' };
  }
  if (!event.badge?.masked) {
    return { ok: false, error: 'invalid_badge_masked' };
  }

  // Reader validation
  const validTransports = ['ble', 'usbc', 'nfc', 'wallet'];
  if (!event.reader?.transport || !validTransports.includes(event.reader.transport)) {
    return { ok: false, error: 'invalid_reader_transport' };
  }
  if (!event.reader?.vendor || !event.reader?.model || !event.reader?.serial) {
    return { ok: false, error: 'invalid_reader_info' };
  }

  // Device validation
  if (!event.device?.deviceId || !event.device?.bundleId) {
    return { ok: false, error: 'invalid_device_info' };
  }
  if (event.device?.platform !== 'iOS') {
    return { ok: false, error: 'invalid_platform' };
  }

  return { ok: true, event };
}

// =============================================================================
// Main Handler: validateAndAuthorizeSessionStart
// =============================================================================

/**
 * Validate and authorize a session start request
 * 
 * This is the main entry point for processing badge scan events.
 * It performs all required validations per the frozen contract.
 * 
 * @param input Raw request body
 * @param reqMeta Request metadata (method, URL, headers)
 * @param signingSecret Secret key for HMAC verification
 * @returns Validation result
 */
export function validateAndAuthorizeSessionStart(
  input: unknown,
  reqMeta: {
    method: string;
    fullUrl: string;
    headers: Record<string, string | undefined>;
    signingSecret: string;
  }
): ValidationResult {
  // 1. Schema validation
  const schemaResult = validateBadgeEventSchema(input);
  if (!schemaResult.ok) {
    return {
      ok: false,
      status: 400,
      body: { error: 'invalid_request', details: schemaResult.error }
    };
  }

  const ev = schemaResult.event!;

  // 2. Suspicious pattern detection
  if (containsSuspiciousPatterns(ev.badge.raw)) {
    return {
      ok: false,
      status: 400,
      body: { error: 'invalid_request', details: { badge: 'suspicious_pattern' } }
    };
  }

  // 3. Masked badge validation
  const expectedMasked = maskBadge(ev.badge.raw);
  if (ev.badge.masked !== expectedMasked) {
    return {
      ok: false,
      status: 400,
      body: { error: 'invalid_request', details: { badge: 'masked_mismatch' } }
    };
  }

  // 4. Replay prevention
  const nonce = reqMeta.headers['x-request-nonce'] || '';
  if (isReplay(ev.device.deviceId, nonce)) {
    return {
      ok: false,
      status: 401,
      body: { error: 'unauthorized', reason: 'replay_detected' }
    };
  }

  // 5. Signature verification
  // Use canonical JSON string for signing
  const canonicalBodyString = JSON.stringify(input);
  const sig = verifySignedRequest({
    method: reqMeta.method,
    fullUrl: reqMeta.fullUrl,
    bodyString: canonicalBodyString,
    headers: reqMeta.headers,
    signingSecret: reqMeta.signingSecret,
  });
  
  if (!sig.ok) {
    return {
      ok: false,
      status: 401,
      body: { error: 'unauthorized', reason: sig.reason }
    };
  }

  return { ok: true, status: 200, event: ev };
}

// =============================================================================
// Express Route Handler Example
// =============================================================================

/**
 * Example Express route handler using this validation module
 * 
 * ```typescript
 * import { createSessionStartHandler } from './validation';
 * 
 * const app = express();
 * app.post('/session/start', createSessionStartHandler(mySigningSecret));
 * ```
 */
export function createSessionStartHandler(signingSecret: string) {
  // Express Request type (simplified)
  interface ExpressRequest {
    body: unknown;
    method: string;
    protocol: string;
    headers: Record<string, string | string[] | undefined>;
    get(name: string): string | undefined;
    originalUrl: string;
  }
  
  // Express Response type (simplified)
  interface ExpressResponse {
    json: (body: unknown) => void;
    status: (code: number) => { json: (body: unknown) => void };
  }
  
  return (req: ExpressRequest, res: ExpressResponse) => {
    const result = validateAndAuthorizeSessionStart(req.body, {
      method: req.method,
      fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      headers: req.headers as Record<string, string | undefined>,
      signingSecret,
    });

    if (!result.ok) {
      return res.status(result.status!).json(result.body);
    }

    // Success - badge is valid and signed
    // TODO: Check badge against enrollment database
    // TODO: Create session and return persona
    
    // Example unenrolled response:
    // return res.status(200).json({
    //   error: { code: 'BADGE_NOT_ENROLLED' }
    // });

    // Example success response:
    // return res.status(200).json({
    //   sessionId: crypto.randomUUID(),
    //   sessionToken: crypto.randomBytes(32).toString('hex'),
    //   persona: {
    //     name: 'Frontline Shared Device',
    //     appsToLaunch: ['com.company.emr', 'com.company.messenger'],
    //     restrictions: { paste: false, screenshots: false },
    //     mdm: { sharedDeviceMode: true }
    //   }
    // });

    return res.status(200).json({ message: 'Badge validated successfully', eventId: result.event?.eventId });
  };
}

// =============================================================================
// Rate Limiting (Optional)
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check rate limit
 * @param identifier Client identifier (deviceId or IP)
 * @param maxRequests Maximum requests allowed
 * @param windowMs Time window in milliseconds
 * @returns True if allowed
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// =============================================================================
// Export utilities
// =============================================================================

export { containsSuspiciousPatterns, maskBadge, isReplay };
