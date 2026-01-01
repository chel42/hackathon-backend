import { z } from 'zod';

export const LoginDtoSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginDtoZod = z.infer<typeof LoginDtoSchema>;

