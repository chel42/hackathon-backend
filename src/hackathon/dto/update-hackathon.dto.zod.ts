import { z } from 'zod';
import { HackathonStatus } from '@prisma/client';

export const UpdateHackathonDtoSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').optional(),
  description: z.string().min(1, 'La description est requise').optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
  dateLimiteInscription: z.coerce.date().optional(),
  status: z.nativeEnum(HackathonStatus).optional(),
}).refine((data) => {
  if (data.dateDebut && data.dateFin) {
    return data.dateFin > data.dateDebut;
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin'],
});

export type UpdateHackathonDtoZod = z.infer<typeof UpdateHackathonDtoSchema>;
