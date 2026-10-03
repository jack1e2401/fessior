import { z } from 'zod';

export const submitCodeSchema = z.object({
  problemId: z.string().min(1, 'Problem ID or slug is required'),
  code: z.string().min(10, 'Code must be at least 10 characters long'),
  language: z.enum(['cpp', 'java', 'python']),
  matchId: z.string().optional(),
});
