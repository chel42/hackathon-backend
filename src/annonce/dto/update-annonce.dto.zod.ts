import { z } from 'zod';
import { AnnonceCible } from '@prisma/client';

export const UpdateAnnonceDtoSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis').optional(),
  contenu: z.string().min(1, 'Le contenu est requis').optional(),
  cible: z.nativeEnum(AnnonceCible).optional(),
  hackathonId: z.string().uuid('L\'ID du hackathon doit être un UUID valide').optional().nullable(),
});

export type UpdateAnnonceDtoZod = z.infer<typeof UpdateAnnonceDtoSchema>;
