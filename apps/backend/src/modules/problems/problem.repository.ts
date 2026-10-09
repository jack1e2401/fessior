import { Difficulty, Prisma, Problem } from '@prisma/client';
import { prisma } from '../../config/prisma';

type ProblemInput = {
  title?: string;
  slug?: string;
  description?: string;
  difficulty?: Difficulty;
  timeLimit?: number;
  memoryLimit?: number;
  starterCodes?: {
    cpp?: string;
    java?: string;
    python?: string;
  };
  editorialMarkdown?: string;
  editorialVideoUrl?: string;
};

const formatProblem = (problem: Problem) => ({
  id: problem.id,
  _id: problem.id,
  title: problem.title,
  slug: problem.slug,
  description: problem.description,
  difficulty: problem.difficulty,
  timeLimit: problem.time_limit,
  memoryLimit: problem.memory_limit,
  starterCodes: {
    cpp: problem.starter_code_cpp,
    java: problem.starter_code_java,
    python: problem.starter_code_python,
  },
  editorialMarkdown: problem.editorial_markdown,
  editorialVideoUrl: problem.editorial_video_url,
  createdAt: problem.created_at,
  updatedAt: problem.updated_at,
});

const toProblemData = (data: ProblemInput): Prisma.ProblemUpdateInput => {
  const update: Prisma.ProblemUpdateInput = {};

  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.description !== undefined) update.description = data.description;
  if (data.difficulty !== undefined) update.difficulty = data.difficulty;
  if (data.timeLimit !== undefined) update.time_limit = data.timeLimit;
  if (data.memoryLimit !== undefined) update.memory_limit = data.memoryLimit;
  if (data.starterCodes?.cpp !== undefined) update.starter_code_cpp = data.starterCodes.cpp;
  if (data.starterCodes?.java !== undefined) update.starter_code_java = data.starterCodes.java;
  if (data.starterCodes?.python !== undefined) update.starter_code_python = data.starterCodes.python;
  if (data.editorialMarkdown !== undefined) update.editorial_markdown = data.editorialMarkdown;
  if (data.editorialVideoUrl !== undefined) update.editorial_video_url = data.editorialVideoUrl;

  return update;
};

export class ProblemRepository {
  async createProblem(data: ProblemInput & Required<Pick<ProblemInput, 'title' | 'slug' | 'description' | 'difficulty'>>) {
    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        difficulty: data.difficulty,
        time_limit: data.timeLimit ?? 2000,
        memory_limit: data.memoryLimit ?? 256,
        starter_code_cpp: data.starterCodes?.cpp ?? '',
        starter_code_java: data.starterCodes?.java ?? '',
        starter_code_python: data.starterCodes?.python ?? '',
        editorial_markdown: data.editorialMarkdown,
        editorial_video_url: data.editorialVideoUrl,
      },
    });

    return formatProblem(problem);
  }

  async updateProblem(problemId: string, data: ProblemInput) {
    try {
      const problem = await prisma.problem.update({
        where: { id: problemId },
        data: toProblemData(data),
      });

      return formatProblem(problem);
    } catch (error: any) {
      if (error?.code === 'P2025') return null;
      throw error;
    }
  }

  async deleteProblem(problemId: string) {
    try {
      await prisma.problem.delete({
        where: { id: problemId },
      });
      return true;
    } catch (error: any) {
      if (error?.code === 'P2025') return false;
      throw error;
    }
  }

  async getProblemBySlug(slugOrId: string) {
    const problem = await prisma.problem.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
    });

    return problem ? formatProblem(problem) : null;
  }

  async findProblemBySlug(slug: string) {
    return prisma.problem.findUnique({
      where: { slug },
    });
  }

  async findProblemBySlugExcludingId(slug: string, problemId: string) {
    return prisma.problem.findFirst({
      where: {
        slug,
        NOT: { id: problemId },
      },
    });
  }

  async findProblemForSubmission(slugOrId: string) {
    return prisma.problem.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        time_limit: true,
      },
    });
  }

  async getProblemsList(filters: {
    search?: string;
    difficulty?: Difficulty;
    page: number;
    limit: number;
    userId?: string;
  }) {
    const { search, difficulty, page, limit, userId } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProblemWhereInput = {};
    if (difficulty) {
      whereClause.difficulty = difficulty;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [total, items] = await prisma.$transaction([
      prisma.problem.count({ where: whereClause }),
      prisma.problem.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const problemIds = items.map((item) => item.id);
    const submissionStats = problemIds.length
      ? await prisma.submission.groupBy({
          by: ['problem_id', 'status'],
          where: { problem_id: { in: problemIds } },
          _count: { _all: true },
        })
      : [];

    const statsMap = new Map<string, { totalSubmissions: number; acceptedSubmissions: number }>();
    for (const stat of submissionStats) {
      const current = statsMap.get(stat.problem_id) ?? { totalSubmissions: 0, acceptedSubmissions: 0 };
      current.totalSubmissions += stat._count._all;
      if (stat.status === 'ACCEPTED') {
        current.acceptedSubmissions += stat._count._all;
      }
      statsMap.set(stat.problem_id, current);
    }

    let userSolvedSet = new Set<string>();
    if (userId && problemIds.length > 0) {
      const userSolved = await prisma.submission.findMany({
        where: {
          user_id: userId,
          problem_id: { in: problemIds },
          status: 'ACCEPTED',
        },
        select: { problem_id: true },
      });

      userSolvedSet = new Set(userSolved.map((submission) => submission.problem_id));
    }

    const formattedItems = items.map((item) => {
      const stats = statsMap.get(item.id) ?? { acceptedSubmissions: 0, totalSubmissions: 0 };
      const acceptanceRate = stats.totalSubmissions > 0
        ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
        : 0;

      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        difficulty: item.difficulty,
        created_at: item.created_at,
        acceptanceRate,
        totalSubmissions: stats.totalSubmissions,
        isSolved: userSolvedSet.has(item.id),
      };
    });

    return {
      total,
      page,
      limit,
      items: formattedItems,
    };
  }
}

export const problemRepository = new ProblemRepository();
