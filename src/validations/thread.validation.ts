import { z } from 'zod';

export const createThreadSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Thread content cannot be empty').max(1000, 'Thread content exceeds 1000 characters'),
    mediaUrls: z.array(z.string().url('Invalid media URL')).optional().default([]),
    parentId: z.string().optional(),
    repostOfId: z.string().optional(),
  }),
});

export const updateThreadSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Thread content cannot be empty').max(1000, 'Thread content exceeds 1000 characters'),
    mediaUrls: z.array(z.string().url('Invalid media URL')).optional(),
  }),
});

export const getThreadsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).optional().default(1),
      limit: z.coerce.number().min(1).max(50).optional().default(20),
      authorId: z.string().optional(),
    })
    .optional()
    .default({ page: 1, limit: 20 }),
});
