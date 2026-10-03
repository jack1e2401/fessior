import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // BullMQ requires maxRetriesPerRequest to be null
};

export const redis = new Redis(redisOptions);

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});
