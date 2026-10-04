import { prisma } from '../config/prisma';
import { matchRepository } from '../modules/matches/match.repository';

describe('normalized 1v1 match domain', () => {
  const suffix = Date.now().toString(36);
  let userIds: string[] = [];
  let problemId: string;
  let matchId: string;

  beforeAll(async () => {
    const users = await Promise.all([0, 1, 2].map((index) => prisma.user.create({
      data: { username: `match_${suffix}_${index}`, email: `match_${suffix}_${index}@example.com` },
    })));
    userIds = users.map((user) => user.id);
    const problem = await prisma.problem.create({
      data: {
        title: 'Match domain test', slug: `match-domain-${suffix}`, description: 'test',
        difficulty: 'EASY', starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
      },
    });
    problemId = problem.id;
  });

  afterAll(async () => {
    if (matchId) await prisma.match.delete({ where: { id: matchId } });
    if (problemId) await prisma.problem.delete({ where: { id: problemId } });
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  it('creates exactly two participant rows without duplicated player columns', async () => {
    const match = await matchRepository.createMatch({
      player1Id: userIds[0], player2Id: userIds[1], problemId,
    });
    matchId = match.id;
    const stored = await matchRepository.findById(matchId);
    expect(stored?.participants.map((participant) => participant.user_id).sort()).toEqual(userIds.slice(0, 2).sort());
    expect(stored?.participants).toHaveLength(2);
    expect(stored).not.toHaveProperty('player1_id');
    expect(stored).not.toHaveProperty('player2_id');
    expect(stored).not.toHaveProperty('player1_status');
    expect(stored).not.toHaveProperty('player2_status');
  });

  it('rejects duplicate membership and a third participant', async () => {
    await expect(prisma.matchParticipant.create({ data: { match_id: matchId, user_id: userIds[0] } }))
      .rejects.toMatchObject({ code: 'P2002' });
    await expect(matchRepository.addParticipant(matchId, userIds[2])).rejects.toThrow('1v1 match is full');
    await expect(matchRepository.createMatch({ player1Id: userIds[0], player2Id: userIds[0], problemId }))
      .rejects.toThrow('A 1v1 match requires two distinct users');
  });

  it('looks up membership by match and user and keeps status on the participant', async () => {
    expect((await matchRepository.findParticipant(matchId, userIds[0]))?.user_id).toBe(userIds[0]);
    expect(await matchRepository.findParticipant(matchId, userIds[2])).toBeNull();
    await matchRepository.updateParticipantStatus(matchId, userIds[0], 'SUBMITTED_WA');
    const participant = await matchRepository.findParticipant(matchId, userIds[0]);
    expect(participant?.status).toBe('SUBMITTED_WA');
    expect((await matchRepository.getHistory(userIds[0], 1, 10)).items.map((item) => item.id)).toContain(matchId);
    expect((await matchRepository.getHistory(userIds[2], 1, 10)).items.map((item) => item.id)).not.toContain(matchId);
    expect((await matchRepository.findActiveMatchByUserId(userIds[1]))?.id).toBe(matchId);
    expect(await matchRepository.findActiveMatchByUserId(userIds[2])).toBeNull();
  });

  it('only accepts a participant as winner and writes ELO to participant rows', async () => {
    expect(await matchRepository.endMatchWithEloTransaction(matchId, userIds[2])).toBeNull();
    const result = await matchRepository.endMatchWithEloTransaction(matchId, userIds[0]);
    expect(result?.winnerId).toBe(userIds[0]);
    const stored = await matchRepository.findById(matchId);
    expect(stored?.winner_id).toBe(userIds[0]);
    expect(stored?.participants.find((participant) => participant.user_id === userIds[0])?.is_winner).toBe(true);
    expect(stored?.participants.find((participant) => participant.user_id === userIds[1])?.score_change).toBeLessThan(0);
  });
});
