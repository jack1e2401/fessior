import { z } from 'zod';

export const submitCodeSchema = z.object({
  problemId: z.string().min(1, 'Problem ID or slug is required'),
  code: z.string().min(10, 'Code must be at least 10 characters long'),
  language: z.enum(['cpp', 'java', 'python']),
  matchId: z.string().optional(),
});

export const runCodeSchema = z.object({
  problemId: z.string().min(1).optional(),
  code: z.string().min(1).max(100_000),
  language: z.enum(['cpp', 'java', 'python']),
  input: z.string().max(20_000).optional(),
  customInput: z.string().max(20_000).optional(),
  exampleTestcaseIds: z.array(z.string().min(1)).max(200).optional(),
  customTestcases: z.array(z.object({
    input: z.string().max(20_000),
    expectedOutput: z.string().max(20_000).optional(),
  })).min(1).max(10).optional(),
}).superRefine((data, ctx) => {
  if (data.customTestcases) {
    const bytes = data.customTestcases.reduce((total, item) => total + Buffer.byteLength(item.input) + Buffer.byteLength(item.expectedOutput ?? ''), 0);
    if (bytes > 100_000) ctx.addIssue({ code: 'custom', message: 'Custom testcase data cannot exceed 100 KB', path: ['customTestcases'] });
    if (data.customInput !== undefined || data.input !== undefined || data.exampleTestcaseIds?.length) {
      ctx.addIssue({ code: 'custom', message: 'Choose only one testcase source', path: ['customTestcases'] });
    }
  }
});
