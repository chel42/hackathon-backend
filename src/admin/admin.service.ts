import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  /**
   * Récupérer toutes les inscriptions (Admin uniquement)
   */
  async getAllInscriptions() {
    return this.prisma.inscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            role: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            nom: true,
            description: true,
            dateDebut: true,
            dateFin: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Modifier une inscription (Admin uniquement) - Principalement pour changer le statut
   */
  async updateInscription(
    id: string,
    updateDto: { statut?: string; promo?: string; technologies?: any },
  ) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
    });

    if (!inscription) {
      throw new NotFoundException(`Inscription avec l'ID ${id} non trouvée`);
    }

    return this.prisma.inscription.update({
      where: { id },
      data: {
        ...(updateDto.statut && { statut: updateDto.statut as any }),
        ...(updateDto.promo !== undefined && { promo: updateDto.promo as any }),
        ...(updateDto.technologies !== undefined && {
          technologies: updateDto.technologies,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  /**
   * Supprimer une inscription (Admin uniquement)
   */
  async deleteInscription(id: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
    });

    if (!inscription) {
      throw new NotFoundException(`Inscription avec l'ID ${id} non trouvée`);
    }

    await this.prisma.inscription.delete({
      where: { id },
    });

    return { message: 'Inscription supprimée avec succès' };
  }

  /**
   * Récupérer tous les utilisateurs (Admin uniquement)
   */
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inscriptions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Modifier un utilisateur (Admin uniquement)
   */
  async updateUser(
    id: string,
    updateDto: { nom?: string; prenom?: string; email?: string; role?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateDto.email },
      });
      if (existingUser) {
        throw new BadRequestException(
          'Cet email est déjà utilisé par un autre utilisateur',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(updateDto.nom && { nom: updateDto.nom }),
        ...(updateDto.prenom && { prenom: updateDto.prenom }),
        ...(updateDto.email && { email: updateDto.email }),
        ...(updateDto.role && { role: updateDto.role as any }),
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Supprimer un utilisateur (Admin uniquement)
   */
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    // Ne pas permettre de supprimer le dernier admin
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Impossible de supprimer le dernier administrateur',
        );
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }

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

    const parPromo = Array.from(parPromoMap.entries()).map(
      ([promo, count]) => ({
        promo,
        count,
      }),
    );

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

    const moyenneScore =
      scores.length > 0
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
        averageScore: moyenneScore
          ? Math.round(moyenneScore * 100) / 100
          : null,
      },
      timestamp: maintenant,
    };
  }

  /**
   * Récupérer le profil d'un utilisateur
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Mettre à jour le profil d'un utilisateur
   */
  async updateUserProfile(userId: string, updateData: { nom?: string; prenom?: string; email?: string; currentPassword?: string; newPassword?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'email est déjà utilisé par quelqu'un d'autre
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new BadRequestException('Cet email est déjà utilisé par un autre utilisateur');
      }
    }

    // Préparer les données de mise à jour
    const updatePayload: any = {};

    // Si on veut changer le mot de passe, vérifier l'ancien
    if (updateData.newPassword) {
      if (!updateData.currentPassword) {
        throw new BadRequestException('Le mot de passe actuel est requis pour changer le mot de passe');
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await bcrypt.compare(updateData.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Le mot de passe actuel est incorrect');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(updateData.newPassword, 10);
      updatePayload.password = hashedPassword;
    }

    // Ajouter les autres champs de mise à jour
    if (updateData.nom !== undefined) updatePayload.nom = updateData.nom;
    if (updateData.prenom !== undefined) updatePayload.prenom = updateData.prenom;
    if (updateData.email !== undefined) updatePayload.email = updateData.email;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
