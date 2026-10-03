import './config/env';

import { startSubmissionWorker } from './submissions/submission.worker';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

const bootstrap = async () => {
  console.log('Starting Worker Service...');
  const worker = startSubmissionWorker();
  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`Received ${signal}. Shutting down Worker Service...`);

    try {
      await worker.close();
      await redis.quit();
      await prisma.$disconnect();
      console.log('Worker Service shut down cleanly');
      process.exit(0);
    } catch (err) {
      console.error('Error during Worker Service shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

bootstrap().catch((err) => {
  console.error('Fatal error starting Worker Service:', err);
  process.exit(1);
});
