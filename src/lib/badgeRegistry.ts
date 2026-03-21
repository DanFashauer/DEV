/**
 * Badge Registry
 * 
 * Manages badge-to-user identity mapping for the badge authentication system.
 * Provides CRUD operations for badge enrollment.
 * 
 * Features:
 * - Badge enrollment (badgeUID -> userId mapping)
 * - Badge lookup by UID
 * - List all badge mappings
 * - Remove badge mappings
 * - Redis-backed for production multi-instance deployments
 * - In-memory fallback for development
 * 
 * Environment variables:
 * - REDIS_URL: Redis connection URL (optional - uses in-memory if not set)
 */

import Redis from 'ioredis';
import { randomBytes } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface BadgeMapping {
  /** Badge UID (from badge scan) */
  badgeUid: string;
  /** User identifier (email, employee ID, etc.) */
  userId: string;
  /** Optional user display name */
  userName?: string;
  /** Optional department */
  department?: string;
  /** Enrollment timestamp */
  enrolledAt: string;
  /** Last used timestamp */
  lastUsedAt?: string;
  /** Whether the badge is active */
  active: boolean;
}

export interface BadgeEnrollmentRequest {
  badgeUid: string;
  userId: string;
  userName?: string;
  department?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  redisUrl: process.env.REDIS_URL,
  keyPrefix: 'badge',
  ttlSeconds: 60 * 60 * 24 * 365, // 1 year default TTL
};

// ============================================================================
// Production Redis Requirement Check
// ============================================================================

if (process.env.NODE_ENV === 'production' && !CONFIG.redisUrl) {
  throw new Error(
    'REDIS_URL environment variable is required in production. ' +
    'Badge registry must be Redis-backed for multi-instance deployments.'
  );
}

// ============================================================================
// Redis Client (lazy initialization)
// ============================================================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!CONFIG.redisUrl) {
    return null;
  }
  
  if (!redis) {
    redis = new Redis(CONFIG.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Don't log Redis URL in production
      ...(process.env.NODE_ENV === 'production' ? { 
        // Filter sensitive connection strings from logs
        connectTimeout: 10000,
      } : {}),
    });
  }
  
  return redis;
}

// ============================================================================
// In-Memory Store (development fallback)
// ============================================================================

const memoryStore = new Map<string, BadgeMapping>();

// ============================================================================
// BadgeRegistry Interface
// ============================================================================

export interface BadgeRegistry {
  /**
   * Enroll a badge to a user
   */
  enroll(request: BadgeEnrollmentRequest): Promise<BadgeMapping>;
  
  /**
   * Lookup a badge by UID
   */
  get(badgeUid: string): Promise<BadgeMapping | null>;
  
  /**
   * Update last used timestamp
   */
  updateLastUsed(badgeUid: string): Promise<void>;
  
  /**
   * List all badge mappings
   */
  list(): Promise<BadgeMapping[]>;
  
  /**
   * Remove a badge mapping
   */
  remove(badgeUid: string): Promise<boolean>;
  
  /**
   * Deactivate a badge (soft delete)
   */
  deactivate(badgeUid: string): Promise<boolean>;
}

// ============================================================================
// Implementation
// ============================================================================

class BadgeRegistryImpl implements BadgeRegistry {
  private get redis() {
    return getRedis();
  }
  
  private getKey(badgeUid: string): string {
    return `${CONFIG.keyPrefix}:${badgeUid}`;
  }
  
  private getIndexKey(): string {
    return `${CONFIG.keyPrefix}:index`;
  }
  
  async enroll(request: BadgeEnrollmentRequest): Promise<BadgeMapping> {
    const mapping: BadgeMapping = {
      badgeUid: request.badgeUid,
      userId: request.userId,
      userName: request.userName,
      department: request.department,
      enrolledAt: new Date().toISOString(),
      active: true,
    };
    
    if (this.redis) {
      // Redis storage
      const key = this.getKey(mapping.badgeUid);
      await this.redis.hset(key, {
        badgeUid: mapping.badgeUid,
        userId: mapping.userId,
        userName: mapping.userName || '',
        department: mapping.department || '',
        enrolledAt: mapping.enrolledAt,
        active: 'true',
      });
      await this.redis.expire(key, CONFIG.ttlSeconds);
      // Add to index
      await this.redis.sadd(this.getIndexKey(), mapping.badgeUid);
    } else {
      // In-memory storage
      memoryStore.set(mapping.badgeUid, mapping);
    }
    
    return mapping;
  }
  
  async get(badgeUid: string): Promise<BadgeMapping | null> {
    if (this.redis) {
      const key = this.getKey(badgeUid);
      const data = await this.redis.hgetall(key);
      
      if (!data || !data.badgeUid) {
        return null;
      }
      
      return {
        badgeUid: data.badgeUid,
        userId: data.userId,
        userName: data.userName || undefined,
        department: data.department || undefined,
        enrolledAt: data.enrolledAt,
        lastUsedAt: data.lastUsedAt || undefined,
        active: data.active === 'true',
      };
    }
    
    return memoryStore.get(badgeUid) || null;
  }
  
  async updateLastUsed(badgeUid: string): Promise<void> {
    const mapping = await this.get(badgeUid);
    if (!mapping) return;
    
    mapping.lastUsedAt = new Date().toISOString();
    
    if (this.redis) {
      const key = this.getKey(badgeUid);
      await this.redis.hset(key, 'lastUsedAt', mapping.lastUsedAt);
    }
  }
  
  async list(): Promise<BadgeMapping[]> {
    if (this.redis) {
      const badgeUids = await this.redis.smembers(this.getIndexKey());
      const mappings: BadgeMapping[] = [];
      
      for (const badgeUid of badgeUids) {
        const mapping = await this.get(badgeUid);
        if (mapping) {
          mappings.push(mapping);
        }
      }
      
      return mappings;
    }
    
    return Array.from(memoryStore.values());
  }
  
  async remove(badgeUid: string): Promise<boolean> {
    if (this.redis) {
      const key = this.getKey(badgeUid);
      const deleted = await this.redis.del(key);
      await this.redis.srem(this.getIndexKey(), badgeUid);
      return deleted > 0;
    }
    
    return memoryStore.delete(badgeUid);
  }
  
  async deactivate(badgeUid: string): Promise<boolean> {
    const mapping = await this.get(badgeUid);
    if (!mapping) return false;
    
    mapping.active = false;
    
    if (this.redis) {
      const key = this.getKey(badgeUid);
      await this.redis.hset(key, 'active', 'false');
    }
    
    return true;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const badgeRegistry = new BadgeRegistryImpl();
