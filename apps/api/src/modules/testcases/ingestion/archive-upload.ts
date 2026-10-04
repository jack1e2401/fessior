import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Request } from 'express';
import busboy from 'busboy';
import { AppError } from '../../../errors/AppError';
import { ARCHIVE_LIMITS } from './archive-limits';

export async function withUploadedArchive<T>(
  req: Request,
  useArchive: (path: string, checksum: string) => Promise<T>,
): Promise<T> {
  if (!req.headers['content-type']?.toLowerCase().startsWith('multipart/form-data'))
    throw new AppError('Expected multipart/form-data', 400);
  const tempDir = await mkdtemp(join(tmpdir(), 'fessior-import-'));
  const archivePath = join(tempDir, 'archive.zip');
  try {
    const checksum = await new Promise<string>((resolve, reject) => {
      let parser: ReturnType<typeof busboy>;
      try { parser = busboy({ headers: req.headers, limits: { fileSize: ARCHIVE_LIMITS.compressedBytes + 1, files: 2, fields: 1, parts: 2 } }); }
      catch { reject(new AppError('Malformed multipart request', 400)); return; }
      const hash = createHash('sha256');
      let fileCount = 0;
      let problem: AppError | undefined;
      const writes: Promise<void>[] = [];
      parser.on('file', (name, stream) => {
        fileCount++;
        if (name !== 'archive' || fileCount !== 1) {
          problem = new AppError('Exactly one archive field is required', 400);
          stream.resume();
          return;
        }
        let bytes = 0;
        const meter = new Transform({ transform(chunk: Buffer, _encoding, callback) {
          bytes += chunk.length;
          if (bytes > ARCHIVE_LIMITS.compressedBytes) {
            problem = new AppError('ZIP exceeds compressed byte limit', 413);
            callback(problem);
          } else { hash.update(chunk); callback(null, chunk); }
        } });
        stream.on('limit', () => { problem = new AppError('ZIP exceeds compressed byte limit', 413); });
        writes.push(pipeline(stream, meter, createWriteStream(archivePath)).catch((error) => {
          problem ??= error instanceof AppError ? error : new AppError('Upload stream failed', 400);
        }));
      });
      parser.on('field', () => { problem = new AppError('Only the archive field is accepted', 400); });
      parser.on('filesLimit', () => { problem = new AppError('Exactly one archive field is required', 400); });
      parser.on('partsLimit', () => { problem = new AppError('Unexpected multipart part', 400); });
      parser.on('error', () => { problem ??= new AppError('Malformed multipart request', 400); });
      req.on('aborted', () => {
        problem ??= new AppError('Upload aborted', 400);
        parser.destroy(problem);
      });
      req.on('error', () => {
        problem ??= new AppError('Upload stream failed', 400);
        parser.destroy(problem);
      });
      parser.on('close', () => {
        void Promise.all(writes).then(() => {
          if (problem) reject(problem);
          else if (fileCount !== 1) reject(new AppError('Exactly one archive field is required', 400));
          else resolve(hash.digest('hex'));
        }, reject);
      });
      req.pipe(parser);
    });
    return await useArchive(archivePath, checksum);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
