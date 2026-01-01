import { z } from 'zod';
import { AnnonceCible } from '@prisma/client';

export const CreateAnnonceDtoSchema = z.object({
  titre: z.string().min(1, 'Le titre est requis'),
  contenu: z.string().min(1, 'Le contenu est requis'),
  cible: z.nativeEnum(AnnonceCible),
  hackathonId: z.string().uuid('L\'ID du hackathon doit être un UUID valide').optional(),
});

export type CreateAnnonceDtoZod = z.infer<typeof CreateAnnonceDtoSchema>;

