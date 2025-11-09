/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

import rateLimit from 'express-rate-limit';
import { redisCache } from '../../infrastructure/cache/redis.config';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoints rate limiter (stricter)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true,
});

/**
 * OTP/Verification rate limiter (very strict)
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later.',
  },
});

/**
 * Custom Redis-based rate limiter
 */
export const customRateLimiter = (
  key: string,
  maxRequests: number,
  windowSeconds: number
) => {
  return async (req: Request, res: Response, next: Function): Promise<void> => {
    try {
      const identifier = req.ip || req.socket.remoteAddress || 'unknown';
      const rateLimitKey = `rate:${key}:${identifier}`;

      const count = await redisCache.incrementRateLimit(rateLimitKey, windowSeconds);

      // Set headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Rate limit exceeded',
        });
        return;
      }

      next();
    } catch (error) {
      // If Redis fails, allow the request
      next();
    }
  };
};
