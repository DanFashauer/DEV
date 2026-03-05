/**
 * Redis-backed nonce store for replay attack prevention
 * 
 * Features:
 * - Redis for production with per-device nonce window
 * - In-memory fallback for development
 * - Configurable TTL via environment
 * - Multi-instance safe (shared Redis)
 */

import Redis from 'ioredis';

// Configuration
const CONFIG = {
  /** Redis connection URL (optional - uses in-memory if not set) */
  redisUrl: process.env.REDIS_URL,
  /** Nonce TTL in seconds (default: 300 = 5 minutes) */
  nonceTtlSeconds: parseInt(process.env.NONCE_TTL_SECONDS ?? '300', 10),
  /** Key prefix for Redis keys */
  keyPrefix: 'nonce',
};

/**
 * NonceStore interface - abstracts storage backend
 */
interface NonceStore {
  /**
   * Check if nonce exists and add it atomically
   * @param deviceId - Unique device identifier
   * @param nonce - Unique nonce value
   * @returns true if nonce is valid and was added, false if it already exists
   */
  setNonce(deviceId: string, nonce: string): Promise<boolean>;
  
  /**
   * Check if a specific nonce exists for a device
   * @param deviceId - Unique device identifier
   * @param nonce - Nonce to check
   * @returns true if nonce exists, false otherwise
   */
  hasNonce(deviceId: string, nonce: string): Promise<boolean>;
  
  /**
   * Remove expired nonces (for in-memory cleanup)
   */
  cleanup?(): Promise<void>;
}

/**
 * In-memory nonce store for development
 * NOT suitable for production multi-instance deployments
 */
class InMemoryNonceStore implements NonceStore {
  private store = new Map<string, { timestamp: number }>();
  private ttlMs: number;
  
  constructor(ttlSeconds: number = CONFIG.nonceTtlSeconds) {
    this.ttlMs = ttlSeconds * 1000;
  }
  
  private makeKey(deviceId: string, nonce: string): string {
    return `${deviceId}:${nonce}`;
  }
  
  async setNonce(deviceId: string, nonce: string): Promise<boolean> {
    const key = this.makeKey(deviceId, nonce);
    
    if (this.store.has(key)) {
      return false; // Already exists
    }
    
    this.store.set(key, { timestamp: Date.now() });
    return true;
  }
  
  async hasNonce(deviceId: string, nonce: string): Promise<boolean> {
    const key = this.makeKey(deviceId, nonce);
    return this.store.has(key);
  }
  
  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now - value.timestamp > this.ttlMs) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Redis-backed nonce store for production
 * Supports multi-instance deployments with shared Redis
 */
class RedisNonceStore implements NonceStore {
  private redis: Redis;
  private ttlSeconds: number;
  
  constructor(redisUrl: string, ttlSeconds: number = CONFIG.nonceTtlSeconds) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });
    this.ttlSeconds = ttlSeconds;
  }
  
  private makeKey(deviceId: string, nonce: string): string {
    return `${CONFIG.keyPrefix}:${deviceId}:${nonce}`;
  }
  
  async setNonce(deviceId: string, nonce: string): Promise<boolean> {
    const key = this.makeKey(deviceId, nonce);
    
    // SETNX + EXPIRE atomically
    const result = await this.redis.set(key, '1', 'EX', this.ttlSeconds, 'NX');
    return result === 'OK';
  }
  
  async hasNonce(deviceId: string, nonce: string): Promise<boolean> {
    const key = this.makeKey(deviceId, nonce);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
  
  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * Factory function to create appropriate nonce store based on environment
 */
function createNonceStore(): NonceStore {
  if (CONFIG.redisUrl) {
    console.log('[NonceStore] Using Redis backend');
    return new RedisNonceStore(CONFIG.redisUrl, CONFIG.nonceTtlSeconds);
  }
  
  console.log('[NonceStore] Using in-memory backend (dev only)');
  return new InMemoryNonceStore(CONFIG.nonceTtlSeconds);
}

// Export singleton instance
export const nonceStore = createNonceStore();

// Export types and functions for testing
export type { NonceStore };
export { CONFIG };
