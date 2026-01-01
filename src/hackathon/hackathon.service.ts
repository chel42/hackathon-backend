import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HackathonStatus } from '@prisma/client';

@Injectable()
export class HackathonService {
  constructor(private prisma: PrismaService) {}

  async getPublicHackathon() {
    const hackathon = await this.prisma.hackathon.findFirst({
      where: {
        status: {
          in: [HackathonStatus.UPCOMING, HackathonStatus.ONGOING],
        },
      },
      orderBy: {
        dateDebut: 'asc',
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Aucun hackathon à venir trouvé');
    }

    const maintenant = new Date();
    const dateLimite = new Date(hackathon.dateLimiteInscription);
    const compteARebours = dateLimite > maintenant 
      ? Math.max(0, Math.floor((dateLimite.getTime() - maintenant.getTime()) / 1000))
      : 0;

    return {
      id: hackathon.id,
      nom: hackathon.nom,
      description: hackathon.description,
      dateDebut: hackathon.dateDebut,
      dateFin: hackathon.dateFin,
      dateLimiteInscription: hackathon.dateLimiteInscription,
      status: hackathon.status,
      compteARebours: compteARebours, // en secondes
    };
  }

  async getPastHackathons(page: number = 1, limit: number = 10, year?: number) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: HackathonStatus.PAST,
    };

    if (year) {
      where.dateDebut = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    const [hackathons, total] = await Promise.all([
      this.prisma.hackathon.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          dateDebut: 'desc',
        },
        select: {
          id: true,
          nom: true,
          description: true,
          dateDebut: true,
          dateFin: true,
          status: true,
          _count: {
            select: {
              inscriptions: true,
            },
          },
        },
      }),
      this.prisma.hackathon.count({ where }),
    ]);

    return {
      data: hackathons.map((h) => ({
        id: h.id,
        nom: h.nom,
        description: h.description,
        dateDebut: h.dateDebut,
        dateFin: h.dateFin,
        status: h.status,
        nombreInscriptions: h._count.inscriptions,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon avec l'ID ${id} non trouvé`);
    }

    return hackathon;
  }

  async getHackathonById(id: string) {
    return this.findById(id);
  }

  async createHackathon(createDto: any) {
    return this.prisma.hackathon.create({
      data: {
        nom: createDto.nom,
        description: createDto.description,
        dateDebut: createDto.dateDebut,
        dateFin: createDto.dateFin,
        dateLimiteInscription: createDto.dateLimiteInscription,
        status: createDto.status || HackathonStatus.UPCOMING,
      },
    });
  }

  async updateHackathon(id: string, updateDto: any) {
    await this.findById(id); // Vérifier que le hackathon existe

    return this.prisma.hackathon.update({
      where: { id },
      data: {
        ...(updateDto.nom && { nom: updateDto.nom }),
        ...(updateDto.description && { description: updateDto.description }),
        ...(updateDto.dateDebut && { dateDebut: updateDto.dateDebut }),
        ...(updateDto.dateFin && { dateFin: updateDto.dateFin }),
        ...(updateDto.dateLimiteInscription && { dateLimiteInscription: updateDto.dateLimiteInscription }),
        ...(updateDto.status && { status: updateDto.status }),
      },
    });
  }

  async deleteHackathon(id: string) {
    await this.findById(id); // Vérifier que le hackathon existe

    await this.prisma.hackathon.delete({
      where: { id },
    });

    return { message: 'Hackathon supprimé avec succès' };
  }
}

