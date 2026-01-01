import { z } from 'zod';

export const RegisterDtoSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  promo: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  hackathonId: z.string().uuid('L\'ID du hackathon doit être un UUID valide'),
});

export type RegisterDtoZod = z.infer<typeof RegisterDtoSchema>;

