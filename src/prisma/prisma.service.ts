import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool | null = null;

  constructor() {
    // Vérifier que DATABASE_URL est défini AVANT d'appeler super()
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      const errorMessage = 
        'DATABASE_URL n\'est pas défini dans les variables d\'environnement. ' +
        'Veuillez créer un fichier .env à la racine du projet avec DATABASE_URL.';
      console.error('❌', errorMessage);
      throw new Error(
        'DATABASE_URL est requis. Créez un fichier .env à la racine du projet avec DATABASE_URL.',
      );
    }

    // Prisma 7 : Si l'URL commence par "prisma+", utiliser accelerateUrl
    // Sinon, utiliser un adapter PostgreSQL
    const options: any = {};
    let connectionType = '';
    let pool: Pool | null = null;
    
    if (databaseUrl.startsWith('prisma+')) {
      // Prisma Cloud/Accelerate
      options.accelerateUrl = databaseUrl;
      connectionType = 'Prisma Accelerate';
    } else {
      // Connexion directe PostgreSQL - Utiliser l'adapter Prisma 7
      // Créer le pool avant super() pour éviter d'utiliser this
      pool = new Pool({ connectionString: databaseUrl });
      options.adapter = new PrismaPg(pool);
      connectionType = 'PostgreSQL (connexion directe avec adapter)';
    }

    super(options);
    
    // Assigner le pool à this.pool après super()
    this.pool = pool;
    
    // Log après super() car this.logger n'est disponible qu'après
    this.logger.log(`PrismaClient initialisé avec ${connectionType}`);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connecté à la base de données PostgreSQL');
    } catch (error: any) {
      this.logger.error('Erreur de connexion à la base de données:', error);
      
      // Si c'est une erreur de connexion Prisma Accelerate, donner des instructions
      if (error?.code === 'ECONNREFUSED' && process.env.DATABASE_URL?.startsWith('prisma+')) {
        this.logger.error(
          '❌ Impossible de se connecter à Prisma Accelerate. ' +
          'Vérifiez que votre URL Prisma Accelerate est correcte et que le service est accessible. ' +
          'Si vous utilisez une base de données locale, utilisez une URL PostgreSQL directe: ' +
          'DATABASE_URL="postgresql://user:password@localhost:5432/database"',
        );
      }
      
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Fermer le pool de connexions PostgreSQL si utilisé
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Pool de connexions PostgreSQL fermé');
    }
    this.logger.log('Déconnecté de la base de données PostgreSQL');
  }
}

