import { z } from 'zod';

export const UpdateProfileDtoSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').optional(),
  prenom: z.string().min(1, 'Le prénom est requis').optional(),
  promo: z.string().optional(),
  technologies: z.array(z.string()).optional(),
});

export type UpdateProfileDtoZod = z.infer<typeof UpdateProfileDtoSchema>;

