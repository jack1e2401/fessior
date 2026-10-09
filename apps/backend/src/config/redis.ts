import Redis from 'ioredis';
import { env } from './env';

export const redisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null, // BullMQ requires maxRetriesPerRequest to be null
};

export const redis = new Redis(redisOptions);

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});
