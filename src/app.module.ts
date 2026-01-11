import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HackathonModule } from './hackathon/hackathon.module';
import { InscriptionsModule } from './inscriptions/inscriptions.module';

@Module({
  imports: [
    // 🚨 VERSION ULTRA-MINIMALE POUR RENDER FREE
    // Seuls les modules essentiels sont chargés au démarrage
    PrismaModule,
    AuthModule,
    HackathonModule,
    InscriptionsModule,

    // 🚫 MODULES LOURDS DÉSACTIVÉS TEMPORAIREMENT
    // Ils consomment trop de RAM pour 512MB disponibles
    // EmailModule,     // ~20MB (nodemailer)
    // QueueModule,     // ~15MB (bull/Redis)
    // AiModule,        // ~50MB+ (dépendances IA)
    // EventsModule,    // ~25MB (socket.io)
    // AnnonceModule,   // ~10MB
    // AdminModule,     // ~15MB
    // ResultatsModule, // ~10MB
    // TeamsModule,     // ~10MB
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
