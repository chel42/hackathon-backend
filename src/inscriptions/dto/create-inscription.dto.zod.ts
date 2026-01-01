import { z } from 'zod';

export const CreateInscriptionDtoSchema = z.object({
  hackathonId: z.string().uuid('L\'ID du hackathon doit être un UUID valide'),
});

export type CreateInscriptionDtoZod = z.infer<typeof CreateInscriptionDtoSchema>;

