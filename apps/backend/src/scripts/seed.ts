import '../config/env';
import { PrismaClient, Difficulty } from '@prisma/client';
import { hashPassword } from '../modules/auth/password';

const prisma = new PrismaClient();

const starterCodes = {
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n',
  java: 'class Main {\n  public static void main(String[] args) {\n  }\n}\n',
  python: 'def main():\n    pass\n\nif __name__ == "__main__":\n    main()\n',
};

async function cleanDatabase() {
  await prisma.matchParticipant.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.testcase.deleteMany({});
  await prisma.testcaseSet.deleteMany({});
  await prisma.problem.deleteMany({});
  await prisma.eloHistory.deleteMany({});
  await prisma.userActivity.deleteMany({});
  await prisma.refreshToken.deleteMany({});

  await prisma.user.deleteMany({});
}

async function seedProblem(data: {
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  testcases: Array<{ input: string; output: string; isExample: boolean }>;
}) {
  const problem = await prisma.problem.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      difficulty: data.difficulty,
      time_limit: 2000,
      memory_limit: 256,
      starter_code_cpp: starterCodes.cpp,
      starter_code_java: starterCodes.java,
      starter_code_python: starterCodes.python,
      testcase_sets: {
        create: {
          version: 1,
          testcases: {
            create: data.testcases.map((testcase, position) => ({
              position,
              input: testcase.input,
              output: testcase.output,
              is_example: testcase.isExample,
            })),
          },
        },
      },
    },
    include: { testcase_sets: true },
  });
  const activeSetId = problem.testcase_sets[0].id;
  await prisma.problem.update({ where: { id: problem.id }, data: { active_testcase_set_id: activeSetId } });
  return { ...problem, active_testcase_set_id: activeSetId };
}

async function main() {
  console.log('Cleaning MySQL database...');
  await cleanDatabase();

  console.log('Seeding users...');
  const defaultPassword = await hashPassword('password123');
  const [admin, tester, ace] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password_hash: defaultPassword,
        role: 'ADMIN',
        elo_rating: 1500,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tester@example.com',
        username: 'tester',
        password_hash: defaultPassword,
        role: 'USER',
        elo_rating: 1200,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ace@example.com',
        username: 'ace',
        password_hash: defaultPassword,
        role: 'USER',
        elo_rating: 1680,
      },
    }),
  ]);

  console.log('Seeding problems and testcases...');
  const twoSum = await seedProblem({
    title: 'Two Sum',
    slug: 'two-sum',
    description: '<p>Given an integer array <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers that add up to <code>target</code>.</p>',
    difficulty: Difficulty.EASY,
    testcases: [
      { isExample: true, input: '4\n2 7 11 15\n9', output: '0 1' },
      { isExample: true, input: '3\n3 2 4\n6', output: '1 2' },
      { isExample: false, input: '2\n3 3\n6', output: '0 1' },
    ],
  });

  const fibonacci = await seedProblem({
    title: 'Fibonacci Number',
    slug: 'fibonacci',
    description: '<p>Compute the nth Fibonacci number where <code>F(0)=0</code>, <code>F(1)=1</code>, and <code>F(n)=F(n-1)+F(n-2)</code>.</p>',
    difficulty: Difficulty.EASY,
    testcases: [
      { isExample: true, input: '2', output: '1' },
      { isExample: true, input: '4', output: '3' },
      { isExample: false, input: '10', output: '55' },
    ],
  });

  await seedProblem({
    title: 'Maximum Pair Sum',
    slug: 'maximum-pair-sum',
    description: '<p>Given a list of integers, find the maximum sum of two distinct elements.</p>',
    difficulty: Difficulty.MEDIUM,
    testcases: [
      { isExample: true, input: '5\n1 9 3 7 2', output: '16' },
      { isExample: false, input: '4\n-5 -1 -9 -3', output: '-4' },
    ],
  });

  console.log('Seeding sample submissions...');
  await prisma.submission.createMany({
    data: [
      {
        user_id: tester.id,
        problem_id: twoSum.id,
        testcase_set_id: twoSum.active_testcase_set_id,
        code: 'print("0 1")',
        language: 'python',
        status: 'ACCEPTED',
        test_cases_passed: 3,
        test_cases_total: 3,
        execution_time: 0.04,
        memory_used: 1024,
      },
      {
        user_id: ace.id,
        problem_id: fibonacci.id,
        testcase_set_id: fibonacci.active_testcase_set_id,
        code: 'print(55)',
        language: 'python',
        status: 'WA',
        test_cases_passed: 2,
        test_cases_total: 3,
        execution_time: 0.03,
        memory_used: 1024,
      },
    ],
  });

  console.log('Seed completed.');
  console.log('Admin login: admin@example.com / password123');
  console.log('User login: tester@example.com / password123');
  console.log(`Seed owner: ${admin.username}`);
}

main()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
