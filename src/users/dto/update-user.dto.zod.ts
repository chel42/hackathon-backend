import { z } from 'zod';
import { Role } from '@prisma/client';

export const UpdateUserDtoSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  promo: z.string().optional().nullable(),
  technologies: z.array(z.string()).optional(),
  role: z.nativeEnum(Role).optional(),
});

export type UpdateUserDtoZod = z.infer<typeof UpdateUserDtoSchema>;
