import { createClient } from 'redis';
import config from '.';
import logger from './logger';

export const redisClient = createClient({
  url: config.redis_url,
  // Reject commands while reconnecting instead of queuing them, so a Redis
  // outage fails fast (rate limiting falls back) rather than hanging requests.
  disableOfflineQueue: true,
});

redisClient.on('error', (err: Error) => {
  logger.error(`Redis client error: ${err.message}`);
});

redisClient.on('ready', () => {
  logger.info('Connected to Redis');
});

/**
 * Connects to Redis, resolving to `true` only if the client becomes ready
 * within `timeoutMs`. Never throws — a failure simply means the caller should
 * fall back to a non-Redis store.
 */
export async function connectRedis(timeoutMs = 3000): Promise<boolean> {
  if (redisClient.isReady) return true;

  const connecting = redisClient.connect().catch((err: Error) => {
    logger.error(`Redis connection failed: ${err.message}`);
  });

  await Promise.race([
    connecting,
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);

  return redisClient.isReady;
}
