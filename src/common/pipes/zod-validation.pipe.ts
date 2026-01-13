import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    // Ne valider que le body
    if (metadata.type !== 'body') return value;

    // NestJS parse automatiquement le JSON, on valide directement avec Zod
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: error.issues.map((issue) => ({
            path: Array.isArray(issue.path) ? issue.path.join('.') : issue.path,
            message: issue.message,
          })),
        });
      }

      throw new BadRequestException({
        message: 'Validation failed',
        error: 'Bad Request',
        statusCode: 400,
      });
    }
  }
}
