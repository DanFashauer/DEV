/**
 * Redis-based Rate Limiter
 *
 * Provides distributed rate limiting for multi-instance deployments.
 * Falls back to in-memory for development when Redis is not available.
 *
 * Environment variables:
 * - REDIS_URL: Redis connection URL (required in production)
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL (alternative to REDIS_URL)
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
 */

import Redis from 'ioredis';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitOptions {
  max: number;        // Maximum requests per window
  window: number;     // Window duration in milliseconds
}

export interface RateLimitResult {
  success: boolean;   // Whether the request is allowed
  remaining: number;  // Remaining requests in current window
  reset: number;      // Timestamp when the window resets
  total: number;      // Total requests in current window
}

// ============================================================================
// Configuration
// ============================================================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  // Try Upstash first (serverless-friendly)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    // For Upstash, we'd use their REST API, but for simplicity,
    // assume REDIS_URL is set for Upstash as well
    redis = new Redis(upstashUrl.replace('https://', 'redis://').replace('/redis', ''), {
      password: upstashToken,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  } else if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  return redis;
}

// ============================================================================
// In-Memory Fallback (Development Only)
// ============================================================================

const memoryStore = new Map<string, { count: number; resetTime: number }>();

function checkMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    // New window
    memoryStore.set(key, {
      count: 1,
      resetTime: now + options.window,
    });
    return {
      success: true,
      remaining: options.max - 1,
      reset: now + options.window,
      total: 1,
    };
  }

  if (record.count >= options.max) {
    // Rate limited
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
      total: record.count,
    };
  }

  record.count++;
  return {
    success: true,
    remaining: options.max - record.count,
    reset: record.resetTime,
    total: record.count,
  };
}

// ============================================================================
// Redis-based Rate Limiting
// ============================================================================

async function checkRedisRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) {
    throw new Error('Redis not available for rate limiting');
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / options.window)}`;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();

    // Increment counter and set expiry
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, Math.ceil(options.window / 1000));

    const results = await pipeline.exec();
    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    const count = results[0][1] as number;

    return {
      success: count <= options.max,
      remaining: Math.max(0, options.max - count),
      reset: now + options.window,
      total: count,
    };
  } catch (error) {
    console.error('[RateLimit] Redis error:', error);
    // Fallback to memory on Redis failure
    return checkMemoryRateLimit(key, options);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a request should be rate limited
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  // Use Redis in production, memory in development
  if (process.env.NODE_ENV === 'production' || getRedis()) {
    try {
      return await checkRedisRateLimit(key, options);
    } catch (error) {
      console.error('[RateLimit] Redis failed, falling back to memory:', error);
      return checkMemoryRateLimit(key, options);
    }
  } else {
    return checkMemoryRateLimit(key, options);
  }
}

/**
 * Create a rate limiter instance with fixed options
 */
export class RateLimiter {
  constructor(private options: RateLimitOptions) {}

  async check(key: string): Promise<RateLimitResult> {
    return checkRateLimit(key, this.options);
  }
}

/**
 * Create a rate limiter with common presets
 */
export const rateLimitPresets = {
  strict: new RateLimiter({ max: 10, window: 60 * 1000 }),     // 10 per minute
  normal: new RateLimiter({ max: 30, window: 60 * 1000 }),     // 30 per minute
  lenient: new RateLimiter({ max: 100, window: 60 * 1000 }),   // 100 per minute
  api: new RateLimiter({ max: 1000, window: 60 * 1000 }),      // 1000 per minute
};