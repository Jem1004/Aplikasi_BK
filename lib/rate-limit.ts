import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate Limiting Configuration
 * 
 * This module provides rate limiting functionality for sensitive endpoints.
 * 
 * In production, configure Upstash Redis with these environment variables:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 * 
 * In development, uses in-memory storage (not suitable for production).
 */

// Check if Redis is configured
const isRedisConfigured = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client or use memory storage
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

// In-memory storage for development (not suitable for production)
class MemoryStorage {
  private storage = new Map<string, { count: number; reset: number }>();

  async get(key: string): Promise<{ count: number; reset: number } | null> {
    const data = this.storage.get(key);
    if (!data) return null;
    
    // Clean up expired entries
    if (Date.now() > data.reset) {
      this.storage.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, count: number, reset: number): Promise<void> {
    this.storage.set(key, { count, reset });
  }

  async increment(key: string, window: number): Promise<{ count: number; reset: number }> {
    const existing = await this.get(key);
    const now = Date.now();
    
    if (!existing || now > existing.reset) {
      const reset = now + window;
      await this.set(key, 1, reset);
      return { count: 1, reset };
    }
    
    const newCount = existing.count + 1;
    await this.set(key, newCount, existing.reset);
    return { count: newCount, reset: existing.reset };
  }
}

const memoryStorage = new MemoryStorage();

/**
 * Login rate limiter
 * Limits: 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:login',
    })
  : {
      async limit(identifier: string) {
        const window = 15 * 60 * 1000; // 15 minutes in ms
        const limit = 5;
        const result = await memoryStorage.increment(identifier, window);
        
        return {
          success: result.count <= limit,
          limit,
          remaining: Math.max(0, limit - result.count),
          reset: result.reset,
          pending: Promise.resolve(),
        };
      },
    };

/**
 * User creation rate limiter
 * Limits: 10 attempts per hour per IP
 */
export const userCreationRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'ratelimit:user-creation',
    })
  : {
      async limit(identifier: string) {
        const window = 60 * 60 * 1000; // 1 hour in ms
        const limit = 10;
        const result = await memoryStorage.increment(identifier, window);
        
        return {
          success: result.count <= limit,
          limit,
          remaining: Math.max(0, limit - result.count),
          reset: result.reset,
          pending: Promise.resolve(),
        };
      },
    };

/**
 * Journal access rate limiter
 * Limits: 100 requests per minute per user
 */
export const journalAccessRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:journal-access',
    })
  : {
      async limit(identifier: string) {
        const window = 60 * 1000; // 1 minute in ms
        const limit = 100;
        const result = await memoryStorage.increment(identifier, window);
        
        return {
          success: result.count <= limit,
          limit,
          remaining: Math.max(0, limit - result.count),
          reset: result.reset,
          pending: Promise.resolve(),
        };
      },
    };

/**
 * Generic rate limiter
 * Limits: 60 requests per minute per identifier
 */
export const genericRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'ratelimit:generic',
    })
  : {
      async limit(identifier: string) {
        const window = 60 * 1000; // 1 minute in ms
        const limit = 60;
        const result = await memoryStorage.increment(identifier, window);
        
        return {
          success: result.count <= limit,
          limit,
          remaining: Math.max(0, limit - result.count),
          reset: result.reset,
          pending: Promise.resolve(),
        };
      },
    };

/**
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Try various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default value (not ideal but prevents errors)
  return 'unknown';
}

/**
 * Helper to check rate limit and return appropriate error
 */
export async function checkRateLimit(
  limiter: typeof loginRateLimiter,
  identifier: string
): Promise<{ success: boolean; error?: string }> {
  const { success, reset } = await limiter.limit(identifier);

  if (!success) {
    const resetDate = new Date(reset);
    const minutes = Math.ceil((reset - Date.now()) / 1000 / 60);
    
    return {
      success: false,
      error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutes} menit.`,
    };
  }

  return { success: true };
}
