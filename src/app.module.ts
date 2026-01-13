import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { QueueModule } from './queue/queue.module';
import { HackathonModule } from './hackathon/hackathon.module';
import { AnnonceModule } from './annonce/annonce.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { EventsModule } from './events/events.module';
import { InscriptionsModule } from './inscriptions/inscriptions.module';
import { ResultatsModule } from './resultats/resultats.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    PrismaModule,
    AuthModule,
    EmailModule,
    QueueModule,
    HackathonModule,
    AnnonceModule,
    AdminModule,
    AiModule,
    EventsModule,
    InscriptionsModule,
    ResultatsModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
