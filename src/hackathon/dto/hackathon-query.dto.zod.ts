import { z } from 'zod';

export const HackathonQueryDtoSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).optional().default(10),
  year: z.coerce.number().int().optional(),
});

export type HackathonQueryDtoZod = z.infer<typeof HackathonQueryDtoSchema>;

