import { prisma } from '../config/prisma';
import { matchRepository } from '../modules/matches/match.repository';
import { submissionRepository } from '../modules/submissions/submission.repository';

describe('match-bound submission authorization', () => {
  const suffix = Date.now().toString(36);
  const userIds: string[] = [];
  const problemIds: string[] = [];
  let matchId: string;

  beforeAll(async () => {
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({ data: { username: `match_submit_${suffix}_${i}`, email: `match_submit_${suffix}_${i}@example.com` } });
      userIds.push(user.id);
    }
    for (let i = 0; i < 2; i++) {
      const problem = await prisma.problem.create({
        data: {
          title: `Match submit ${i}`, slug: `match-submit-${suffix}-${i}`, description: 'test', difficulty: 'EASY',
          starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
          testcase_sets: { create: { version: 1, testcases: { create: [{ position: 0, input: '1', output: '1' }] } } },
        }, include: { testcase_sets: true },
      });
      problemIds.push(problem.id);
      await prisma.problem.update({ where: { id: problem.id }, data: { active_testcase_set_id: problem.testcase_sets[0].id } });
    }
    matchId = (await matchRepository.createMatch({ player1Id: userIds[0], player2Id: userIds[1], problemId: problemIds[0] })).id;
  });

  afterAll(async () => {
    await prisma.submission.deleteMany({ where: { user_id: { in: userIds } } });
    if (matchId) await prisma.match.delete({ where: { id: matchId } });
    await prisma.problem.updateMany({ where: { id: { in: problemIds } }, data: { active_testcase_set_id: null } });
    await prisma.problem.deleteMany({ where: { id: { in: problemIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  const submit = (userId: string, problemId: string) => submissionRepository.createPendingSubmissionForActiveSet({
    userId, slugOrId: problemId, code: 'print(1)', language: 'python', matchId,
  });

  it('rejects an outsider and the wrong problem before creating judging work', async () => {
    expect((await submit(userIds[2], problemIds[0])).kind).toBe('invalid-match');
    expect((await submit(userIds[0], problemIds[1])).kind).toBe('invalid-match');
    expect(await prisma.submission.count({ where: { match_id: matchId } })).toBe(0);
  });

  it('accepts a member only while RUNNING', async () => {
    expect((await submit(userIds[0], problemIds[0])).kind).toBe('created');
    await matchRepository.endMatchWithEloTransaction(matchId, userIds[0]);
    expect((await submit(userIds[1], problemIds[0])).kind).toBe('invalid-match');
    expect(await prisma.submission.count({ where: { match_id: matchId } })).toBe(1);
  });
});
