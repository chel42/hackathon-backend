import { UsePipes, applyDecorators } from '@nestjs/common';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { ZodSchema } from 'zod';

export function UseZodValidation(schema: ZodSchema) {
  return applyDecorators(UsePipes(new ZodValidationPipe(schema)));
}

// Alias pour compatibilité avec le code existant
export const ZodValidation = UseZodValidation;
