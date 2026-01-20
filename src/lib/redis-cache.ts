/**
 * Redis Caching Configuration
 * Orbit PG - Performance Optimization Layer
 * 
 * Features:
 * - Distributed rate limiting
 * - Property and review caching
 * - Session management
 * - Cache invalidation strategies
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

// Redis configuration
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  // Connection settings
  socket: {
    connectTimeout: 10000,
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error('Redis max reconnection attempts reached');
        return new Error('Redis unavailable');
      }
      return Math.min(retries * 100, 3000);
    },
  },
};

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  PROPERTY_LIST: 300, // 5 minutes
  PROPERTY_DETAIL: 600, // 10 minutes
  REVIEW_LIST: 300, // 5 minutes
  USER_PROFILE: 900, // 15 minutes
  STATS: 180, // 3 minutes
  SEARCH_RESULTS: 300, // 5 minutes
  RATE_LIMIT: 900, // 15 minutes
};

// Cache key prefixes
export const CACHE_KEYS = {
  PROPERTY: (id: string) => `property:${id}`,
  PROPERTY_LIST: (filters: string) => `properties:list:${filters}`,
  REVIEW: (id: string) => `review:${id}`,
  REVIEW_LIST: (propertyId: string, filters: string) => `reviews:${propertyId}:${filters}`,
  USER: (id: string) => `user:${id}`,
  STATS: (type: string) => `stats:${type}`,
  RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,
};

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<boolean> {
  // Skip Redis in development if not configured
  if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
    logger.info('Redis not configured, running without cache');
    return false;
  }

  try {
    redisClient = createClient(REDIS_CONFIG);

    redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error', { error: err.message });
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      isRedisAvailable = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
      isRedisAvailable = false;
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    logger.info('Redis initialized successfully', {
      url: REDIS_CONFIG.url,
      database: REDIS_CONFIG.database,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to initialize Redis', { error: error.message });
    isRedisAvailable = false;
    return false;
  }
}

/**
 * Get Redis client (returns null if not available)
 */
export function getRedisClient(): RedisClientType | null {
  return isRedisAvailable ? redisClient : null;
}

/**
 * Check if Redis is available
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Set cache value with TTL
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.PROPERTY_DETAIL
): Promise<boolean> {
  if (!isRedisConnected()) return false;

  try {
    const serialized = JSON.stringify(value);
    await redisClient!.setEx(key, ttl, serialized);
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error: any) {
    logger.error('Cache set failed', { key, error: error.message });
    return false;
  }
}

/**
 * Get cache value
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  if (!isRedisConnected()) return null;

  try {
    const value = await redisClient!.get(key);
    if (!value) return null;

    const parsed = JSON.parse(value) as T;
    logger.debug('Cache hit', { key });
    return parsed;
  } catch (error: any) {
    logger.error('Cache get failed', { key, error: error.message });
    return null;
  }
}

/**
 * Delete cache key
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!isRedisConnected()) return false;

  try {
    await redisClient!.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error: any) {
    logger.error('Cache delete failed', { key, error: error.message });
    return false;
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!isRedisConnected()) return 0;

  try {
    const keys = await redisClient!.keys(pattern);
    if (keys.length === 0) return 0;

    await redisClient!.del(keys);
    logger.debug('Cache pattern deleted', { pattern, count: keys.length });
    return keys.length;
  } catch (error: any) {
    logger.error('Cache pattern delete failed', { pattern, error: error.message });
    return 0;
  }
}

/**
 * Increment rate limit counter
 */
export async function incrementRateLimit(
  identifier: string,
  windowMs: number
): Promise<number> {
  if (!isRedisConnected()) return 0;

  try {
    const key = CACHE_KEYS.RATE_LIMIT(identifier);
    const count = await redisClient!.incr(key);
    
    // Set expiry on first increment
    if (count === 1) {
      await redisClient!.expire(key, Math.ceil(windowMs / 1000));
    }

    return count;
  } catch (error: any) {
    logger.error('Rate limit increment failed', { identifier, error: error.message });
    return 0;
  }
}

/**
 * Get rate limit count
 */
export async function getRateLimitCount(identifier: string): Promise<number> {
  if (!isRedisConnected()) return 0;

  try {
    const key = CACHE_KEYS.RATE_LIMIT(identifier);
    const value = await redisClient!.get(key);
    return value ? parseInt(value) : 0;
  } catch (error: any) {
    logger.error('Rate limit get failed', { identifier, error: error.message });
    return 0;
  }
}

/**
 * Get remaining TTL for a key
 */
export async function getTTL(key: string): Promise<number> {
  if (!isRedisConnected()) return -1;

  try {
    return await redisClient!.ttl(key);
  } catch (error: any) {
    logger.error('TTL get failed', { key, error: error.message });
    return -1;
  }
}

/**
 * Cache invalidation strategies
 */
export const cacheInvalidation = {
  /**
   * Invalidate property cache (on update/delete)
   */
  property: async (propertyId: string) => {
    await Promise.all([
      deleteCache(CACHE_KEYS.PROPERTY(propertyId)),
      deleteCachePattern(`properties:list:*`),
      deleteCachePattern(`reviews:${propertyId}:*`),
    ]);
  },

  /**
   * Invalidate review cache (on create/update/delete)
   */
  review: async (propertyId: string) => {
    await Promise.all([
      deleteCachePattern(`reviews:${propertyId}:*`),
      deleteCache(CACHE_KEYS.PROPERTY(propertyId)),
      deleteCachePattern(`properties:list:*`),
    ]);
  },

  /**
   * Invalidate user cache (on update)
   */
  user: async (userId: string) => {
    await deleteCache(CACHE_KEYS.USER(userId));
  },

  /**
   * Invalidate stats cache (on data changes)
   */
  stats: async () => {
    await deleteCachePattern('stats:*');
  },

  /**
   * Clear all cache (use sparingly)
   */
  all: async () => {
    if (!isRedisConnected()) return;
    await redisClient!.flushDb();
    logger.warn('All cache cleared');
  },
};

/**
 * Graceful shutdown
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error: any) {
      logger.error('Error closing Redis connection', { error: error.message });
    }
  }
}

// Auto-initialize if REDIS_URL is provided
if (process.env.REDIS_URL) {
  initializeRedis().catch((err) => {
    logger.error('Failed to auto-initialize Redis', { error: err.message });
  });
}

export default {
  initialize: initializeRedis,
  getClient: getRedisClient,
  isConnected: isRedisConnected,
  set: setCache,
  get: getCache,
  delete: deleteCache,
  deletePattern: deleteCachePattern,
  invalidate: cacheInvalidation,
  close: closeRedis,
  TTL: CACHE_TTL,
  KEYS: CACHE_KEYS,
};
