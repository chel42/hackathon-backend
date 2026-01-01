import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private emailService: EmailService) {
    this.logger.log('✅ QueueService initialisé - Mode SMTP direct');
  }

  async addEmailJob(type: string, data: any) {
    // Envoi direct via SMTP (Redis/BullMQ désactivé)
    this.logger.debug(`Envoi email direct (${type}) via SMTP`);
    return this.sendDirectEmail(type, data);
  }

  private async sendDirectEmail(type: string, data: any) {
    if (!this.emailService) {
      this.logger.error('EmailService non disponible pour envoi direct');
      return null;
    }

    try {
      switch (type) {
        case 'accus_reception':
          return await this.emailService.sendAccusReception(
            data.email,
            data.nom,
            data.prenom,
          );
        case 'annonce_inscrits':
          return await this.emailService.sendAnnonceInscrits(
            data.email,
            data.nom,
            data.prenom,
            data.titre,
            data.contenu,
          );
        default:
          this.logger.warn(`Type d'email non reconnu: ${type}`);
          return null;
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de l'envoi de l'email (${type}): ${error?.message || String(error)}`);
      return null;
    }
  }
}

