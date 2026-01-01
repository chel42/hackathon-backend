import { z } from 'zod';

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Le refresh token est requis'),
});

export type RefreshTokenDtoZod = z.infer<typeof RefreshTokenDtoSchema>;


