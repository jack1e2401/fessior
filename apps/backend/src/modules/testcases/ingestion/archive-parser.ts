import { stat } from 'node:fs/promises';
import { posix } from 'node:path';
import { Readable } from 'node:stream';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { AppError } from '../../../errors/AppError';
import type { TestcaseImportCheck, TestcaseImportFailureCode, TestcaseImportStage } from '@ocj/contracts';
import { ARCHIVE_LIMITS } from './archive-limits';
import { manifestSchema } from './manifest.schema';

export type ImportedCase = { position: number; isExample: boolean; input: string; output: string };
const invalid = (
  message: string,
  status = 422,
  code: TestcaseImportFailureCode = 'INVALID_ZIP',
  stage: TestcaseImportStage = 'archive_structure',
  entry?: string,
  completedSteps?: TestcaseImportCheck[],
) => new AppError(message, status, {
  stage,
  code,
  ...(entry ? { entry: entry.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 180) } : {}),
  databaseState: 'UNCHANGED',
  ...(completedSteps?.length ? { completedSteps } : {}),
});
const decode = (bytes: Buffer, stage: 'manifest' | 'testcase_pairs', completedSteps: TestcaseImportCheck[] = []) => {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch {
    const code = stage === 'manifest' ? 'INVALID_MANIFEST' : 'INVALID_CASE_TEXT';
    throw invalid('Archive contains invalid UTF-8 text', 422, code, stage, undefined, completedSteps);
  }
};

function validateName(name: string, directory: boolean) {
  if (!name || name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name) || name.includes('\0'))
    throw invalid('Forbidden ZIP entry path', 422, 'PATH_TRAVERSAL', 'archive_structure', name);
  const parts = name.replace(/\/$/, '').split('/');
  if (parts.length > ARCHIVE_LIMITS.pathDepth || parts.some((part) => !part || part === '.' || part === '..') ||
      posix.normalize(name) !== name) throw invalid('Forbidden ZIP entry path', 422, 'PATH_TRAVERSAL', 'archive_structure', name);
  if (directory ? name !== 'cases/' : name !== 'manifest.json' && !/^cases\/[A-Za-z0-9_-]+\.(in|out)$/.test(name))
    throw invalid('Unexpected ZIP entry', 422, 'UNSUPPORTED_ENTRY', 'archive_structure', name);
  return name.toLowerCase();
}

async function readEntry(zip: ZipFile, entry: Entry, max: number): Promise<Buffer> {
  const stream = await new Promise<Readable>((resolve, reject) =>
    zip.openReadStream(entry, (error, readable) => error ? reject(error) : resolve(readable as Readable)));
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.from(chunk as Buffer);
    bytes += buffer.length;
    if (bytes > max) { stream.destroy(); throw invalid('ZIP entry exceeds byte limit', 413, 'ENTRY_TOO_LARGE', 'resource_limits', entry.fileName); }
    chunks.push(buffer);
  }
  if (bytes !== entry.uncompressedSize) throw invalid('ZIP entry size mismatch', 422, 'INVALID_ZIP');
  return Buffer.concat(chunks, bytes);
}

type ArchiveTotals = { count: number; uncompressed: number; compressed: number };

function validateArchiveEntry(entry: Entry, names: Set<string>, totals: ArchiveTotals) {
  totals.count++;
  if (totals.count > ARCHIVE_LIMITS.entries) throw invalid('ZIP has too many entries', 413, 'TOO_MANY_ENTRIES', 'resource_limits', entry.fileName);
  const directory = entry.fileName.endsWith('/');
  const name = validateName(entry.fileName, directory);
  if (names.has(name)) throw invalid('Duplicate ZIP entry path', 422, 'DUPLICATE_ENTRY', 'archive_structure', entry.fileName);
  names.add(name);
  const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
  if (mode && mode !== (directory ? 0o040000 : 0o100000)) throw invalid('ZIP links and special files are forbidden', 422, 'SYMLINK', 'archive_structure', entry.fileName);
  if (entry.externalFileAttributes & 0x400) throw invalid('ZIP reparse-point entries are forbidden', 422, 'SYMLINK', 'archive_structure', entry.fileName);
  if (entry.isEncrypted()) throw invalid('Encrypted ZIP entries are forbidden', 422, 'UNSUPPORTED_ENTRY', 'archive_structure', entry.fileName);
  if (directory) {
    if (entry.uncompressedSize !== 0) throw invalid('Invalid ZIP directory', 422, 'UNSUPPORTED_ENTRY', 'archive_structure', entry.fileName);
    return true;
  }
  if (entry.uncompressedSize > ARCHIVE_LIMITS.fileBytes) throw invalid('ZIP entry exceeds byte limit', 413, 'ENTRY_TOO_LARGE', 'resource_limits', entry.fileName);
  totals.uncompressed += entry.uncompressedSize;
  totals.compressed += entry.compressedSize;
  if (totals.uncompressed > ARCHIVE_LIMITS.totalUncompressedBytes) throw invalid('ZIP exceeds uncompressed byte limit', 413, 'TOTAL_SIZE_EXCEEDED', 'resource_limits', entry.fileName);
  if (entry.uncompressedSize > Math.max(1, entry.compressedSize) * ARCHIVE_LIMITS.compressionRatio ||
      totals.uncompressed > Math.max(1, totals.compressed) * ARCHIVE_LIMITS.compressionRatio)
    throw invalid('ZIP compression ratio exceeds limit', 413, 'COMPRESSION_RATIO_EXCEEDED', 'resource_limits', entry.fileName);
  return false;
}

function buildCasesFromManifest(files: Map<string, Buffer>): ImportedCase[] {
  const completedBeforeManifest: TestcaseImportCheck[] = ['archive_structure', 'safe_paths', 'safe_entries', 'resource_limits'];
  const completedBeforePairs: TestcaseImportCheck[] = [...completedBeforeManifest, 'manifest'];
  const raw = files.get('manifest.json');
  if (!raw) throw invalid('Missing manifest.json', 400, 'MISSING_MANIFEST', 'manifest', undefined, completedBeforeManifest);
  let parsed: unknown;
  try { parsed = JSON.parse(decode(raw, 'manifest', completedBeforeManifest)); }
  catch (error) {
    if (error instanceof AppError) throw error;
    throw invalid('Malformed manifest JSON', 400, 'INVALID_MANIFEST', 'manifest', undefined, completedBeforeManifest);
  }
  const manifest = manifestSchema.safeParse(parsed);
  if (!manifest.success) throw invalid('Invalid manifest schema', 400, 'INVALID_MANIFEST', 'manifest', undefined, completedBeforeManifest);
  const ids = new Set<string>();
  const references = new Set<string>();
  const cases = manifest.data.cases.map((item, position) => {
    if (ids.has(item.id) || references.has(item.input) || references.has(item.output))
      throw invalid('Duplicate testcase ID or file reference', 400, 'DUPLICATE_ENTRY', 'testcase_pairs', undefined, completedBeforePairs);
    ids.add(item.id);
    if (item.input !== `cases/${item.id}.in` || item.output !== `cases/${item.id}.out`)
      throw invalid('Manifest testcase path does not match ID', 400, 'INVALID_MANIFEST', 'manifest', undefined, completedBeforeManifest);
    references.add(item.input);
    references.add(item.output);
    const input = files.get(item.input);
    const output = files.get(item.output);
    if (!input) throw invalid('Manifest references a missing input testcase', 422, 'MISSING_INPUT', 'testcase_pairs', item.input, completedBeforePairs);
    if (!output) throw invalid('Manifest references a missing output testcase', 422, 'MISSING_OUTPUT', 'testcase_pairs', item.output, completedBeforePairs);
    return { position, isExample: item.isExample, input: decode(input, 'testcase_pairs', completedBeforePairs), output: decode(output, 'testcase_pairs', completedBeforePairs) };
  });
  if ([...files.keys()].some((name) => name !== 'manifest.json' && !references.has(name)))
    throw invalid('ZIP contains an unreferenced testcase file', 422, 'UNREFERENCED_ENTRY', 'testcase_pairs', undefined, completedBeforePairs);
  return cases;
}

export async function parseTestcaseArchive(archivePath: string): Promise<ImportedCase[]> {
  if ((await stat(archivePath)).size > ARCHIVE_LIMITS.compressedBytes)
    throw invalid('ZIP archive exceeds compressed byte limit', 413, 'ARCHIVE_TOO_LARGE', 'resource_limits');
  const zip = await new Promise<ZipFile>((resolve, reject) =>
    // Windows ZIP tools may use backslashes as path separators. yauzl
    // normalizes them when strictFileNames is false; normalized names still
    // pass through traversal and allow-list validation below.
    yauzl.open(archivePath, { lazyEntries: true, autoClose: true, validateEntrySizes: true, strictFileNames: false },
      (error, file) => error ? reject(invalid('Invalid ZIP archive', 422, 'INVALID_ZIP')) : resolve(file!)));

  const files = new Map<string, Buffer>();
  const names = new Set<string>();
  const totals: ArchiveTotals = { count: 0, uncompressed: 0, compressed: 0 };
  return new Promise<ImportedCase[]>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      zip.close();
      reject(error instanceof AppError ? error : invalid('Invalid ZIP archive', 422, 'INVALID_ZIP'));
    };
    zip.on('error', fail);
    zip.on('entry', (entry: Entry) => {
      void (async () => {
        if (validateArchiveEntry(entry, names, totals)) return;
        const contents = await readEntry(zip, entry, ARCHIVE_LIMITS.fileBytes);
        files.set(entry.fileName, contents);
      })().then(() => zip.readEntry(), fail);
    });
    zip.on('end', () => {
      if (settled) return;
      try {
        const cases = buildCasesFromManifest(files);
        settled = true;
        resolve(cases);
      } catch (error) { fail(error); }
    });
    zip.readEntry();
  });
}
