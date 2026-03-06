/**
 * Device Identity Graph
 * 
 * Creates one canonical device identity record that links signals from:
 * - DeviceRegistry
 * - UEM adapters
 * - NAC resolver
 * - FleetDM
 * - badge/session events
 * 
 * Goal: One device, one correlated identity, many source systems.
 */

import Redis from 'ioredis';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface DeviceIdentity {
  // Canonical ID (primary key)
  readonly identityId: string;
  
  // Device identifiers from various sources
  deviceId: string;           // Primary device ID (from BadgeEvent)
  serial: string;             // Device serial number
  udid?: string;             // iOS UDID
  managementId?: string;      // MDM/UEM management ID
  fleetHostId?: string;       // FleetDM host UUID
  
  // Network identifiers
  macAddresses: string[];     // MAC addresses observed
  certificateSubjects: string[]; // Certificate subjects
  
  // Host information
  hostname?: string;
  platform: string;           // darwin, linux, windows, chrome
  osVersion?: string;
  deviceModel?: string;
  
  // Management source (primary source of truth)
  managementSource: 'device_registry' | 'uem' | 'nac' | 'fleetdm' | 'badge_event';
  
  // Timestamps
  firstSeenAt: string;
  lastSeenAt: string;
  lastUpdatedAt: string;
  
  // Correlation metadata
  correlationScore: number;   // 0-100, how confident we are this is the same device
  sourcesCount: number;      // Number of source systems that have seen this device
}

export interface DeviceIdentityInput {
  deviceId?: string;
  serial?: string;
  udid?: string;
  managementId?: string;
  fleetHostId?: string;
  macAddresses?: string[];
  certificateSubjects?: string[];
  hostname?: string;
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  managementSource?: DeviceIdentity['managementSource'];
}

export interface DeviceIdentityRef {
  identityId: string;
  correlationId: string;
}

// ============================================================================
// Configuration
// ============================================================================

const REDIS_URL = process.env.REDIS_URL;
const KEY_PREFIX = 'identity';
const IDENTITY_INDEX_PREFIX = `${KEY_PREFIX}:index`;
const IDENTITY_BY_DEVICEID_PREFIX = `${KEY_PREFIX}:by_deviceId`;
const IDENTITY_BY_SERIAL_PREFIX = `${KEY_PREFIX}:by_serial`;

// ============================================================================
// In-Memory Store (Development)
// ============================================================================

class InMemoryIdentityStore {
  private identities = new Map<string, DeviceIdentity>();
  private deviceIdIndex = new Map<string, string>();
  private serialIndex = new Map<string, string>();
  
  async get(identityId: string): Promise<DeviceIdentity | null> {
    return this.identities.get(identityId) || null;
  }
  
  async getByDeviceId(deviceId: string): Promise<DeviceIdentity | null> {
    const identityId = this.deviceIdIndex.get(deviceId);
    if (!identityId) return null;
    return this.identities.get(identityId) || null;
  }
  
  async getBySerial(serial: string): Promise<DeviceIdentity | null> {
    const identityId = this.serialIndex.get(serial);
    if (!identityId) return null;
    return this.identities.get(identityId) || null;
  }
  
  async save(identity: DeviceIdentity): Promise<void> {
    this.identities.set(identity.identityId, identity);
    this.deviceIdIndex.set(identity.deviceId, identity.identityId);
    this.serialIndex.set(identity.serial, identity.identityId);
  }
  
  async list(): Promise<DeviceIdentity[]> {
    return Array.from(this.identities.values());
  }
  
  async delete(identityId: string): Promise<boolean> {
    const identity = this.identities.get(identityId);
    if (!identity) return false;
    
    this.identities.delete(identityId);
    this.deviceIdIndex.delete(identity.deviceId);
    this.serialIndex.delete(identity.serial);
    return true;
  }
}

// ============================================================================
// Redis Store (Production)
// ============================================================================

class RedisIdentityStore {
  private redis: Redis;
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 3000);
      },
    });
  }
  
  private makeKey(identityId: string): string {
    return `${KEY_PREFIX}:${identityId}`;
  }
  
  async get(identityId: string): Promise<DeviceIdentity | null> {
    const data = await this.redis.get(this.makeKey(identityId));
    if (!data) return null;
    return JSON.parse(data) as DeviceIdentity;
  }
  
  async getByDeviceId(deviceId: string): Promise<DeviceIdentity | null> {
    const identityId = await this.redis.hget(IDENTITY_BY_DEVICEID_PREFIX, deviceId);
    if (!identityId) return null;
    return this.get(identityId);
  }
  
  async getBySerial(serial: string): Promise<DeviceIdentity | null> {
    const identityId = await this.redis.hget(IDENTITY_BY_SERIAL_PREFIX, serial);
    if (!identityId) return null;
    return this.get(identityId);
  }
  
  async save(identity: DeviceIdentity): Promise<void> {
    const key = this.makeKey(identity.identityId);
    await this.redis.setex(key, 86400 * 365, JSON.stringify(identity)); // 1 year TTL
    
    // Update indexes
    await this.redis.hset(IDENTITY_BY_DEVICEID_PREFIX, identity.deviceId, identity.identityId);
    await this.redis.hset(IDENTITY_BY_SERIAL_PREFIX, identity.serial, identity.identityId);
  }
  
  async list(): Promise<DeviceIdentity[]> {
    const keys = await this.redis.keys(`${KEY_PREFIX}:*`);
    const identities: DeviceIdentity[] = [];
    
    for (const key of keys) {
      if (key.includes(':index') || key.includes(':by_')) continue;
      const data = await this.redis.get(key);
      if (data) {
        identities.push(JSON.parse(data));
      }
    }
    
    return identities;
  }
  
  async delete(identityId: string): Promise<boolean> {
    const identity = await this.get(identityId);
    if (!identity) return false;
    
    const key = this.makeKey(identityId);
    await this.redis.del(key);
    await this.redis.hdel(IDENTITY_BY_DEVICEID_PREFIX, identity.deviceId);
    await this.redis.hdel(IDENTITY_BY_SERIAL_PREFIX, identity.serial);
    
    return true;
  }
  
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// ============================================================================
// Store Factory
// ============================================================================

type IdentityStore = {
  get(identityId: string): Promise<DeviceIdentity | null>;
  getByDeviceId(deviceId: string): Promise<DeviceIdentity | null>;
  getBySerial(serial: string): Promise<DeviceIdentity | null>;
  save(identity: DeviceIdentity): Promise<void>;
  list(): Promise<DeviceIdentity[]>;
  delete(identityId: string): Promise<boolean>;
};

function createIdentityStore(): IdentityStore {
  if (REDIS_URL) {
    console.log('[DeviceIdentity] Using Redis backend');
    return new RedisIdentityStore(REDIS_URL);
  }
  
  console.log('[DeviceIdentity] Using in-memory backend (dev only)');
  return new InMemoryIdentityStore();
}

// ============================================================================
// Device Identity Graph - Core Logic
// ============================================================================

const identityStore = createIdentityStore();

/**
 * Resolve or create a device identity from input signals
 * Merges data from multiple sources into a canonical identity
 */
export async function resolveDeviceIdentity(input: DeviceIdentityInput): Promise<DeviceIdentity> {
  const now = new Date().toISOString();
  
  // Try to find existing identity by deviceId
  if (input.deviceId) {
    const existing = await identityStore.getByDeviceId(input.deviceId);
    if (existing) {
      return updateDeviceIdentity(existing, input);
    }
  }
  
  // Try to find existing identity by serial
  if (input.serial) {
    const existing = await identityStore.getBySerial(input.serial);
    if (existing) {
      return updateDeviceIdentity(existing, input);
    }
  }
  
  // Create new identity
  const identityId = randomUUID();
  const identity: DeviceIdentity = {
    identityId,
    deviceId: input.deviceId || '',
    serial: input.serial || '',
    udid: input.udid,
    managementId: input.managementId,
    fleetHostId: input.fleetHostId,
    macAddresses: input.macAddresses || [],
    certificateSubjects: input.certificateSubjects || [],
    hostname: input.hostname,
    platform: input.platform || 'unknown',
    osVersion: input.osVersion,
    deviceModel: input.deviceModel,
    managementSource: input.managementSource || 'device_registry',
    firstSeenAt: now,
    lastSeenAt: now,
    lastUpdatedAt: now,
    correlationScore: 50, // New identity starts at 50%
    sourcesCount: 1,
  };
  
  await identityStore.save(identity);
  console.log('[DeviceIdentity] Created new identity:', identityId, 'for device:', input.deviceId);
  
  return identity;
}

/**
 * Update an existing device identity with new signals
 */
async function updateDeviceIdentity(
  existing: DeviceIdentity,
  input: DeviceIdentityInput
): Promise<DeviceIdentity> {
  const now = new Date().toISOString();
  
  // Merge arrays (dedupe)
  const mergeArrays = (existing: string[], incoming: string[]): string[] => {
    const combined = [...existing, ...incoming];
    return [...new Set(combined)];
  };
  
  const updated: DeviceIdentity = {
    ...existing,
    // Update identifiers if provided
    deviceId: input.deviceId || existing.deviceId,
    serial: input.serial || existing.serial,
    udid: input.udid || existing.udid,
    managementId: input.managementId || existing.managementId,
    fleetHostId: input.fleetHostId || existing.fleetHostId,
    
    // Merge arrays
    macAddresses: input.macAddresses 
      ? mergeArrays(existing.macAddresses, input.macAddresses)
      : existing.macAddresses,
    certificateSubjects: input.certificateSubjects
      ? mergeArrays(existing.certificateSubjects, input.certificateSubjects)
      : existing.certificateSubjects,
    
    // Update host info if provided
    hostname: input.hostname || existing.hostname,
    platform: input.platform || existing.platform,
    osVersion: input.osVersion || existing.osVersion,
    deviceModel: input.deviceModel || existing.deviceModel,
    
    // Update timestamps
    lastSeenAt: now,
    lastUpdatedAt: now,
    
    // Update correlation score
    sourcesCount: existing.sourcesCount + 1,
    correlationScore: Math.min(100, existing.correlationScore + 10), // +10% per new source
  };
  
  await identityStore.save(updated);
  console.log('[DeviceIdentity] Updated identity:', updated.identityId, 'sources:', updated.sourcesCount);
  
  return updated;
}

/**
 * Get device identity by ID
 */
export async function getDeviceIdentity(identityId: string): Promise<DeviceIdentity | null> {
  return identityStore.get(identityId);
}

/**
 * Get device identity by device ID
 */
export async function getDeviceIdentityByDeviceId(deviceId: string): Promise<DeviceIdentity | null> {
  return identityStore.getByDeviceId(deviceId);
}

/**
 * List all device identities (for admin)
 */
export async function listDeviceIdentities(): Promise<DeviceIdentity[]> {
  return identityStore.list();
}

/**
 * Delete device identity
 */
export async function deleteDeviceIdentity(identityId: string): Promise<boolean> {
  return identityStore.delete(identityId);
}

/**
 * Create a correlation reference for audit trail
 */
export function createIdentityRef(identity: DeviceIdentity): DeviceIdentityRef {
  return {
    identityId: identity.identityId,
    correlationId: randomUUID(),
  };
}

// Export store type for testing
export type { IdentityStore };
