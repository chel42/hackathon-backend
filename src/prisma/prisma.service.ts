import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      const warnMessage =
        "⚠️ DATABASE_URL n'est pas défini. L'application démarrera sans connexion à la base de données (mode smoke-test).";
      // Avoid using `this` before super(); use console for early startup logs.
      console.warn('⚠️', warnMessage);

      // Provide a dummy PostgreSQL adapter (non-functional) so PrismaClient can be instantiated
      // without an actual database connection. $connect will fail later and is handled in onModuleInit.
      const connectionString = 'postgresql://127.0.0.1:1';
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);

      super({
        adapter,
        log: ['warn', 'error'],
      });

      console.log('PrismaClient initialisé avec adaptateur factice (aucune DB configurée)');
      return;
    }

    // Configuration avec adaptateur PostgreSQL pour compatibilité
    const connectionString = databaseUrl.replace('prisma://', 'postgresql://');

    // Créer le pool de connexions PostgreSQL
    const pool = new Pool({ connectionString });

    // Créer l'adaptateur Prisma pour PostgreSQL
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['warn', 'error'],
    });

    this.logger.log('PrismaClient avec adaptateur PostgreSQL initialisé');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connecté à la base de données PostgreSQL');
    } catch (error: any) {
      // Pour permettre des smoke-tests et démarrages sans base (ex: CI smoke test),
      // ne pas arrêter le process si la connexion échoue au démarrage.
      // En production, la job de migration s'assurera que la DB est disponible.
      this.logger.warn(
        "Impossible de se connecter à la base de données au démarrage. L'application continuera sans DB (mode smoke-test).",
        error?.message || error,
      );
      // Ne pas throw ici: l'application pourra répondre sur /health même si la DB est absente.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Déconnecté de la base de données PostgreSQL');
  }
}
