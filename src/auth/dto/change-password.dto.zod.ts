import { z } from 'zod';

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

export type ChangePasswordDtoZod = z.infer<typeof ChangePasswordDtoSchema>;

