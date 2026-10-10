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

const uploadError = (message: string, status: number, code: 'UPLOAD_INVALID' | 'ARCHIVE_TOO_LARGE') =>
  new AppError(message, status, { stage: code === 'ARCHIVE_TOO_LARGE' ? 'resource_limits' : 'upload', code, databaseState: 'UNCHANGED' });

async function receiveArchive(req: Request, archivePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let parser: ReturnType<typeof busboy>;
    try { parser = busboy({ headers: req.headers, limits: { fileSize: ARCHIVE_LIMITS.compressedBytes + 1, files: 2, fields: 1, parts: 2 } }); }
    catch { reject(uploadError('Malformed multipart request', 400, 'UPLOAD_INVALID')); return; }
    const hash = createHash('sha256');
    let fileCount = 0;
    let problem: AppError | undefined;
    const writes: Promise<void>[] = [];
    parser.on('file', (name, stream) => {
      fileCount++;
      if (name !== 'archive' || fileCount !== 1) {
        problem = uploadError('Exactly one archive field is required', 400, 'UPLOAD_INVALID');
        stream.resume();
        return;
      }
      let bytes = 0;
      const meter = new Transform({ transform(chunk: Buffer, _encoding, callback) {
        bytes += chunk.length;
        if (bytes > ARCHIVE_LIMITS.compressedBytes) {
          problem = uploadError('ZIP exceeds compressed byte limit', 413, 'ARCHIVE_TOO_LARGE');
          callback(problem);
        } else { hash.update(chunk); callback(null, chunk); }
      } });
      stream.on('limit', () => { problem = uploadError('ZIP exceeds compressed byte limit', 413, 'ARCHIVE_TOO_LARGE'); });
      writes.push(pipeline(stream, meter, createWriteStream(archivePath)).catch((error) => {
        problem ??= error instanceof AppError ? error : uploadError('Upload stream failed', 400, 'UPLOAD_INVALID');
      }));
    });
    parser.on('field', () => { problem = uploadError('Only the archive field is accepted', 400, 'UPLOAD_INVALID'); });
    parser.on('filesLimit', () => { problem = uploadError('Exactly one archive field is required', 400, 'UPLOAD_INVALID'); });
    parser.on('partsLimit', () => { problem = uploadError('Unexpected multipart part', 400, 'UPLOAD_INVALID'); });
    parser.on('error', () => { problem ??= uploadError('Malformed multipart request', 400, 'UPLOAD_INVALID'); });
    req.on('aborted', () => {
      problem ??= uploadError('Upload aborted', 400, 'UPLOAD_INVALID');
      parser.destroy(problem);
    });
    req.on('error', () => {
      problem ??= uploadError('Upload stream failed', 400, 'UPLOAD_INVALID');
      parser.destroy(problem);
    });
    parser.on('close', () => {
      void Promise.all(writes).then(() => {
        if (problem) reject(problem);
        else if (fileCount !== 1) reject(uploadError('Exactly one archive field is required', 400, 'UPLOAD_INVALID'));
        else resolve(hash.digest('hex'));
      }, reject);
    });
    req.pipe(parser);
  });
}

export async function withUploadedArchive<T>(
  req: Request,
  useArchive: (path: string, checksum: string) => Promise<T>,
): Promise<T> {
  if (!req.headers['content-type']?.toLowerCase().startsWith('multipart/form-data'))
    throw uploadError('Expected multipart/form-data', 400, 'UPLOAD_INVALID');
  const tempDir = await mkdtemp(join(tmpdir(), 'fessior-import-'));
  const archivePath = join(tempDir, 'archive.zip');
  try {
    const checksum = await receiveArchive(req, archivePath);
    return await useArchive(archivePath, checksum);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
