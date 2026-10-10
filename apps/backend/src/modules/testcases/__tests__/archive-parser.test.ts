import { mkdtemp, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yazl from 'yazl';
import { parseTestcaseArchive } from '../ingestion/archive-parser';
import { ARCHIVE_LIMITS } from '../ingestion/archive-limits';

const manifest = (cases: unknown[]) => JSON.stringify({ schemaVersion: 1, cases });
const one = { id: '001', input: 'cases/001.in', output: 'cases/001.out', isExample: true };

async function zip(entries: Array<[string, string | Buffer]>) {
  const dir = await mkdtemp(join(tmpdir(), 'fessior-zip-test-'));
  const path = join(dir, 'archive.zip');
  const archive = new yazl.ZipFile();
  for (const [name, value] of entries) archive.addBuffer(Buffer.from(value), name);
  archive.end();
  await new Promise<void>((resolve, reject) => {
    archive.outputStream.pipe(createWriteStream(path)).on('finish', resolve).on('error', reject);
  });
  return { path, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

async function alteredZip(source: string, target: string) {
  if (Buffer.byteLength(source) !== Buffer.byteLength(target)) throw new Error('Fixture names must have equal length');
  const fixture = await zip([['manifest.json', manifest([one])], ['cases/001.in', '1'], ['cases/001.out', '1']]);
  const bytes = await require('node:fs/promises').readFile(fixture.path) as Buffer;
  const needle = Buffer.from(source);
  let replacements = 0;
  for (let at = bytes.indexOf(needle); at !== -1; at = bytes.indexOf(needle, at + needle.length)) {
    bytes.write(target, at, 'utf8'); replacements++;
  }
  if (replacements < 2) throw new Error('Expected local and central ZIP filenames');
  await require('node:fs/promises').writeFile(fixture.path, bytes);
  return fixture;
}

async function alteredHeader(kind: 'symlink' | 'encrypted' | 'reparse') {
  const fixture = await zip([['manifest.json', manifest([one])], ['cases/001.in', '1'], ['cases/001.out', '1']]);
  const fs = require('node:fs/promises');
  const bytes = await fs.readFile(fixture.path) as Buffer;
  const local = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const central = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  const localAt = bytes.indexOf(local);
  const centralAt = bytes.indexOf(central);
  if (localAt < 0 || centralAt < 0) throw new Error('Malformed fixture');
  if (kind === 'encrypted') {
    bytes.writeUInt16LE(bytes.readUInt16LE(localAt + 6) | 1, localAt + 6);
    bytes.writeUInt16LE(bytes.readUInt16LE(centralAt + 8) | 1, centralAt + 8);
  } else if (kind === 'reparse') {
    bytes.writeUInt32LE((bytes.readUInt32LE(centralAt + 38) | 0x400) >>> 0, centralAt + 38);
  } else {
    bytes.writeUInt32LE((0o120777 << 16) >>> 0, centralAt + 38);
  }
  await fs.writeFile(fixture.path, bytes);
  return fixture;
}

describe('hostile testcase archives', () => {
  it('preserves manifest order and exact UTF-8 text', async () => {
    const fixture = await zip([
      ['cases/002.out', 'two\n'], ['cases/001.in', '  α\r\n'],
      ['manifest.json', manifest([one, { id: '002', input: 'cases/002.in', output: 'cases/002.out', isExample: false }])],
      ['cases/001.out', 'one\n'], ['cases/002.in', '2\n'],
    ]);
    try {
      expect(await parseTestcaseArchive(fixture.path)).toEqual([
        { position: 0, isExample: true, input: '  α\r\n', output: 'one\n' },
        { position: 1, isExample: false, input: '2\n', output: 'two\n' },
      ]);
    } finally { await fixture.cleanup(); }
  });

  it.each([
    ['missing manifest', [['cases/001.in', '1'], ['cases/001.out', '1']]],
    ['bad JSON', [['manifest.json', '{'], ['cases/001.in', '1'], ['cases/001.out', '1']]],
    ['empty cases', [['manifest.json', manifest([])]]],
    ['missing output', [['manifest.json', manifest([one])], ['cases/001.in', '1']]],
    ['unexpected file', [['manifest.json', manifest([one])], ['cases/001.in', '1'], ['cases/001.out', '1'], ['secret.txt', 'x']]],
  ] as Array<[string, Array<[string, string]>]>)('rejects %s', async (_label, entries) => {
    const fixture = await zip(entries);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow(); }
    finally { await fixture.cleanup(); }
  });

  it.each([
    ['parent traversal', '../evil.binx', false],
    ['absolute Unix path', '/cases/001.i', false],
    ['Windows absolute path', 'C:\\evil1.txt', false],
    ['Windows separators', 'cases\\001.in', true],
  ] as Array<[string, string, boolean]>)('validates %s', async (_label, target, accepted) => {
    const fixture = await alteredZip('cases/001.in', target);
    try {
      if (accepted) {
        await expect(parseTestcaseArchive(fixture.path)).resolves.toEqual([
          { position: 0, isExample: true, input: '1', output: '1' },
        ]);
      } else {
        await expect(parseTestcaseArchive(fixture.path)).rejects.toMatchObject({
          importFailure: { stage: 'archive_structure', code: 'PATH_TRAVERSAL', databaseState: 'UNCHANGED' },
        });
      }
    }
    finally { await fixture.cleanup(); }
  });

  it('rejects duplicate case IDs and file references', async () => {
    const fixture = await zip([
      ['manifest.json', manifest([one, one])], ['cases/001.in', '1'], ['cases/001.out', '1'],
    ]);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow('Duplicate'); }
    finally { await fixture.cleanup(); }
  });

  it('rejects duplicate ZIP paths', async () => {
    const fixture = await zip([
      ['manifest.json', manifest([one])], ['cases/001.in', '1'], ['cases/001.in', '2'], ['cases/001.out', '1'],
    ]);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow('Duplicate ZIP entry'); }
    finally { await fixture.cleanup(); }
  });

  it('rejects excessive path depth', async () => {
    const fixture = await zip([
      ['manifest.json', manifest([one])], ['cases/001.in', '1'], ['cases/001.out', '1'],
      ['cases/a/b/c/d.in', '1'],
    ]);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow('Forbidden ZIP entry path'); }
    finally { await fixture.cleanup(); }
  });

  it.each(['symlink', 'encrypted', 'reparse'] as const)('rejects %s entries', async (kind) => {
    const fixture = await alteredHeader(kind);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow(); }
    finally { await fixture.cleanup(); }
  });

  it.each([
    ['unsupported schema', JSON.stringify({ schemaVersion: 2, cases: [one] })],
    ['wrong extension', manifest([{ ...one, output: 'cases/001.txt' }])],
    ['missing input', manifest([{ ...one, input: 'cases/002.in' }])],
  ])('rejects %s', async (_label, badManifest) => {
    const fixture = await zip([
      ['manifest.json', badManifest], ['cases/001.in', '1'], ['cases/001.out', '1'],
    ]);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow(); }
    finally { await fixture.cleanup(); }
  });

  it('rejects a high-ratio compressed entry', async () => {
    const fixture = await zip([
      ['manifest.json', manifest([one])], ['cases/001.in', 'A'.repeat(40_000)], ['cases/001.out', '1'],
    ]);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow('compression ratio'); }
    finally { await fixture.cleanup(); }
  });

  it('rejects invalid UTF-8 instead of changing testcase bytes', async () => {
    const fixture = await zip([
      ['manifest.json', manifest([one])], ['cases/001.in', Buffer.from([0xff])], ['cases/001.out', '1'],
    ]);
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toThrow('invalid UTF-8'); }
    finally { await fixture.cleanup(); }
  });

  it.each([
    ['entry count', 'entries', 2],
    ['single file bytes', 'fileBytes', 8],
    ['total bytes', 'totalUncompressedBytes', 12],
  ] as const)('enforces %s using small fixtures', async (_label, key, limit) => {
    const fixture = await zip([
      ['manifest.json', manifest([one])], ['cases/001.in', '1234567890'], ['cases/001.out', '1234567890'],
    ]);
    const previous = ARCHIVE_LIMITS[key];
    (ARCHIVE_LIMITS as unknown as Record<string, number>)[key] = limit;
    try { await expect(parseTestcaseArchive(fixture.path)).rejects.toMatchObject({ statusCode: 413 }); }
    finally { (ARCHIVE_LIMITS as unknown as Record<string, number>)[key] = previous; await fixture.cleanup(); }
  });
});
