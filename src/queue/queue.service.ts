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
    this.logger.log(`📧 Envoi email direct (${type}) à ${data.email}`);
    const result = await this.sendDirectEmail(type, data);
    if (result) {
      this.logger.log(`✅ Email envoyé avec succès (${type}) à ${data.email}`);
    } else {
      this.logger.error(`❌ Échec envoi email (${type}) à ${data.email}`);
    }
    return result;
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
            data.promo,
            data.technologies,
            data.hackathon,
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
      this.logger.error(
        `Erreur lors de l'envoi de l'email (${type}): ${error?.message || String(error)}`,
      );
      return null;
    }
  }
}
