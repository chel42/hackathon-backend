import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateAnnonceDto } from './dto/create-annonce.dto';
import { AnnonceCible } from '@prisma/client';

@Injectable()
export class AnnonceService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async create(createAnnonceDto: CreateAnnonceDto) {
    // Vérifier que le hackathon existe si hackathonId est fourni
    if (createAnnonceDto.hackathonId) {
      const hackathon = await this.prisma.hackathon.findUnique({
        where: { id: createAnnonceDto.hackathonId },
      });

      if (!hackathon) {
        throw new NotFoundException(
          `Hackathon avec l'ID ${createAnnonceDto.hackathonId} non trouvé`,
        );
      }
    }

    // Créer l'annonce
    const annonce = await this.prisma.annonce.create({
      data: {
        titre: createAnnonceDto.titre,
        contenu: createAnnonceDto.contenu,
        cible: createAnnonceDto.cible,
        hackathonId: createAnnonceDto.hackathonId,
      },
    });

    // Si la cible est INSCRITS, envoyer les emails en batch
    if (createAnnonceDto.cible === AnnonceCible.INSCRITS) {
      await this.sendBatchEmails(annonce);
    }

    return annonce;
  }

  async getPublicAnnonces() {
    const annonces = await this.prisma.annonce.findMany({
      where: {
        cible: AnnonceCible.PUBLIC,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        hackathon: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    return annonces;
  }

  private async sendBatchEmails(annonce: any) {
    // Récupérer tous les utilisateurs inscrits
    let inscriptions;
    
    if (annonce.hackathonId) {
      // Si l'annonce est liée à un hackathon spécifique, envoyer uniquement aux inscrits de ce hackathon
      inscriptions = await this.prisma.inscription.findMany({
        where: {
          hackathonId: annonce.hackathonId,
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
        },
      });
    } else {
      // Si pas de hackathon spécifique, envoyer à tous les inscrits de tous les hackathons
      inscriptions = await this.prisma.inscription.findMany({
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
      });
    }

    // Envoyer un job d'email pour chaque utilisateur inscrit
    const emailPromises = inscriptions.map((inscription) =>
      this.queueService.addEmailJob('annonce_inscrits', {
        email: inscription.user.email,
        nom: inscription.user.nom,
        prenom: inscription.user.prenom,
        titre: annonce.titre,
        contenu: annonce.contenu,
      }),
    );

    await Promise.all(emailPromises);
  }

  async getAnnoncesInscrits(userId: string) {
    // Récupérer les hackathons auxquels l'utilisateur est inscrit
    const inscriptions = await this.prisma.inscription.findMany({
      where: { userId },
      select: { hackathonId: true },
    });

    const hackathonIds = inscriptions.map((i) => i.hackathonId);

    // Récupérer les annonces pour ces hackathons ou annonces générales pour inscrits
    const annonces = await this.prisma.annonce.findMany({
      where: {
        cible: AnnonceCible.INSCRITS,
        OR: [
          { hackathonId: { in: hackathonIds } },
          { hackathonId: null }, // Annonces générales pour tous les inscrits
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        hackathon: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    return annonces;
  }

  async getAnnonceById(id: string) {
    const annonce = await this.prisma.annonce.findUnique({
      where: { id },
      include: {
        hackathon: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (!annonce) {
      throw new NotFoundException(`Annonce avec l'ID ${id} non trouvée`);
    }

    return annonce;
  }

  async updateAnnonce(id: string, updateDto: any) {
    await this.getAnnonceById(id); // Vérifier que l'annonce existe

    // Vérifier le hackathon si fourni
    if (updateDto.hackathonId) {
      const hackathon = await this.prisma.hackathon.findUnique({
        where: { id: updateDto.hackathonId },
      });

      if (!hackathon) {
        throw new NotFoundException(`Hackathon avec l'ID ${updateDto.hackathonId} non trouvé`);
      }
    }

    return this.prisma.annonce.update({
      where: { id },
      data: {
        ...(updateDto.titre && { titre: updateDto.titre }),
        ...(updateDto.contenu && { contenu: updateDto.contenu }),
        ...(updateDto.cible && { cible: updateDto.cible }),
        ...(updateDto.hackathonId !== undefined && { hackathonId: updateDto.hackathonId }),
      },
      include: {
        hackathon: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  async deleteAnnonce(id: string) {
    await this.getAnnonceById(id); // Vérifier que l'annonce existe

    await this.prisma.annonce.delete({
      where: { id },
    });

    return { message: 'Annonce supprimée avec succès' };
  }
}

