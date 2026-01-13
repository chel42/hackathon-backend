// Charger les variables d'environnement EN PREMIER
// Utiliser require pour garantir l'ordre d'exécution
require('./config/env.config');

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { ConditionalValidationPipe } from './common/pipes/conditional-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration CORS pour autoriser le frontend Next.js
  // Utiliser une fonction pour vérifier l'origine dynamiquement
  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        'http://localhost:9002', // Frontend Next.js
        'http://localhost:5173', // Vite (si utilisé)
        'http://localhost:3001', // Autre port possible
        'http://127.0.0.1:9002',
        'http://127.0.0.1:5173',
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // En développement, accepter localhost avec n'importe quel port
        if (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // ValidationPipe global personnalisé qui skip la validation si pas de DTO classique
  // Cela permet au ZodValidationPipe de gérer la validation pour les endpoints qui l'utilisent
  app.useGlobalPipes(
    new ConditionalValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Hackathon')
    .setDescription('API pour la gestion des hackathons')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(
    `Application is running on: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  );
  console.log(
    `Swagger documentation: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/api`,
  );
}
bootstrap();
