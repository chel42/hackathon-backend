import { z } from 'zod';

export const AiLogsQueryDtoSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  type: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export type AiLogsQueryDtoZod = z.infer<typeof AiLogsQueryDtoSchema>;

