import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Vérifier que DATABASE_URL est défini
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      const errorMessage =
        "DATABASE_URL n'est pas défini dans les variables d'environnement. " +
        'Veuillez créer un fichier .env à la racine du projet avec DATABASE_URL.';
      console.error('❌', errorMessage);
      throw new Error(
        'DATABASE_URL est requis. Créez un fichier .env à la racine du projet avec DATABASE_URL.',
      );
    }

    // Configuration avec adapter pour Prisma 5+
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({
      adapter,
      log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
    });

    this.logger.log('PrismaClient initialisé');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connecté à la base de données PostgreSQL');
    } catch (error: any) {
      this.logger.error('Erreur de connexion à la base de données:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Déconnecté de la base de données PostgreSQL');
  }
}
