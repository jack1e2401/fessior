import { problemRepository } from './problem.repository';
import { prisma } from '../../config/prisma';
import { AppError } from '../../errors/AppError';
import { Difficulty } from '@prisma/client';

export class ProblemService {
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, '-') // replace spaces with -
      .replace(/[^\w\-]+/g, '') // remove all non-word chars
      .replace(/\-\-+/g, '-') // replace multiple - with single -
      .replace(/^-+/, '') // trim - from start of text
      .replace(/-+$/, ''); // trim - from end of text
  }

  async createProblem(data: {
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    timeLimit: number;
    memoryLimit: number;
    starterCodes: { cpp: string; java: string; python: string };
    editorialMarkdown?: string;
    editorialVideoUrl?: string;
    tags?: string[];
  }) {
    let slug = this.slugify(data.title);
    
    // Check slug collision
    const existingProblem = await prisma.problem.findUnique({
      where: { slug },
    });
    if (existingProblem) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    return await problemRepository.createProblem({
      ...data,
      slug,
    } as any);
  }

  async updateProblem(
    problemId: string,
    data: {
      title?: string;
      description?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      timeLimit?: number;
      memoryLimit?: number;
      starterCodes?: { cpp: string; java: string; python: string };
      editorialMarkdown?: string;
      editorialVideoUrl?: string;
      tags?: string[];
    }
  ) {
    const updateData: any = { ...data };
    
    if (data.title) {
      let slug = this.slugify(data.title);
      const existingProblem = await prisma.problem.findFirst({
        where: {
          slug,
          NOT: { id: problemId },
        },
      });
      if (existingProblem) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
      updateData.slug = slug;
    }

    const problem = await problemRepository.updateProblem(problemId, updateData);
    if (!problem) {
      throw new AppError('Problem not found', 404);
    }
    return problem;
  }

  async deleteProblem(problemId: string) {
    const deleted = await problemRepository.deleteProblem(problemId);
    if (!deleted) {
      throw new AppError('Problem not found', 404);
    }
    return true;
  }

  async getProblemBySlug(slug: string) {
    const problem = await problemRepository.getProblemBySlug(slug);
    if (!problem) {
      throw new AppError('Problem not found', 404);
    }
    return problem;
  }

  async getProblemsList(filters: {
    difficulty?: Difficulty;
    tagSlug?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    return await problemRepository.getProblemsList({
      difficulty: filters.difficulty,
      tagSlug: filters.tagSlug,
      page,
      limit,
      userId: filters.userId,
    });
  }

  // Tags Management
  async createTag(name: string, color?: string) {
    const slug = this.slugify(name);
    const existing = await prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError('Tag already exists', 400);
    }
    return await prisma.tag.create({
      data: { name, slug, color },
    });
  }

  async getTags() {
    return await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

}
export const problemService = new ProblemService();
