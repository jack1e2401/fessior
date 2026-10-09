import { SubmissionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

interface FinalizeSubmissionInput {
  status: Exclude<SubmissionStatus, 'PENDING' | 'PROCESSING'>;
  testCasesPassed: number;
  testCasesTotal: number;
  executionTime: number;
  memoryUsed: number;
  errorMessage: string | null;
  caseResults: Array<{ position: number; status: SubmissionStatus; executionTime: number; memoryUsed: number }>;
}

export class SubmissionRepository {
  findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
    });
  }

  async claimPending(id: string) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.submission.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'PROCESSING' } });
      if (result.count === 1) {
        const sequence = await tx.submissionStatusEvent.count({ where: { submission_id: id } });
        await tx.submissionStatusEvent.create({ data: { submission_id: id, sequence: sequence + 1, status: 'PROCESSING' } });
      }
      return result.count === 1;
    });
  }

  async finalize(id: string, data: FinalizeSubmissionInput) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.submission.updateMany({
        where: { id, status: 'PROCESSING' },
        data: { status: data.status, test_cases_passed: data.testCasesPassed, test_cases_total: data.testCasesTotal,
          execution_time: data.executionTime, memory_used: data.memoryUsed, error_message: data.errorMessage },
      });
      if (result.count !== 1) return false;
      const sequence = await tx.submissionStatusEvent.count({ where: { submission_id: id } });
      await tx.submissionCaseResult.deleteMany({ where: { submission_id: id } });
      if (data.caseResults.length) await tx.submissionCaseResult.createMany({ data: data.caseResults.map((item) => ({
        submission_id: id, position: item.position, status: item.status, execution_time: item.executionTime, memory_used: item.memoryUsed,
      })) });
      await tx.submissionStatusEvent.create({ data: { submission_id: id, sequence: sequence + 1, status: data.status } });
      return true;
    });
  }

  async markSystemError(id: string, errorMessage: string) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.submission.updateMany({ where: { id, status: { in: ['PENDING', 'PROCESSING'] } },
        data: { status: 'SYSTEM_ERROR', error_message: errorMessage } });
      if (result.count === 1) {
        const sequence = await tx.submissionStatusEvent.count({ where: { submission_id: id } });
        await tx.submissionStatusEvent.create({ data: { submission_id: id, sequence: sequence + 1, status: 'SYSTEM_ERROR' } });
      }
      return result.count === 1;
    });
  }
}

export const submissionRepository = new SubmissionRepository();
