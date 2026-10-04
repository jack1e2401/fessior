import { z } from 'zod';
import { ARCHIVE_LIMITS } from './archive-limits';

const filePath = z.string().regex(/^cases\/[A-Za-z0-9_-]+\.(in|out)$/);
export const manifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  cases: z.array(z.strictObject({
    id: z.string().regex(/^[A-Za-z0-9_-]+$/).max(100),
    input: filePath,
    output: filePath,
    isExample: z.boolean(),
  })).min(1).max(ARCHIVE_LIMITS.cases),
});
