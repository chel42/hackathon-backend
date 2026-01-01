import { z } from 'zod';

export const UsersQueryDtoSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  role: z.enum(['USER', 'ADMIN']).optional(),
  search: z.string().optional(),
});

export type UsersQueryDtoZod = z.infer<typeof UsersQueryDtoSchema>;

