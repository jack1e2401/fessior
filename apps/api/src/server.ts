import { env } from './config/env';

import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { initSocketServer } from './realtime/socket.server';
import { SubmissionReconciler } from './modules/submissions/submission.reconciler';
import { submissionRepository } from './modules/submissions/submission.repository';
import { submissionQueue } from './config/queue';
import { matchService } from './modules/matches/match.service';
import { matchmakingService } from './modules/matches/matchmaking.service';

const PORT = env.PORT;

const startServer = async () => {
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  initSocketServer(io);

  const reconciler = new SubmissionReconciler(submissionRepository, submissionQueue, {
    staleMs: env.SUBMISSION_RECONCILE_STALE_MS,
    batchSize: env.SUBMISSION_RECONCILE_BATCH_SIZE,
  });
  const reconcile = () => void reconciler.runOnce().catch((error) => console.error('Submission reconciliation failed', error));
  setInterval(reconcile, env.SUBMISSION_RECONCILE_INTERVAL_MS).unref();
  reconcile();
  const reconcileMatches = () => void matchService.reconcileAccepted(io).catch((error) => console.error('Match reconciliation failed', error));
  setInterval(reconcileMatches, 30000).unref();
  reconcileMatches();
  const retryMatchmaking = () => void matchmakingService.tryMatchmaking(io).catch((error) => console.error('Matchmaking retry failed', error));
  setInterval(retryMatchmaking, 5000).unref();
  retryMatchmaking();

  server.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
};

startServer();
