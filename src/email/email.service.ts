import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
      return info;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  }

  async sendAccusReception(email: string, nom: string, prenom: string) {
    const html = `
      <h2>Confirmation d'inscription</h2>
      <p>Bonjour ${prenom} ${nom},</p>
      <p>Votre inscription a bien été enregistrée. Nous vous remercions de votre participation.</p>
      <p>Cordialement,<br>L'équipe Hackathon</p>
    `;
    return this.sendEmail(email, 'Confirmation d\'inscription', html);
  }

  async sendAnnonceInscrits(
    email: string,
    nom: string,
    prenom: string,
    titre: string,
    contenu: string,
  ) {
    const html = `
      <h2>${titre}</h2>
      <p>Bonjour ${prenom} ${nom},</p>
      <div>${contenu}</div>
      <p>Cordialement,<br>L'équipe Hackathon</p>
    `;
    return this.sendEmail(email, titre, html);
  }
}

