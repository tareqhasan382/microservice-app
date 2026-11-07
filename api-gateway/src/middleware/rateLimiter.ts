import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisReply, RedisStore } from 'rate-limit-redis';

import config from '../config';
import logger from '../config/logger';
import { connectRedis, redisClient } from '../config/redis';

const baseOptions = {
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
  limit: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  // Fail open if the store errors so the gateway stays available.
  passOnStoreError: true,
  message: 'Too many requests, please try again later.',
};

/**
 * Builds the rate limiter using a Redis store when Redis is reachable, and
 * falls back to the default in-memory store otherwise. The store is only
 * constructed once the client is ready, since RedisStore eagerly loads its
 * Lua scripts on construction.
 */
async function createRateLimiter(): Promise<RequestHandler> {
  if (await connectRedis()) {
    logger.info('Rate limiting backed by Redis');
    return rateLimit({
      ...baseOptions,
      store: new RedisStore({
        prefix: 'ratelimit:',
        sendCommand: (...args: string[]) =>
          redisClient.sendCommand(args) as unknown as Promise<RedisReply>,
      }),
    });
  }

  logger.warn('Redis unavailable — falling back to in-memory rate limiting');
  return rateLimit(baseOptions);
}

let limiter: RequestHandler | null = null;

const limiterReady: Promise<void> = createRateLimiter()
  .then((created) => {
    limiter = created;
  })
  .catch((err: Error) => {
    logger.error(`Rate limiter init failed: ${err.message}`);
    limiter = rateLimit(baseOptions);
  });

export const apiRateLimiter: RequestHandler = (req, res, next) => {
  if (limiter) {
    limiter(req, res, next);
    return;
  }
  // Only the first requests wait for the limiter to finish initializing.
  void limiterReady.then(() => limiter!(req, res, next));
};
