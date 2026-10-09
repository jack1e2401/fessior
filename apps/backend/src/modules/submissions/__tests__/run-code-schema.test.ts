import { runCodeSchema } from '../submission.schema';

describe('custom run testcase validation', () => {
  const base = { code: 'print(1)', language: 'python' as const };

  it('accepts up to ten bounded input/output cases', () => {
    const result = runCodeSchema.safeParse({ ...base, customTestcases: Array.from({ length: 10 }, () => ({ input: '', expectedOutput: '' })) });
    expect(result.success).toBe(true);
  });

  it('rejects eleven cases and an aggregate payload above 100 KB', () => {
    expect(runCodeSchema.safeParse({ ...base, customTestcases: Array.from({ length: 11 }, () => ({ input: '' })) }).success).toBe(false);
    expect(runCodeSchema.safeParse({ ...base, customTestcases: [{ input: 'a'.repeat(20_000), expectedOutput: 'b'.repeat(20_000) }, { input: 'c'.repeat(20_000), expectedOutput: 'd'.repeat(20_000) }, { input: 'e'.repeat(20_000) }, { input: 'f' }] }).success).toBe(false);
  });

  it('rejects mixing custom cases with the legacy single input', () => {
    expect(runCodeSchema.safeParse({ ...base, customInput: '', customTestcases: [{ input: '' }] }).success).toBe(false);
  });
});
