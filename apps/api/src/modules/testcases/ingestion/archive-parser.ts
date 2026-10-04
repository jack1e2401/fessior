import { stat } from 'node:fs/promises';
import { posix } from 'node:path';
import { Readable } from 'node:stream';
import yauzl, { Entry, ZipFile } from 'yauzl';
import { AppError } from '../../../errors/AppError';
import { ARCHIVE_LIMITS } from './archive-limits';
import { manifestSchema } from './manifest.schema';

export type ImportedCase = { position: number; isExample: boolean; input: string; output: string };
const invalid = (message: string, status = 422) => new AppError(message, status);
const decode = (bytes: Buffer) => {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw invalid('Archive contains invalid UTF-8 text'); }
};

function validateName(name: string, directory: boolean) {
  if (!name || name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name) || name.includes('\0'))
    throw invalid('Forbidden ZIP entry path');
  const parts = name.replace(/\/$/, '').split('/');
  if (parts.length > ARCHIVE_LIMITS.pathDepth || parts.some((part) => !part || part === '.' || part === '..') ||
      posix.normalize(name) !== name) throw invalid('Forbidden ZIP entry path');
  if (directory ? name !== 'cases/' : name !== 'manifest.json' && !/^cases\/[A-Za-z0-9_-]+\.(in|out)$/.test(name))
    throw invalid('Unexpected ZIP entry');
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
    if (bytes > max) { stream.destroy(); throw invalid('ZIP entry exceeds byte limit', 413); }
    chunks.push(buffer);
  }
  if (bytes !== entry.uncompressedSize) throw invalid('ZIP entry size mismatch');
  return Buffer.concat(chunks, bytes);
}

export async function parseTestcaseArchive(archivePath: string): Promise<ImportedCase[]> {
  if ((await stat(archivePath)).size > ARCHIVE_LIMITS.compressedBytes)
    throw invalid('ZIP archive exceeds compressed byte limit', 413);
  const zip = await new Promise<ZipFile>((resolve, reject) =>
    yauzl.open(archivePath, { lazyEntries: true, autoClose: true, validateEntrySizes: true, strictFileNames: true },
      (error, file) => error ? reject(invalid('Invalid ZIP archive')) : resolve(file!)));

  const files = new Map<string, Buffer>();
  const names = new Set<string>();
  let count = 0;
  let total = 0;
  let compressedTotal = 0;
  return new Promise<ImportedCase[]>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      zip.close();
      reject(error instanceof AppError ? error : invalid('Invalid ZIP archive'));
    };
    zip.on('error', fail);
    zip.on('entry', (entry: Entry) => {
      void (async () => {
        count++;
        if (count > ARCHIVE_LIMITS.entries) throw invalid('ZIP has too many entries', 413);
        const directory = entry.fileName.endsWith('/');
        const name = validateName(entry.fileName, directory);
        if (names.has(name)) throw invalid('Duplicate ZIP entry path');
        names.add(name);
        const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
        if (mode && mode !== (directory ? 0o040000 : 0o100000)) throw invalid('ZIP links and special files are forbidden');
        if (entry.externalFileAttributes & 0x400) throw invalid('ZIP reparse-point entries are forbidden');
        if (entry.isEncrypted()) throw invalid('Encrypted ZIP entries are forbidden');
        if (directory) {
          if (entry.uncompressedSize !== 0) throw invalid('Invalid ZIP directory');
          return;
        }
        if (entry.uncompressedSize > ARCHIVE_LIMITS.fileBytes) throw invalid('ZIP entry exceeds byte limit', 413);
        total += entry.uncompressedSize;
        compressedTotal += entry.compressedSize;
        if (total > ARCHIVE_LIMITS.totalUncompressedBytes) throw invalid('ZIP exceeds uncompressed byte limit', 413);
        if (entry.uncompressedSize > Math.max(1, entry.compressedSize) * ARCHIVE_LIMITS.compressionRatio ||
            total > Math.max(1, compressedTotal) * ARCHIVE_LIMITS.compressionRatio)
          throw invalid('ZIP compression ratio exceeds limit', 413);
        const contents = await readEntry(zip, entry, ARCHIVE_LIMITS.fileBytes);
        files.set(entry.fileName, contents);
      })().then(() => zip.readEntry(), fail);
    });
    zip.on('end', () => {
      if (settled) return;
      try {
        const raw = files.get('manifest.json');
        if (!raw) throw invalid('Missing manifest.json', 400);
        let parsed: unknown;
        try { parsed = JSON.parse(decode(raw)); }
        catch (error) { if (error instanceof AppError) throw error; throw invalid('Malformed manifest JSON', 400); }
        const manifest = manifestSchema.safeParse(parsed);
        if (!manifest.success) throw invalid('Invalid manifest schema', 400);
        const ids = new Set<string>();
        const references = new Set<string>();
        const cases = manifest.data.cases.map((item, position) => {
          if (ids.has(item.id) || references.has(item.input) || references.has(item.output))
            throw invalid('Duplicate testcase ID or file reference', 400);
          ids.add(item.id);
          if (item.input !== `cases/${item.id}.in` || item.output !== `cases/${item.id}.out`)
            throw invalid('Manifest testcase path does not match ID', 400);
          references.add(item.input);
          references.add(item.output);
          const input = files.get(item.input);
          const output = files.get(item.output);
          if (!input || !output) throw invalid('Manifest references a missing testcase pair');
          return { position, isExample: item.isExample, input: decode(input), output: decode(output) };
        });
        if ([...files.keys()].some((name) => name !== 'manifest.json' && !references.has(name)))
          throw invalid('ZIP contains an unreferenced testcase file');
        settled = true;
        resolve(cases);
      } catch (error) { fail(error); }
    });
    zip.readEntry();
  });
}
