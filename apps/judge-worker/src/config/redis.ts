import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisOptions);

redis.on('connect', () => {
  console.log('Redis connected successfully in worker-service');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});
