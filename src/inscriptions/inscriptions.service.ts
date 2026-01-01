import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HackathonStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class InscriptionsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async getMyInscriptions(userId: string) {
    return this.prisma.inscription.findMany({
      where: { userId },
      include: {
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

  async getInscriptionById(id: string, userId: string, userRole: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
          },
        },
        hackathon: true,
      },
    });

    if (!inscription) {
      throw new NotFoundException(`Inscription avec l'ID ${id} non trouvée`);
    }

    // Vérifier les permissions : l'utilisateur peut voir sa propre inscription ou l'admin peut voir toutes
    if (userRole !== 'ADMIN' && inscription.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette inscription');
    }

    return inscription;
  }

  async createInscription(userId: string, hackathonId: string) {
    // Vérifier que le hackathon existe
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon avec l'ID ${hackathonId} non trouvé`);
    }

    // Vérifier la deadline d'inscription
    const maintenant = new Date();
    if (new Date(hackathon.dateLimiteInscription) < maintenant) {
      throw new BadRequestException('La date limite d\'inscription est dépassée');
    }

    // Vérifier que le hackathon est encore ouvert aux inscriptions
    if (hackathon.status === HackathonStatus.PAST) {
      throw new BadRequestException('Ce hackathon est déjà terminé');
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingInscription = await this.prisma.inscription.findUnique({
      where: {
        userId_hackathonId: {
          userId,
          hackathonId,
        },
      },
    });

    if (existingInscription) {
      throw new BadRequestException('Vous êtes déjà inscrit à ce hackathon');
    }

    // Créer l'inscription
    const inscription = await this.prisma.inscription.create({
      data: {
        userId,
        hackathonId,
      },
      include: {
        hackathon: {
          select: {
            id: true,
            nom: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Émettre l'événement temps réel
    this.eventsGateway.emitNewInscription({
      userId: inscription.userId,
      hackathonId: inscription.hackathonId,
      inscriptionId: inscription.id,
      userEmail: inscription.user.email,
      userName: `${inscription.user.prenom} ${inscription.user.nom}`,
    });

    return inscription;
  }

  async deleteInscription(id: string, userId: string, userRole: string) {
    const inscription = await this.prisma.inscription.findUnique({
      where: { id },
    });

    if (!inscription) {
      throw new NotFoundException(`Inscription avec l'ID ${id} non trouvée`);
    }

    // Vérifier les permissions
    if (userRole !== 'ADMIN' && inscription.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas le droit de supprimer cette inscription');
    }

    await this.prisma.inscription.delete({
      where: { id },
    });

    return { message: 'Inscription supprimée avec succès' };
  }

  async getInscriptionsByHackathon(hackathonId: string) {
    // Vérifier que le hackathon existe
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon avec l'ID ${hackathonId} non trouvé`);
    }

    return this.prisma.inscription.findMany({
      where: { hackathonId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            // promo et technologies sont maintenant dans Inscription, pas dans User
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

