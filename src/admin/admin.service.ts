import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HackathonStatus, TypeIALog } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async getDashboard() {
    // Récupérer le hackathon actuel (UPCOMING ou ONGOING)
    const hackathonActuel = await this.prisma.hackathon.findFirst({
      where: {
        status: {
          in: [HackathonStatus.UPCOMING, HackathonStatus.ONGOING],
        },
      },
      orderBy: {
        dateDebut: 'asc',
      },
    });

    if (!hackathonActuel) {
      return {
        totalInscrits: 0,
        parPromo: [],
        parTechnologie: [],
        message: 'Aucun hackathon actif',
      };
    }

    // Total d'inscriptions pour le hackathon actuel
    const totalInscrits = await this.prisma.inscription.count({
      where: {
        hackathonId: hackathonActuel.id,
      },
    });

    // Inscriptions par promo (promo est maintenant dans Inscription)
    const inscriptionsAvecPromo = await this.prisma.inscription.findMany({
      where: {
        hackathonId: hackathonActuel.id,
      },
      select: {
        promo: true,
      },
    });

    const parPromoMap = new Map<string, number>();
    inscriptionsAvecPromo.forEach((inscription) => {
      // promo peut être null, donc on utilise 'Non renseignée' par défaut
      const promo = inscription.promo || 'Non renseignée';
      parPromoMap.set(promo, (parPromoMap.get(promo) || 0) + 1);
    });

    const parPromo = Array.from(parPromoMap.entries()).map(([promo, count]) => ({
      promo,
      count,
    }));

    // Inscriptions par technologie (technologies est maintenant dans Inscription)
    const inscriptionsAvecTech = await this.prisma.inscription.findMany({
      where: {
        hackathonId: hackathonActuel.id,
      },
      select: {
        technologies: true,
      },
    });

    const parTechnologieMap = new Map<string, number>();
    inscriptionsAvecTech.forEach((inscription) => {
      // technologies est maintenant un Json dans Inscription
      if (inscription.technologies) {
        const techs = Array.isArray(inscription.technologies) 
          ? inscription.technologies 
          : (inscription.technologies as any);
        techs.forEach((tech: string) => {
          parTechnologieMap.set(tech, (parTechnologieMap.get(tech) || 0) + 1);
        });
      }
    });

    const parTechnologie = Array.from(parTechnologieMap.entries())
      .map(([technologie, count]) => ({
        technologie,
        count,
      }))
      .sort((a, b) => b.count - a.count); // Trier par nombre décroissant

    const stats = {
      hackathon: {
        id: hackathonActuel.id,
        nom: hackathonActuel.nom,
        status: hackathonActuel.status,
      },
      totalInscrits,
      parPromo,
      parTechnologie,
    };

    // Émettre l'événement temps réel de mise à jour des stats
    this.eventsGateway.emitStatsUpdate({
      totalInscrits,
      parPromo,
      parTechnologie,
    });

    return stats;
  }

  /**
   * Récupère les logs IA avec pagination et filtres
   */
  async getMonitoringLogs(page: number = 1, limit: number = 50, type?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) {
      // Support à la fois les strings et les enums
      where.type = type as any;
    }

    const [logs, total] = await Promise.all([
      this.prisma.iALog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
            },
          },
        },
      }),
      this.prisma.iALog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère les métriques simples (inscriptions par heure, etc.)
   */
  async getMetrics() {
    const maintenant = new Date();
    const ilYUneHeure = new Date(maintenant.getTime() - 60 * 60 * 1000);
    const ilYUnJour = new Date(maintenant.getTime() - 24 * 60 * 60 * 1000);

    // Inscriptions de la dernière heure
    const inscriptionsPerHour = await this.prisma.inscription.count({
      where: {
        createdAt: {
          gte: ilYUneHeure,
        },
      },
    });

    // Inscriptions des dernières 24 heures
    const inscriptionsPerDay = await this.prisma.inscription.count({
      where: {
        createdAt: {
          gte: ilYUnJour,
        },
      },
    });

    // Total d'inscriptions
    const totalInscriptions = await this.prisma.inscription.count();

    // Total d'utilisateurs
    const totalUsers = await this.prisma.user.count();

    // Analyses IA effectuées
    const totalAnalyses = await this.prisma.iALog.count({
      where: {
        type: TypeIALog.ANALYSE,
      },
    });

    // Moyenne des scores IA
    const scores = await this.prisma.iALog.findMany({
      where: {
        type: TypeIALog.ANALYSE,
        score: { not: null },
      },
      select: {
        score: true,
      },
    });

    const moyenneScore = scores.length > 0
      ? scores.reduce((acc, log) => acc + (log.score || 0), 0) / scores.length
      : null;

    return {
      inscriptions: {
        perHour: inscriptionsPerHour,
        perDay: inscriptionsPerDay,
        total: totalInscriptions,
      },
      users: {
        total: totalUsers,
      },
      ai: {
        totalAnalyses,
        averageScore: moyenneScore ? Math.round(moyenneScore * 100) / 100 : null,
      },
      timestamp: maintenant,
    };
  }
}

