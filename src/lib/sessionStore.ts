/**
 * Session Store
 * 
 * Manages user sessions for the badge authentication system.
 * Provides session creation, lookup, and expiration.
 * 
 * Features:
 * - Session creation with expiration
 * - Session lookup by ID
 * - Session status tracking (active, expired, terminated)
 * - Redis-backed for production multi-instance deployments
 * - In-memory fallback for development
 * 
 * Environment variables:
 * - REDIS_URL: Redis connection URL (optional - uses in-memory if not set)
 * - SESSION_TTL_SECONDS: Session time-to-live (default: 8 hours)
 */

import Redis from 'ioredis';

// ============================================================================
// Types
// ============================================================================

export type SessionStatus = 'active' | 'expired' | 'terminated';

export interface Session {
  /** Unique session ID */
  sessionId: string;
  /** User ID from badge mapping */
  userId: string;
  /** Badge UID that created the session */
  badgeUid: string;
  /** Device ID */
  deviceId: string;
  /** Session status */
  status: SessionStatus;
  /** Session created timestamp */
  createdAt: string;
  /** Session expires timestamp */
  expiresAt: string;
  /** Last activity timestamp */
  lastActivityAt: string;
  /** Next action directive (e.g., LAUNCH_APP, UNLOCK_DEVICE) */
  nextAction?: string;
  /** Bundle ID to launch (if nextAction is LAUNCH_APP) */
  bundleId?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

export interface SessionDirective {
  sessionId: string;
  userId: string;
  nextAction: 'LAUNCH_APP' | 'UNLOCK_DEVICE' | 'WAIT' | 'ERROR';
  bundleId?: string;
  expiresAt: string;
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  redisUrl: process.env.REDIS_URL,
  keyPrefix: 'session',
  ttlSeconds: parseInt(process.env.SESSION_TTL_SECONDS ?? '28800'), // 8 hours default
};

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
    });
  }
  
  return redis;
}

// ============================================================================
// In-Memory Store (development fallback)
// ============================================================================

const memoryStore = new Map<string, Session>();

// ============================================================================
// SessionStore Interface
// ============================================================================

interface SessionStore {
  /**
   * Create a new session
   */
  create(session: Omit<Session, 'sessionId' | 'createdAt' | 'expiresAt' | 'lastActivityAt' | 'status'>): Promise<Session>;
  
  /**
   * Get session by ID
   */
  get(sessionId: string): Promise<Session | null>;
  
  /**
   * Update session (extend expiry, update status)
   */
  update(sessionId: string, updates: Partial<Session>): Promise<Session | null>;
  
  /**
   * Terminate a session
   */
  terminate(sessionId: string): Promise<boolean>;
  
  /**
   * Get active sessions for a user
   */
  getByUserId(userId: string): Promise<Session[]>;
  
  /**
   * Get active sessions for a device
   */
  getByDeviceId(deviceId: string): Promise<Session[]>;
  
  /**
   * Cleanup expired sessions
   */
  cleanup(): Promise<number>;
}

// ============================================================================
// Implementation
// ============================================================================

class SessionStoreImpl implements SessionStore {
  private get redis() {
    return getRedis();
  }
  
  private getKey(sessionId: string): string {
    return `${CONFIG.keyPrefix}:${sessionId}`;
  }
  
  private getUserIndexKey(userId: string): string {
    return `${CONFIG.keyPrefix}:user:${userId}`;
  }
  
  private getDeviceIndexKey(deviceId: string): string {
    return `${CONFIG.keyPrefix}:device:${deviceId}`;
  }
  
  private generateSessionId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async create(data: Omit<Session, 'sessionId' | 'createdAt' | 'expiresAt' | 'lastActivityAt' | 'status'>): Promise<Session> {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + CONFIG.ttlSeconds * 1000).toISOString();
    
    const session: Session = {
      sessionId: this.generateSessionId(),
      userId: data.userId,
      badgeUid: data.badgeUid,
      deviceId: data.deviceId,
      status: 'active',
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
      nextAction: data.nextAction || 'LAUNCH_APP',
      bundleId: data.bundleId,
      metadata: data.metadata,
    };
    
    if (this.redis) {
      const key = this.getKey(session.sessionId);
      await this.redis.hset(key, {
        sessionId: session.sessionId,
        userId: session.userId,
        badgeUid: session.badgeUid,
        deviceId: session.deviceId,
        status: session.status,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        lastActivityAt: session.lastActivityAt,
        nextAction: session.nextAction || '',
        bundleId: session.bundleId || '',
        metadata: JSON.stringify(session.metadata || {}),
      });
      await this.redis.expire(key, CONFIG.ttlSeconds);
      
      // Add to indexes
      await this.redis.sadd(this.getUserIndexKey(session.userId), session.sessionId);
      await this.redis.sadd(this.getDeviceIndexKey(session.deviceId), session.sessionId);
    } else {
      memoryStore.set(session.sessionId, session);
    }
    
    return session;
  }
  
  async get(sessionId: string): Promise<Session | null> {
    if (this.redis) {
      const key = this.getKey(sessionId);
      const data = await this.redis.hgetall(key);
      
      if (!data || !data.sessionId) {
        return null;
      }
      
      // Check if expired
      if (new Date(data.expiresAt) < new Date()) {
        await this.terminate(sessionId);
        return null;
      }
      
      return {
        sessionId: data.sessionId,
        userId: data.userId,
        badgeUid: data.badgeUid,
        deviceId: data.deviceId,
        status: data.status as SessionStatus,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        lastActivityAt: data.lastActivityAt,
        nextAction: data.nextAction || undefined,
        bundleId: data.bundleId || undefined,
        metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
      };
    }
    
    const session = memoryStore.get(sessionId);
    if (!session) return null;
    
    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      await this.terminate(sessionId);
      return null;
    }
    
    return session;
  }
  
  async update(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
    const session = await this.get(sessionId);
    if (!session) return null;
    
    const updated = { ...session, ...updates, lastActivityAt: new Date().toISOString() };
    
    if (this.redis) {
      const key = this.getKey(sessionId);
      const updateData: Record<string, string> = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.nextAction) updateData.nextAction = updates.nextAction;
      if (updates.bundleId !== undefined) updateData.bundleId = updates.bundleId || '';
      if (updates.metadata) updateData.metadata = JSON.stringify(updates.metadata);
      updateData.lastActivityAt = updated.lastActivityAt;
      
      await this.redis.hset(key, updateData);
    } else {
      memoryStore.set(sessionId, updated);
    }
    
    return updated;
  }
  
  async terminate(sessionId: string): Promise<boolean> {
    const session = await this.get(sessionId);
    if (!session) return false;
    
    if (this.redis) {
      const key = this.getKey(sessionId);
      await this.redis.hset(key, 'status', 'terminated');
      await this.redis.expire(key, 60); // Keep for 1 minute for history
      
      // Remove from indexes
      await this.redis.srem(this.getUserIndexKey(session.userId), sessionId);
      await this.redis.srem(this.getDeviceIndexKey(session.deviceId), sessionId);
    } else {
      session.status = 'terminated';
      memoryStore.set(sessionId, session);
    }
    
    return true;
  }
  
  async getByUserId(userId: string): Promise<Session[]> {
    if (this.redis) {
      const sessionIds = await this.redis.smembers(this.getUserIndexKey(userId));
      const sessions: Session[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.get(sessionId);
        if (session && session.status === 'active') {
          sessions.push(session);
        }
      }
      
      return sessions;
    }
    
    return Array.from(memoryStore.values())
      .filter(s => s.userId === userId && s.status === 'active');
  }
  
  async getByDeviceId(deviceId: string): Promise<Session[]> {
    if (this.redis) {
      const sessionIds = await this.redis.smembers(this.getDeviceIndexKey(deviceId));
      const sessions: Session[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.get(sessionId);
        if (session && session.status === 'active') {
          sessions.push(session);
        }
      }
      
      return sessions;
    }
    
    return Array.from(memoryStore.values())
      .filter(s => s.deviceId === deviceId && s.status === 'active');
  }
  
  async cleanup(): Promise<number> {
    // This is handled automatically by Redis TTL
    // For in-memory store, we filter expired sessions
    if (!this.redis) {
      const now = new Date();
      let count = 0;
      
      for (const [sessionId, session] of memoryStore) {
        if (new Date(session.expiresAt) < now) {
          session.status = 'expired';
          count++;
        }
      }
      
      return count;
    }
    
    return 0;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const sessionStore = new SessionStoreImpl();
