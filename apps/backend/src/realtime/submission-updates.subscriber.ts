import Redis from 'ioredis';
import { Server } from 'socket.io';
import { REDIS_CHANNELS } from '@ocj/contracts';
import { env } from '../config/env';
import { matchService } from '../modules/matches/match.service';

export const subscribeToSubmissionUpdates = (io: Server) => {
  const pubSubClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  });

  pubSubClient.subscribe(REDIS_CHANNELS.SUBMISSION_UPDATES, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${REDIS_CHANNELS.SUBMISSION_UPDATES} channel:`, err);
    } else {
      console.log(`Subscribed to ${REDIS_CHANNELS.SUBMISSION_UPDATES} channel successfully`);
    }
  });

  pubSubClient.on('message', async (channel, message) => {
    if (channel === REDIS_CHANNELS.SUBMISSION_UPDATES) {
      try {
        const data = JSON.parse(message);
        await matchService.handleSubmissionUpdate(io, data);
      } catch (err) {
        console.error('Error parsing submission update message:', err);
      }
    }
  });

  return pubSubClient;
};
