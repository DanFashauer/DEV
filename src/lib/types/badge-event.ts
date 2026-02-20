/**
 * BadgeEvent Schema (v1) - Frozen Contract
 * 
 * This schema defines the canonical JSON payload sent from iOS to Backend
 * when a badge is scanned. All fields are frozen and MUST NOT change
 * without coordination between iOS and Backend teams.
 * 
 * Version: 1.0
 * Status: FROZEN
 */

// =============================================================================
// Transport Types
// =============================================================================

/** Supported badge reader transports */
export type BadgeTransport = 'ble' | 'usbc' | 'nfc' | 'wallet';

/** Supported badge formats */
export type BadgeFormat = 'alphanumeric';

// =============================================================================
// Badge Data
// =============================================================================

/** Badge data from scan */
export interface BadgeData {
  /** Raw badge ID as scanned */
  raw: string;
  
  /** Masked badge ID (prefix2 + "****" + suffix2) */
  masked: string;
  
  /** Badge format type */
  format: BadgeFormat;
  
  /** Confidence score (0.0 - 1.0) */
  confidence: number;
}

// =============================================================================
// Reader Data
// =============================================================================

/** Badge reader information */
export interface ReaderData {
  /** Transport type */
  transport: BadgeTransport;
  
  /** Reader vendor name */
  vendor: string;
  
  /** Reader model */
  model: string;
  
  /** Reader serial number */
  serial: string;
  
  /** Reader firmware version */
  firmware: string;
  
  /** Signal strength (BLE only) */
  rssi?: number;
}

// =============================================================================
// Device Data
// =============================================================================

/** MDM enrollment info */
export interface MDMData {
  /** Whether device is MDM enrolled */
  enrolled: boolean;
  
  /** MDM tenant identifier */
  tenant?: string;
  
  /** Whether in shared device mode */
  sharedDeviceMode?: boolean;
}

/** Device information */
export interface DeviceData {
  /** Stable device identifier */
  deviceId: string;
  
  /** Device serial number */
  deviceSerial: string;
  
  /** App bundle identifier */
  bundleId: string;
  
  /** App version */
  appVersion: string;
  
  /** Platform (always "iOS") */
  platform: 'iOS';
  
  /** OS version */
  osVersion: string;
  
  /** MDM enrollment data */
  mdm?: MDMData;
}

// =============================================================================
// Context Data
// =============================================================================

/** Optional context for the scan event */
export interface EventContext {
  /** Location identifier */
  locationId?: string;
  
  /** Organizational unit */
  orgUnitId?: string;
  
  /** Shift identifier */
  shiftId?: string;
  
  /** Lane identifier */
  laneId?: string;
}

// =============================================================================
// Complete BadgeEvent
// =============================================================================

/** Complete BadgeEvent payload (v1) */
export interface BadgeEvent {
  /** Schema version (always "1.0") */
  schemaVersion: '1.0';
  
  /** Unique event identifier (UUIDv4) */
  eventId: string;
  
  /** Event type (always "badge.scan") */
  eventType: 'badge.scan';
  
  /** ISO-8601 UTC timestamp */
  capturedAt: string;
  
  /** Badge data */
  badge: BadgeData;
  
  /** Reader data */
  reader: ReaderData;
  
  /** Device data */
  device: DeviceData;
  
  /** Optional context */
  context?: EventContext;
}

// =============================================================================
// Request Headers (Frozen)
// =============================================================================

/** Required headers for signed requests */
export interface RequestHeaders {
  /** Unix timestamp in seconds */
  'x-request-timestamp': string;
  
  /** UUID nonce */
  'x-request-nonce': string;
  
  /** HMAC-SHA256 signature (hex) */
  'x-request-signature': string;
  
  /** Device binding key ID */
  'x-device-binding': string;
}

// =============================================================================
// Response Types (Frozen)
// =============================================================================

/** Persona configuration from backend */
export interface Persona {
  /** Display name */
  name: string;
  
  /** Apps to launch */
  appsToLaunch: string[];
  
  /** Device restrictions */
  restrictions: {
    /** Whether paste is allowed */
    paste: boolean;
    /** Whether screenshots are allowed */
    screenshots: boolean;
  };
  
  /** MDM configuration */
  mdm?: {
    /** Whether in shared device mode */
    sharedDeviceMode: boolean;
  };
}

/** Successful session response */
export interface SessionStartResponse {
  /** Session ID (UUIDv4) */
  sessionId: string;
  
  /** Session token */
  sessionToken: string;
  
  /** Persona configuration */
  persona: Persona;
}

/** Error response */
export interface ErrorResponse {
  /** Error code */
  error: string;
  
  /** Error details */
  details?: Record<string, unknown>;
  
  /** Human-readable reason */
  reason?: string;
}

/** Unenrolled badge response */
export interface UnenrolledBadgeResponse {
  error: {
    code: 'BADGE_NOT_ENROLLED';
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a masked badge ID from raw badge
 * @param badgeId Raw badge ID
 * @returns Masked badge ID (prefix2 + "****" + suffix2)
 */
export function maskBadgeId(badgeId: string): string {
  if (badgeId.length <= 4) return '****';
  return `${badgeId.slice(0, 2)}****${badgeId.slice(-2)}`;
}

/**
 * Create a BadgeEvent from a badge scan
 * @param badgeId Raw badge ID
 * @param transport Reader transport type
 * @param readerInfo Reader information
 * @returns Complete BadgeEvent
 */
export function createBadgeEvent(
  badgeId: string,
  transport: BadgeTransport,
  readerInfo: {
    vendor: string;
    model: string;
    serial: string;
    firmware: string;
    rssi?: number;
  },
  deviceInfo: {
    deviceId: string;
    deviceSerial: string;
    bundleId: string;
    appVersion: string;
    osVersion: string;
    platform: 'iOS';
    mdm?: MDMData;
  },
  context?: EventContext
): BadgeEvent {
  return {
    schemaVersion: '1.0',
    eventId: crypto.randomUUID(),
    eventType: 'badge.scan',
    capturedAt: new Date().toISOString(),
    badge: {
      raw: badgeId,
      masked: maskBadgeId(badgeId),
      format: 'alphanumeric',
      confidence: 0.99,
    },
    reader: {
      transport,
      vendor: readerInfo.vendor,
      model: readerInfo.model,
      serial: readerInfo.serial,
      firmware: readerInfo.firmware,
      rssi: readerInfo.rssi,
    },
    device: deviceInfo,
    context,
  };
}

/**
 * Validate badge format
 * @param badgeId Badge ID to validate
 * @returns True if valid
 */
export function isValidBadgeFormat(badgeId: string): boolean {
  // Length check
  if (badgeId.length < 4 || badgeId.length > 32) return false;
  
  // Alphanumeric check
  if (!/^[a-zA-Z0-9]+$/.test(badgeId)) return false;
  
  return true;
}

// =============================================================================
// Zod Schema (for runtime validation)
// =============================================================================

import { z } from 'zod';

/** Zod schema for BadgeEvent validation */
export const BadgeEventSchema = z.object({
  schemaVersion: z.literal('1.0'),
  eventId: z.string().uuid(),
  eventType: z.literal('badge.scan'),
  capturedAt: z.string().datetime(),
  
  badge: z.object({
    raw: z.string().min(4).max(32),
    masked: z.string().min(4).max(64),
    format: z.enum(['alphanumeric']),
    confidence: z.number().min(0).max(1),
  }),
  
  reader: z.object({
    transport: z.enum(['ble', 'usbc', 'nfc', 'wallet']),
    vendor: z.string().min(1),
    model: z.string().min(1),
    serial: z.string().min(1),
    firmware: z.string().min(1),
    rssi: z.number().optional(),
  }),
  
  device: z.object({
    deviceId: z.string().min(1),
    deviceSerial: z.string().min(1),
    bundleId: z.string().min(1),
    appVersion: z.string().min(1),
    platform: z.literal('iOS'),
    osVersion: z.string().min(1),
    mdm: z.object({
      enrolled: z.boolean(),
      tenant: z.string().optional(),
      sharedDeviceMode: z.boolean().optional(),
    }).optional(),
  }),
  
  context: z.object({
    locationId: z.string().optional(),
    orgUnitId: z.string().optional(),
    shiftId: z.string().optional(),
    laneId: z.string().optional(),
  }).optional(),
});

/** Type guard for BadgeEvent */
export function isBadgeEvent(value: unknown): value is BadgeEvent {
  return BadgeEventSchema.safeParse(value).success;
}
