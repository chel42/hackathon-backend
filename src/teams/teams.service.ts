import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HackathonStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(
    hackathonId: string,
    data: { nom: string; description?: string; projetNom?: string },
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(`Hackathon ${hackathonId} introuvable`);

    return this.prisma.team.create({
      data: {
        nom: data.nom,
        description: data.description,
        projetNom: data.projetNom,
        hackathonId,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, nom: true, prenom: true },
            },
          },
        },
      },
    });
  }

  async getPublicTeamsByHackathon(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(`Hackathon ${hackathonId} introuvable`);

    return this.prisma.team.findMany({
      where: { hackathonId },
      select: {
        id: true,
        nom: true,
        description: true,
        projetNom: true,
        createdAt: true,
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamsByHackathon(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(`Hackathon ${hackathonId} introuvable`);

    return this.prisma.team.findMany({
      where: { hackathonId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, nom: true, prenom: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamById(teamId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, nom: true, prenom: true },
            },
          },
        },
      },
    });
    if (!team) throw new NotFoundException(`Équipe ${teamId} introuvable`);
    return team;
  }

  async updateTeam(
    teamId: string,
    data: { nom?: string; description?: string; projetNom?: string | null },
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException(`Équipe ${teamId} introuvable`);

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(data.nom ? { nom: data.nom } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.projetNom !== undefined ? { projetNom: data.projetNom } : {}),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, nom: true, prenom: true },
            },
          },
        },
      },
    });
  }

  async deleteTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException(`Équipe ${teamId} introuvable`);
    await this.prisma.team.delete({ where: { id: teamId } });
    return { message: 'Équipe supprimée' };
  }

  async addMemberToTeam(teamId: string, userId: string, role?: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException(`Équipe ${teamId} introuvable`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`Utilisateur ${userId} introuvable`);

    const alreadyMember = await this.prisma.teamMember.findFirst({
      where: { userId },
    });
    if (alreadyMember)
      throw new BadRequestException(
        'Utilisateur déjà membre d’une autre équipe',
      );

    return this.prisma.teamMember.create({
      data: { teamId, userId, role },
      include: {
        user: { select: { id: true, email: true, nom: true, prenom: true } },
      },
    });
  }

  async removeMemberFromTeam(teamId: string, userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new NotFoundException('Membre introuvable');

    await this.prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
    return { message: 'Membre retiré' };
  }

  async getPublicTeams() {
    let hackathon = await this.prisma.hackathon.findFirst({
      where: {
        status: { in: [HackathonStatus.UPCOMING, HackathonStatus.ONGOING] },
      },
      orderBy: { dateDebut: 'asc' },
    });
    if (!hackathon) {
      hackathon = await this.prisma.hackathon.findFirst({
        where: { status: HackathonStatus.PAST },
        orderBy: { dateFin: 'desc' },
      });
    }
    if (!hackathon) return [];

    return this.prisma.team.findMany({
      where: { hackathonId: hackathon.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, nom: true, prenom: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
