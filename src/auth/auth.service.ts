import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { QueueService } from '../queue/queue.service';
import { HackathonStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private queueService: QueueService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Vérifier que le hackathon existe
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: registerDto.hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException(
        `Hackathon avec l'ID ${registerDto.hackathonId} non trouvé`,
      );
    }

    // Vérifier la deadline d'inscription
    const maintenant = new Date();
    if (new Date(hackathon.dateLimiteInscription) < maintenant) {
      throw new BadRequestException(
        "La date limite d'inscription est dépassée",
      );
    }

    // Vérifier que le hackathon est encore ouvert aux inscriptions
    if (hackathon.status === HackathonStatus.PAST) {
      throw new BadRequestException('Ce hackathon est déjà terminé');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    let user;
    if (existingUser) {
      // Vérifier si l'utilisateur est déjà inscrit à ce hackathon
      const existingInscription = await this.prisma.inscription.findUnique({
        where: {
          userId_hackathonId: {
            userId: existingUser.id,
            hackathonId: registerDto.hackathonId,
          },
        },
      });

      if (existingInscription) {
        throw new BadRequestException('Vous êtes déjà inscrit à ce hackathon');
      }

      user = existingUser;
    } else {
      // Créer le nouvel utilisateur (sans promo/technologies - elles sont dans Inscription)
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          nom: registerDto.nom,
          prenom: registerDto.prenom,
          role: 'USER',
        },
      });
    }

    // Créer l'inscription avec promo et technologies (selon le document PDF)
    const inscription = await this.prisma.inscription.create({
      data: {
        userId: user.id,
        hackathonId: registerDto.hackathonId,
        promo: registerDto.promo as any, // Peut être L1, L2 ou null
        technologies: registerDto.technologies
          ? registerDto.technologies
          : undefined, // JSONB
        statut: 'VALIDE', // Statut VALIDE par défaut - inscription automatiquement acceptée
      },
    });

    // Envoyer l'email d'accusé de réception via BullMQ avec toutes les informations
    await this.queueService.addEmailJob('accus_reception', {
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      promo: registerDto.promo,
      technologies: registerDto.technologies,
      hackathon: {
        id: hackathon.id,
        nom: hackathon.nom,
        description: hackathon.description,
        dateDebut: hackathon.dateDebut,
        dateFin: hackathon.dateFin,
        dateLimiteInscription: hackathon.dateLimiteInscription,
        registrationGoal: hackathon.registrationGoal,
        currentRegistrations: hackathon.currentRegistrations,
        status: hackathon.status,
      },
    });

    // Émettre l'événement temps réel de nouvelle inscription
    this.eventsGateway.emitNewInscription({
      userId: user.id,
      hackathonId: registerDto.hackathonId,
      inscriptionId: inscription.id,
      userEmail: user.email,
      userName: `${user.prenom} ${user.nom}`,
    });

    const { password: _, ...userResult } = user;
    return {
      user: userResult,
      inscription: {
        id: inscription.id,
        hackathonId: inscription.hackathonId,
        promo: inscription.promo,
        technologies: inscription.technologies,
        statut: inscription.statut,
        createdAt: inscription.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
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

  async updateProfile(userId: string, updateDto: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateDto.nom && { nom: updateDto.nom }),
        ...(updateDto.prenom && { prenom: updateDto.prenom }),
        // promo et technologies sont maintenant dans Inscription, pas dans User
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

    return updatedUser;
  }

  async changePassword(userId: string, changePasswordDto: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe changé avec succès' };
  }
}
