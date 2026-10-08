import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    bio: z.string().max(160).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
  }),
});
