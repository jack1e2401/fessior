import { SubmissionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

interface FinalizeSubmissionInput {
  status: SubmissionStatus;
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

  markProcessing(id: string) {
    return prisma.submission.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });
  }

  finalize(id: string, data: FinalizeSubmissionInput) {
    return prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        test_cases_passed: data.testCasesPassed,
        test_cases_total: data.testCasesTotal,
        execution_time: data.executionTime,
        memory_used: data.memoryUsed,
        error_message: data.errorMessage,
      },
    });
  }

  markSystemError(id: string, errorMessage: string) {
    return prisma.submission.update({
      where: { id },
      data: {
        status: 'SYSTEM_ERROR',
        error_message: errorMessage,
      },
    });
  }
}

export const submissionRepository = new SubmissionRepository();
