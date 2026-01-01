import { z } from 'zod';
import { HackathonStatus } from '@prisma/client';

export const CreateHackathonDtoSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  description: z.string().min(1, 'La description est requise'),
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
  dateLimiteInscription: z.coerce.date(),
  status: z.nativeEnum(HackathonStatus).optional(),
}).refine((data) => data.dateFin > data.dateDebut, {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin'],
}).refine((data) => data.dateLimiteInscription <= data.dateDebut, {
  message: 'La date limite d\'inscription doit être avant ou égale à la date de début',
  path: ['dateLimiteInscription'],
});

export type CreateHackathonDtoZod = z.infer<typeof CreateHackathonDtoSchema>;

