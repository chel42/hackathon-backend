// 🚨 VERSION ULTRA-MINIMALE POUR RENDER FREE (512MB RAM)
// CHARGEMENT ABSOLUMENT MINIMAL - AUCUNE FONCTIONNALITÉ LOURDE

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    // 🚨 LOGGER COMPLÈTEMENT DÉSACTIVÉ pour économiser RAM
    const app = await NestFactory.create(AppModule, {
      logger: false, // PAS DE LOG DU TOUT
    });

    // 🚨 CORS ULTRA-SIMPLE
    app.enableCors({
      origin: true, // Accepter tout pour l'instant
      credentials: false,
    });

    // 🚨 PORT FIXE POUR RENDER (pas de fallback)
    const port = parseInt(process.env.PORT || '10000');

    // 🚨 DÉMARRAGE SYNCHRONE - pas d'await pour économiser mémoire
    app.listen(port, '0.0.0.0').then(() => {
      // 🚨 LOG MINIMAL ABSOLUMENT ESSENTIEL
      console.log(`OK:${port}`); // Format simple pour Render
    }).catch((error) => {
      console.error(`ERROR:${error.message}`);
      process.exit(1);
    });

  } catch (error) {
    console.error(`FATAL:${error.message}`);
    process.exit(1);
  }
}

// 🚨 GESTION D'ERREUR MINIMALE
process.on('uncaughtException', (error) => {
  console.error(`CRASH:${error.message}`);
  process.exit(1);
});

bootstrap();
