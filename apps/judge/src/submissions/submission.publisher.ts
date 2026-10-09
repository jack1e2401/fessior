import { REDIS_CHANNELS } from '@ocj/contracts';
import { SubmissionStatus } from '@prisma/client';
import { redis } from '../config/redis';

interface PublishFinalSubmissionResultInput {
  submissionId: string;
  userId: string;
  problemId: string;
  status: SubmissionStatus;
  testCasesPassed: number;
  testCasesTotal: number;
  matchId?: string;
}

export class SubmissionPublisher {
  async publishFinalResult(data: PublishFinalSubmissionResultInput) {
    await redis.publish(
      REDIS_CHANNELS.SUBMISSION_UPDATES,
      JSON.stringify({
        submissionId: data.submissionId,
        userId: data.userId,
        problemId: data.problemId,
        status: data.status,
        testCasesPassed: data.testCasesPassed,
        testCasesTotal: data.testCasesTotal,
        matchId: data.matchId,
      })
    );
  }
}

export const submissionPublisher = new SubmissionPublisher();
