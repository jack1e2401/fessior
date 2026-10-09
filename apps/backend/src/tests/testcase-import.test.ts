import { createWriteStream } from 'node:fs';
import { mkdtemp, readdir, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import yazl from 'yazl';
import app from '../app';
import { prisma } from '../config/prisma';
import { generateAccessToken } from '../modules/auth/jwt';
import { submissionRepository } from '../modules/submissions/submission.repository';
import { testcaseRepository } from '../modules/testcases/testcase.repository';
import { ARCHIVE_LIMITS } from '../modules/testcases/ingestion/archive-limits';

const manifest = (id = '001') => JSON.stringify({ schemaVersion: 1, cases: [
  { id, input: `cases/${id}.in`, output: `cases/${id}.out`, isExample: false },
] });
async function archive(entries: Array<[string, string]>) {
  const dir = await mkdtemp(join(tmpdir(), 'fessior-fixture-'));
  const path = join(dir, 'testcases.zip');
  const zip = new yazl.ZipFile();
  for (const [name, text] of entries) zip.addBuffer(Buffer.from(text), name);
  zip.end();
  await new Promise<void>((resolve, reject) => zip.outputStream.pipe(createWriteStream(path))
    .on('finish', resolve).on('error', reject));
  const bytes = await readFile(path);
  await rm(dir, { recursive: true, force: true });
  return bytes;
}
const validArchive = () => archive([
  ['manifest.json', manifest()], ['cases/001.in', 'private input\n'], ['cases/001.out', 'private output\n'],
]);

describe('administrator ZIP import and testcase secrecy', () => {
  const suffix = Date.now().toString(36);
  let problemId: string;
  let userId: string;
  let adminId: string;
  let originalSetId: string;
  let pinnedSubmissionId: string;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { username: `import_user_${suffix}`, email: `import_user_${suffix}@example.com` } });
    const admin = await prisma.user.create({ data: { username: `import_admin_${suffix}`, email: `import_admin_${suffix}@example.com`, role: 'ADMIN' } });
    userId = user.id; adminId = admin.id;
    userToken = generateAccessToken({ userId, role: 'USER' });
    adminToken = generateAccessToken({ userId: adminId, role: 'ADMIN' });
    const problem = await prisma.problem.create({ data: {
      title: 'Import test', slug: `import-${suffix}`, description: 'test', difficulty: 'EASY',
      starter_code_cpp: '', starter_code_java: '', starter_code_python: '',
    } });
    problemId = problem.id;
    await testcaseRepository.addTestcase(problemId, { isExample: true, input: 'public', output: 'public' });
    originalSetId = (await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id!;
    const created = await submissionRepository.createPendingSubmissionForActiveSet({
      userId, slugOrId: problemId, code: 'print(1)', language: 'python',
    });
    if (created.kind !== 'created') throw new Error('Expected a pinned submission');
    pinnedSubmissionId = created.submission.id;
  });

  afterAll(async () => {
    if (problemId) {
      await prisma.submission.deleteMany({ where: { problem_id: problemId } });
      await prisma.problem.update({ where: { id: problemId }, data: { active_testcase_set_id: null } });
      await prisma.problem.delete({ where: { id: problemId } });
    }
    if (userId) await prisma.user.deleteMany({ where: { id: { in: [userId, adminId] } } });
  });

  const importsBefore = async () => (await readdir(tmpdir())).filter((name) => name.startsWith('fessior-import-')).sort();

  it('forbids non-admin upload before parsing the body', async () => {
    const response = await request(app).post(`/api/v1/problems/${problemId}/testcase-sets/import`)
      .set('Authorization', `Bearer ${userToken}`).attach('archive', await validArchive(), 'cases.zip');
    expect(response.status).toBe(403);
  });

  it('rejects missing and multiple archive fields', async () => {
    const url = `/api/v1/problems/${problemId}/testcase-sets/import`;
    const missing = await request(app).post(url).set('Authorization', `Bearer ${adminToken}`)
      .field('description', 'not an archive');
    expect(missing.status).toBe(400);
    const bytes = await validArchive();
    const multiple = await request(app).post(url).set('Authorization', `Bearer ${adminToken}`)
      .attach('archive', bytes, 'one.zip').attach('archive', bytes, 'two.zip');
    expect(multiple.status).toBe(400);
  });

  it('enforces compressed upload bytes while streaming and cleans temp storage', async () => {
    const before = await importsBefore();
    const bytes = await validArchive();
    const oldLimit = ARCHIVE_LIMITS.compressedBytes;
    (ARCHIVE_LIMITS as unknown as Record<string, number>).compressedBytes = bytes.length - 1;
    try {
      const response = await request(app).post(`/api/v1/problems/${problemId}/testcase-sets/import`)
        .set('Authorization', `Bearer ${adminToken}`).attach('archive', bytes, 'too-big.zip');
      expect(response.status).toBe(413);
      expect(await importsBefore()).toEqual(before);
    } finally { (ARCHIVE_LIMITS as unknown as Record<string, number>).compressedBytes = oldLimit; }
  });

  it('imports a new version, preserves old submissions, hides cases, and cleans temp files', async () => {
    const before = await importsBefore();
    const bytes = await validArchive();
    const response = await request(app).post(`/api/v1/problems/${problemId}/testcase-sets/import`)
      .set('Authorization', `Bearer ${adminToken}`).attach('archive', bytes, 'cases.zip');
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ version: 2, testcaseCount: 1, exampleCount: 0, active: true });
    expect(response.body.data).not.toHaveProperty('input');
    expect(response.body.data.checksum).toBe(require('node:crypto').createHash('sha256').update(bytes).digest('hex'));
    expect((await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id)
      .toBe(response.body.data.testcaseSetId);
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: pinnedSubmissionId } })).testcase_set_id).toBe(originalSetId);
    const newSubmission = await submissionRepository.createPendingSubmissionForActiveSet({
      userId, slugOrId: problemId, code: 'print(2)', language: 'python',
    });
    expect(newSubmission.kind).toBe('created');
    if (newSubmission.kind === 'created') expect(newSubmission.submission.testcase_set_id).toBe(response.body.data.testcaseSetId);
    expect(await prisma.testcase.count({ where: { testcase_set_id: originalSetId } })).toBe(1);
    const userRead = await request(app).get(`/api/v1/problems/${problemId}/testcases`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(userRead.status).toBe(200);
    expect(userRead.body.data).toEqual([]);
    const adminRead = await request(app).get(`/api/v1/problems/${problemId}/testcases`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRead.body.data[0].output).toBe('private output\n');
    expect(await importsBefore()).toEqual(before);
  });

  it('rejects malformed manifest and removes its temp archive', async () => {
    const before = await importsBefore();
    const active = (await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id;
    const bytes = await archive([['manifest.json', '{']]);
    const response = await request(app).post(`/api/v1/problems/${problemId}/testcase-sets/import`)
      .set('Authorization', `Bearer ${adminToken}`).attach('archive', bytes, 'bad.zip');
    expect(response.status).toBe(400);
    expect((await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id).toBe(active);
    expect(await importsBefore()).toEqual(before);
  });

  it('returns 404 for an unknown problem without creating a set', async () => {
    const response = await request(app).post('/api/v1/problems/absent-phase3-problem/testcase-sets/import')
      .set('Authorization', `Bearer ${adminToken}`).attach('archive', await validArchive(), 'cases.zip');
    expect(response.status).toBe(404);
  });

  it('rejects a malicious archive and removes its temp archive', async () => {
    const before = await importsBefore();
    const bytes = await archive([['manifest.json', manifest()], ['cases/001.in', 'A'.repeat(40_000)], ['cases/001.out', '1']]);
    const response = await request(app).post(`/api/v1/problems/${problemId}/testcase-sets/import`)
      .set('Authorization', `Bearer ${adminToken}`).attach('archive', bytes, 'bomb.zip');
    expect(response.status).toBe(413);
    expect(await importsBefore()).toEqual(before);
  });

  it('removes the temp archive after a database failure', async () => {
    const before = await importsBefore();
    const count = await prisma.testcaseSet.count({ where: { problem_id: problemId } });
    const spy = jest.spyOn(testcaseRepository, 'importSet').mockRejectedValueOnce(new Error('synthetic database failure'));
    try {
      const response = await request(app).post(`/api/v1/problems/${problemId}/testcase-sets/import`)
        .set('Authorization', `Bearer ${adminToken}`).attach('archive', await validArchive(), 'cases.zip');
      expect(response.status).toBe(500);
      expect(await prisma.testcaseSet.count({ where: { problem_id: problemId } })).toBe(count);
      expect(await importsBefore()).toEqual(before);
    } finally { spy.mockRestore(); }
  });

  it('serializes concurrent imports into distinct versions', async () => {
    const [first, second] = await Promise.all([
      testcaseRepository.importSet(problemId, 'b'.repeat(64), [{ position: 0, isExample: true, input: 'one', output: 'one' }]),
      testcaseRepository.importSet(problemId, 'c'.repeat(64), [{ position: 0, isExample: true, input: 'two', output: 'two' }]),
    ]);
    expect(first.version).not.toBe(second.version);
    const current = await prisma.problem.findUniqueOrThrow({ where: { id: problemId }, include: { activeTestcaseSet: true } });
    expect(current.activeTestcaseSet?.version).toBe(Math.max(first.version, second.version));
  });

  it('allocates above the maximum version even when an older set is active', async () => {
    const latest = await prisma.testcaseSet.findFirstOrThrow({
      where: { problem_id: problemId }, orderBy: { version: 'desc' }, select: { version: true },
    });
    await testcaseRepository.activateTestcaseSet(problemId, originalSetId);
    const result = await testcaseRepository.importSet(problemId, 'd'.repeat(64), [
      { position: 0, isExample: false, input: 'new', output: 'new' },
    ]);
    expect(result.version).toBe(latest.version + 1);
    expect((await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id)
      .toBe(result.testcaseSetId);
  });

  it('rolls back an import when testcase insertion fails', async () => {
    const active = (await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id;
    const count = await prisma.testcaseSet.count({ where: { problem_id: problemId } });
    await expect(testcaseRepository.importSet(problemId, 'a'.repeat(64), [
      { position: 0, isExample: false, input: 'a', output: 'a' },
      { position: 0, isExample: false, input: 'b', output: 'b' },
    ])).rejects.toThrow();
    expect(await prisma.testcaseSet.count({ where: { problem_id: problemId } })).toBe(count);
    expect((await prisma.problem.findUniqueOrThrow({ where: { id: problemId } })).active_testcase_set_id).toBe(active);
  });
});
