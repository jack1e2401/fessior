import { z } from 'zod';

export const createProblemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  timeLimit: z.number().int().min(100).max(10000).default(2000),
  memoryLimit: z.number().int().min(16).max(1024).default(256),
  starterCodes: z.object({
    cpp: z.string().optional().default(''),
    java: z.string().optional().default(''),
    python: z.string().optional().default(''),
  }).default({ cpp: '', java: '', python: '' }),
  editorialMarkdown: z.string().optional(),
  editorialVideoUrl: z.string().url('Invalid editorial video URL').optional().or(z.literal('')),
  tags: z.array(z.string().uuid('Invalid tag ID format')).optional().default([]),
});

export const updateProblemSchema = createProblemSchema.partial();
