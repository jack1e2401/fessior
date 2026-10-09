import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { submissionRepository } from '../modules/submissions/submission.repository';
import { testcaseRepository } from '../modules/testcases/testcase.repository';

describe('versioned testcase relations', () => {
  const suffix = Date.now().toString(36);
  let userId: string;
  let problemId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { username: `phase2_${suffix}`, email: `phase2_${suffix}@example.com` },
    });
    const problem = await prisma.problem.create({
      data: {
        title: 'Versioning test', slug: `versioning-${suffix}`, description: 'test',
        difficulty: 'EASY', starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
      },
    });
    userId = user.id;
    problemId = problem.id;
  });

  afterAll(async () => {
    if (problemId) {
      await prisma.submission.deleteMany({ where: { problem_id: problemId } });
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: null } });
      await prisma.problem.delete({ where: { id: problemId } });
    }
    if (userId) await prisma.user.delete({ where: { id: userId } });
  });

  it('pins a submission to its creation-time set and keeps old cases after active changes', async () => {
    const noSet = await submissionRepository.createPendingSubmissionForActiveSet({
      userId, slugOrId: problemId, code: 'print(1)', language: 'python',
    });
    expect(noSet.kind).toBe('no-active-set');

    const firstCase = await testcaseRepository.addTestcase(problemId, {
      isExample: true, input: '1', output: '1',
    });
    expect(firstCase).toBeTruthy();
    const firstSetId = (await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id!;
    const created = await submissionRepository.createPendingSubmissionForActiveSet({
      userId, slugOrId: problemId, code: 'print(1)', language: 'python',
    });
    expect(created.kind).toBe('created');
    if (created.kind !== 'created') throw new Error('Submission was not created');
    expect(created.submission.testcase_set_id).toBe(firstSetId);

    await testcaseRepository.addTestcase(problemId, { isExample: false, input: '2', output: '2' });
    const secondSetId = (await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id!;
    expect(secondSetId).not.toBe(firstSetId);
    expect(await prisma.testcase.findMany({ where: { testcase_set_id: firstSetId } })).toHaveLength(1);
    expect(await prisma.testcase.findMany({ where: { testcase_set_id: secondSetId } })).toHaveLength(2);
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: created.submission.id } })).testcase_set_id).toBe(firstSetId);

    const activeCases = await testcaseRepository.getTestcases(problemId);
    await testcaseRepository.deleteTestcase(problemId, activeCases[0].id);
    expect(await prisma.testcase.findMany({ where: { testcase_set_id: secondSetId } })).toHaveLength(2);
    expect(await testcaseRepository.getTestcases(problemId)).toHaveLength(1);
  });

  it('enforces unique version numbers per problem in MySQL', async () => {
    await expect(prisma.testcaseSet.create({
      data: { problem_id: problemId, version: 1 },
    })).rejects.toMatchObject({ code: 'P2002' } satisfies Partial<Prisma.PrismaClientKnownRequestError>);
  });

  it('allocates versions above the latest set after the active set is rolled back', async () => {
    const sets = await prisma.testcaseSet.findMany({ where: { problem_id: problemId }, orderBy: { version: 'asc' } });
    const newestVersion = sets[sets.length - 1].version;
    await testcaseRepository.activateTestcaseSet(problemId, sets[0].id);

    await testcaseRepository.addTestcase(problemId, { isExample: false, input: 'rollback-add', output: 'ok' });
    const addedSet = await prisma.problem.findUniqueOrThrow({ where: { id: problemId }, include: { activeTestcaseSet: true } });
    expect(addedSet.activeTestcaseSet?.version).toBe(newestVersion + 1);

    await testcaseRepository.activateTestcaseSet(problemId, sets[0].id);
    const [caseToDelete] = await testcaseRepository.getTestcases(problemId);
    await testcaseRepository.deleteTestcase(problemId, caseToDelete.id);
    const deletedSet = await prisma.problem.findUniqueOrThrow({ where: { id: problemId }, include: { activeTestcaseSet: true } });
    expect(deletedSet.activeTestcaseSet?.version).toBe(newestVersion + 2);
  });

  it('rejects editing when an active set belongs to another problem', async () => {
    const other = await prisma.problem.create({
      data: {
        title: 'Other versioning test', slug: `other-versioning-${suffix}`, description: 'test',
        difficulty: 'EASY', starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
      },
    });
    try {
      const foreignSet = await prisma.testcaseSet.create({ data: { problem_id: other.id, version: 1 } });
      const originalActiveSetId = (await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id;
      await expect(testcaseRepository.activateTestcaseSet(problemId, foreignSet.id)).resolves.toBeNull();
      expect((await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id)
        .toBe(originalActiveSetId);
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: foreignSet.id } });
      const setCount = await prisma.testcaseSet.count({ where: { problem_id: problemId } });
      await expect(testcaseRepository.addTestcase(problemId, {
        isExample: false, input: 'bad', output: 'bad',
      })).rejects.toThrow('Active testcase set belongs to another problem');
      expect(await prisma.testcaseSet.count({ where: { problem_id: problemId } })).toBe(setCount);
    } finally {
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: null } });
      await prisma.problem.delete({ where: { id: other.id } });
    }
  });
});
