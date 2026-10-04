import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { SubmissionProcessor } from './submission.processor';
import { SubmissionRepository } from './submission.repository';
import { JudgingContextRepository } from './judging-context.repository';
import { SubmissionJudgeService } from '../sandbox/submission-judge.service';
import { SubmissionPublisher } from './submission.publisher';
import { redis } from '../config/redis';
import { prisma } from '../config/prisma';

after(async () => { await redis.quit(); await prisma.$disconnect(); });

function fixture(initialStatus: 'PENDING' | 'PROCESSING' | 'ACCEPTED' = 'PENDING', failPublish = false, failJudgeOnce = false) {
  const calls: string[] = [];
  let status: string = initialStatus;
  let systemMessage: string | undefined;
  let judgeFailureRemaining = failJudgeOnce;
  const submission = {
    id: 'sub-1', user_id: 'user-1', problem_id: 'problem-1', testcase_set_id: 'old-set',
    match_id: null, code: 'print(42)', language: 'python', test_cases_passed: 0, test_cases_total: 0,
  };
  const repository = {
    findById: async () => ({ ...submission, status }),
    claimPending: async () => { calls.push('claim'); if (status !== 'PENDING') return false; status = 'PROCESSING'; return true; },
    finalize: async (_id: string, result: { status: string }) => {
      calls.push('finalize'); if (status !== 'PROCESSING') return false; status = result.status; return true;
    },
    markSystemError: async (_id: string, message: string) => {
      calls.push('system-error'); systemMessage = message; status = 'SYSTEM_ERROR'; return true;
    },
  } as unknown as SubmissionRepository;
  const context = {
    findProblemById: async () => ({ id: 'problem-1', time_limit: 1000, memory_limit: 128 }),
    findTestcasesBySetId: async (id: string) => { calls.push(`set:${id}`); return [{ input: '42', output: '42' }]; },
  } as unknown as JudgingContextRepository;
  const judge = {
    judge: async (input: { code: string; language: string }) => {
      calls.push(`judge:${input.code}:${input.language}`);
      if (judgeFailureRemaining) { judgeFailureRemaining = false; throw new Error('Transient Judge0 failure'); }
      return { status: 'ACCEPTED', passedCount: 1, totalCount: 1, executionTime: 1, memoryUsed: 10, errorMessage: null };
    },
  } as unknown as SubmissionJudgeService;
  const publisher = { publishFinalResult: async () => {
    calls.push('publish');
    if (failPublish) throw new Error('Redis unavailable');
  } } as unknown as SubmissionPublisher;
  const processor = new SubmissionProcessor({
    submissionRepository: repository, judgingContextRepository: context,
    judgeService: judge, publisher, getJudge0Url: () => 'http://judge0',
  });
  return { processor, calls, getStatus: () => status, getSystemMessage: () => systemMessage };
}

test('ID-only job reloads authoritative code and pinned set, persists before publishing', async () => {
  const { processor, calls, getStatus } = fixture();
  await processor.process({ submissionId: 'sub-1' });
  assert.equal(getStatus(), 'ACCEPTED');
  assert.deepEqual(calls, ['claim', 'set:old-set', 'judge:print(42):python', 'finalize', 'publish']);
});

test('terminal redelivery is a no-op', async () => {
  const { processor, calls } = fixture('ACCEPTED');
  await processor.process({ submissionId: 'sub-1' });
  assert.deepEqual(calls, []);
});

test('concurrent duplicate delivery claims only once', async () => {
  const { processor, calls, getStatus } = fixture();
  await Promise.all([processor.process({ submissionId: 'sub-1' }), processor.process({ submissionId: 'sub-1' })]);
  assert.equal(getStatus(), 'ACCEPTED');
  assert.equal(calls.filter((item) => item.startsWith('judge:')).length, 1);
  assert.equal(calls.filter((item) => item === 'publish').length, 1);
});

test('PROCESSING retry can resume judging', async () => {
  const { processor, calls, getStatus } = fixture('PROCESSING');
  await processor.process({ submissionId: 'sub-1' });
  assert.equal(getStatus(), 'ACCEPTED');
  assert.deepEqual(calls, ['set:old-set', 'judge:print(42):python', 'finalize', 'publish']);
});

test('a transient Judge0 failure leaves PROCESSING retryable and later persists verdict', async () => {
  const { processor, calls, getStatus } = fixture('PENDING', false, true);
  await assert.rejects(() => processor.process({ submissionId: 'sub-1' }), /Transient Judge0 failure/);
  assert.equal(getStatus(), 'PROCESSING');
  await processor.process({ submissionId: 'sub-1' });
  assert.equal(getStatus(), 'ACCEPTED');
  assert.equal(calls.filter((item) => item.startsWith('judge:')).length, 2);
  assert.equal(calls.filter((item) => item === 'finalize').length, 1);
});

test('final exhausted failure stores safe SYSTEM_ERROR before publication', async () => {
  const { processor, calls, getStatus, getSystemMessage } = fixture('PROCESSING');
  await processor.handleFinalFailure({ submissionId: 'sub-1' }, new Error('secret URL and token'));
  assert.equal(getStatus(), 'SYSTEM_ERROR');
  assert.equal(getSystemMessage(), 'Judging failed after retry attempts');
  assert.deepEqual(calls, ['system-error', 'publish']);
});

test('Redis publication failure leaves the persisted verdict intact', async () => {
  const { processor, getStatus } = fixture('PENDING', true);
  await processor.process({ submissionId: 'sub-1' });
  assert.equal(getStatus(), 'ACCEPTED');
});
