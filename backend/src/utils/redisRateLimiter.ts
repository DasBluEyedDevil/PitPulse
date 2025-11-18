/**
 * Redis-based rate limiting for production use
 *
 * This replaces the in-memory rate limiting with a distributed solution
 * that works across multiple server instances.
 *
 * REQUIREMENTS:
 * 1. Install redis client: npm install redis
 * 2. Set REDIS_URL environment variable
 * 3. Update middleware/auth.ts to use this instead of in-memory limiter
 *
 * USAGE:
 * import { RedisRateLimiter } from './utils/redisRateLimiter';
 * const limiter = new RedisRateLimiter();
 * app.use(limiter.middleware());
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

// NOTE: Uncomment when Redis is available
// import { createClient } from 'redis';
// type RedisClientType = ReturnType<typeof createClient>;

export class RedisRateLimiter {
  // private redis: RedisClientType;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // NOTE: Uncomment when Redis is available
    /*
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.redis.connect();
    */
  }

  /**
   * Express middleware for rate limiting
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `rate_limit:${clientIP}`;

      try {
        // NOTE: Uncomment when Redis is available
        /*
        const now = Date.now();
        const windowStart = now - this.windowMs;

        // Remove old entries and count requests in current window
        await this.redis.zRemRangeByScore(key, 0, windowStart);
        const requestCount = await this.redis.zCard(key);

        if (requestCount >= this.maxRequests) {
          const response: ApiResponse = {
            success: false,
            error: 'Too many requests, please try again later',
          };
          res.status(429).json(response);
          return;
        }

        // Add current request to sorted set
        await this.redis.zAdd(key, { score: now, value: `${now}` });

        // Set expiration on key
        await this.redis.expire(key, Math.ceil(this.windowMs / 1000));
        */

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // On error, allow the request through (fail-open)
        next();
      }
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    // NOTE: Uncomment when Redis is available
    // await this.redis.quit();
  }

  /**
   * Get current request count for an IP
   */
  async getRequestCount(ip: string): Promise<number> {
    const key = `rate_limit:${ip}`;

    // NOTE: Uncomment when Redis is available
    /*
    const now = Date.now();
    const windowStart = now - this.windowMs;

    await this.redis.zRemRangeByScore(key, 0, windowStart);
    return await this.redis.zCard(key);
    */

    return 0;
  }

  /**
   * Reset rate limit for a specific IP
   */
  async reset(ip: string): Promise<void> {
    const key = `rate_limit:${ip}`;

    // NOTE: Uncomment when Redis is available
    // await this.redis.del(key);
  }
}

// Export singleton instance
export const rateLimiter = new RedisRateLimiter();
