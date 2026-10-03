import { z } from 'zod';

export const createTestcaseSchema = z.object({
  isExample: z.boolean().default(false),
  input: z.string(),
  output: z.string(),
});
