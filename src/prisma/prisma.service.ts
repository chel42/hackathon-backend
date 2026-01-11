import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Vérification minimale de DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }

    // Configuration ultra-minimale pour économiser la mémoire
    super({
      // 🚫 AUCUN LOGGING en production pour économiser la RAM
      log: process.env.NODE_ENV === 'production' ? [] : ['error'],
    });
  }

  async onModuleInit() {
    // Connexion silencieuse, pas de logs pour économiser la mémoire
    await this.$connect();
  }

  async onModuleDestroy() {
    // Déconnexion propre
    await this.$disconnect();
  }
}
