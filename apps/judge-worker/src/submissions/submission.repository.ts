import { SubmissionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

interface FinalizeSubmissionInput {
  status: Exclude<SubmissionStatus, 'PENDING' | 'PROCESSING'>;
  testCasesPassed: number;
  testCasesTotal: number;
  executionTime: number;
  memoryUsed: number;
  errorMessage: string | null;
}

export class SubmissionRepository {
  findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
    });
  }

  async claimPending(id: string) {
    const result = await prisma.submission.updateMany({
      where: { id, status: 'PENDING' }, data: { status: 'PROCESSING' },
    });
    return result.count === 1;
  }

  async finalize(id: string, data: FinalizeSubmissionInput) {
    const result = await prisma.submission.updateMany({
      where: { id, status: 'PROCESSING' },
      data: {
        status: data.status,
        test_cases_passed: data.testCasesPassed,
        test_cases_total: data.testCasesTotal,
        execution_time: data.executionTime,
        memory_used: data.memoryUsed,
        error_message: data.errorMessage,
      },
    });
    return result.count === 1;
  }

  async markSystemError(id: string, errorMessage: string) {
    const result = await prisma.submission.updateMany({
      where: { id, status: { in: ['PENDING', 'PROCESSING'] } },
      data: {
        status: 'SYSTEM_ERROR',
        error_message: errorMessage,
      },
    });
    return result.count === 1;
  }
}

export const submissionRepository = new SubmissionRepository();
