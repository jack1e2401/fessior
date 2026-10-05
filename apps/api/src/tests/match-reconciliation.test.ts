import { prisma } from '../config/prisma';
import { matchRepository } from '../modules/matches/match.repository';
import { matchService } from '../modules/matches/match.service';

describe('durable match conclusion after missed realtime event', () => {
  const suffix = Date.now().toString(36);
  const users: string[] = [];
  let problemId: string;
  let matchId: string;
  let submissionId: string;

  beforeAll(async () => {
    for (let i = 0; i < 2; i++) {
      users.push((await prisma.user.create({ data: { username: `match_recover_${suffix}_${i}`, email: `match_recover_${suffix}_${i}@example.com` } })).id);
    }
    const problem = await prisma.problem.create({
      data: {
        title: 'Match recovery problem', slug: `match-recover-${suffix}`, description: 'test', difficulty: 'EASY',
        starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
        testcase_sets: { create: { version: 1, testcases: { create: [{ position: 0, input: '1', output: '1' }] } } },
      }, include: { testcase_sets: true },
    });
    problemId = problem.id;
    await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: problem.testcase_sets[0].id } });
    matchId = (await matchRepository.createMatch({ player1Id: users[0], player2Id: users[1], problemId })).id;
    submissionId = (await prisma.submission.create({ data: {
      user_id: users[0], problem_id: problemId, match_id: matchId, testcase_set_id: problem.testcase_sets[0].id,
      code: 'print(1)', language: 'python', status: 'ACCEPTED', test_cases_passed: 1, test_cases_total: 1,
    } })).id;
  });

  afterAll(async () => {
    if (submissionId) await prisma.submission.delete({ where: { id: submissionId } });
    if (matchId) await prisma.match.delete({ where: { id: matchId } });
    if (problemId) {
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: null } });
      await prisma.problem.delete({ where: { id: problemId } });
    }
    await prisma.user.deleteMany({ where: { id: { in: users } } });
  });

  it('settles accepted DB submission once without receiving Pub/Sub', async () => {
    const before = await prisma.user.findUnique({ where: { id: users[0] } });
    await matchService.reconcileAccepted(null, matchId);
    await matchService.reconcileAccepted(null, matchId);
    const match = await matchRepository.findById(matchId);
    const after = await prisma.user.findUnique({ where: { id: users[0] } });
    expect(match?.winner_id).toBe(users[0]);
    expect(match?.status).toBe('FINISHED');
    expect(after!.elo_rating - before!.elo_rating).toBe(match!.participants.find((p) => p.user_id === users[0])!.score_change);
  });
});
