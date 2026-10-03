import { prisma } from '../../config/prisma';

const formatTestcase = (testcase: {
  id: string;
  problem_id: string;
  is_example: boolean;
  input: string;
  output: string;
}) => ({
  id: testcase.id,
  _id: testcase.id,
  problemId: testcase.problem_id,
  isExample: testcase.is_example,
  input: testcase.input,
  output: testcase.output,
});

export class TestcaseRepository {
  async addTestcase(problemId: string, data: { isExample: boolean; input: string; output: string }) {
    const testcase = await prisma.testcase.create({
      data: {
        problem_id: problemId,
        is_example: data.isExample,
        input: data.input,
        output: data.output,
      },
    });
    return formatTestcase(testcase);
  }

  async getTestcases(problemId: string, isExampleOnly = false) {
    const testcases = await prisma.testcase.findMany({
      where: { problem_id: problemId, ...(isExampleOnly ? { is_example: true } : {}) },
      orderBy: { id: 'asc' },
    });
    return testcases.map(formatTestcase);
  }

  async deleteTestcase(testcaseId: string) {
    try {
      const testcase = await prisma.testcase.delete({ where: { id: testcaseId } });
      return formatTestcase(testcase);
    } catch (error: any) {
      if (error?.code === 'P2025') return null;
      throw error;
    }
  }
}

export const testcaseRepository = new TestcaseRepository();
