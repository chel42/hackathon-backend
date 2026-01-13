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
      console.error("Erreur lors de l'envoi de l'email:", error);
      throw error;
    }
  }

  async sendAccusReception(email: string, nom: string, prenom: string, promo?: string, technologies?: string[], hackathon?: any) {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatDateSimple = (date: string) => {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header avec logo/branding -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🎯 ${hackathon?.nom || 'HACKATHON CFI-CIRAS'}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 300;">Innovation • Créativité • Excellence</p>
        </div>

        <!-- Contenu principal -->
        <div style="padding: 40px 30px; background-color: #ffffff;">

          <!-- Message de bienvenue personnalisé -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 24px;">Salut ${prenom} ! 👋</h2>
            <p style="color: #718096; margin: 0; font-size: 16px;">Bienvenue dans l'aventure du Hackathon !</p>
          </div>

          <!-- Confirmation stylée -->
          <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; box-shadow: 0 4px 6px rgba(72, 187, 120, 0.2);">
            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
            <h3 style="color: white; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">INSCRIPTION CONFIRMÉE !</h3>
            <p style="color: rgba(255,255,255,0.95); margin: 0; font-size: 15px; line-height: 1.4;">
              Ta participation au <strong>${hackathon?.nom || 'Hackathon CFI-CIRAS'}</strong> est maintenant officielle ! 🎉
            </p>
          </div>

          <!-- Informations détaillées du hackathon -->
          ${hackathon ? `
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center;">
              <span style="background-color: #4299e1; color: white; border-radius: 50%; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🏆</span>
              Détails de l'événement
            </h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4299e1;">
                <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">📅 DÉBUT</div>
                <div style="font-weight: 600; color: #2d3748; font-size: 16px;">${formatDate(hackathon.dateDebut)}</div>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #48bb78;">
                <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">🏁 FIN</div>
                <div style="font-weight: 600; color: #2d3748; font-size: 16px;">${formatDate(hackathon.dateFin)}</div>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ed8936;">
                <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">📍 LIEU</div>
                <div style="font-weight: 600; color: #2d3748; font-size: 16px;">${hackathon.lieu || 'À confirmer'}</div>
              </div>

              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #9f7aea;">
                <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">👥 PARTICIPANTS</div>
                <div style="font-weight: 600; color: #2d3748; font-size: 16px;">${hackathon.currentRegistrations || 0} / ${hackathon.registrationGoal || '∞'}</div>
              </div>
            </div>

            ${hackathon.description ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div style="font-size: 14px; color: #718096; margin-bottom: 8px; font-weight: 500;">📋 À PROPOS</div>
              <div style="color: #2d3748; line-height: 1.6;">${hackathon.description}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Informations personnelles -->
          <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; display: flex; align-items: center;">
              <span style="background-color: #48bb78; color: white; border-radius: 50%; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">👤</span>
              Tes informations
            </h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; color: #718096; margin-bottom: 4px;">NOM</div>
                <div style="font-weight: 600; color: #2d3748;">${nom}</div>
              </div>

              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; color: #718096; margin-bottom: 4px;">PRÉNOM</div>
                <div style="font-weight: 600; color: #2d3748;">${prenom}</div>
              </div>

              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; color: #718096; margin-bottom: 4px;">EMAIL</div>
                <div style="font-weight: 600; color: #2d3748; word-break: break-all;">${email}</div>
              </div>

              ${promo ? `
              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="font-size: 12px; color: #718096; margin-bottom: 4px;">CLASSE</div>
                <div style="font-weight: 600; color: #2d3748;">${promo}</div>
              </div>
              ` : ''}
            </div>

            ${technologies && technologies.length > 0 ? `
            <div style="margin-top: 20px;">
              <div style="font-size: 14px; color: #718096; margin-bottom: 10px; font-weight: 500;">💻 Technologies que tu maîtrises :</div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${technologies.map(tech => `<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${tech}</span>`).join('')}
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Prochaines étapes -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
              <span style="background-color: #f59e0b; color: white; border-radius: 50%; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 16px;">🚀</span>
              Que faire maintenant ?
            </h3>

            <div style="space-y: 12px;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background-color: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; margin-top: 2px;">1</span>
                <div>
                  <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">Constitue ton équipe</div>
                  <div style="color: #92400e; font-size: 14px;">Maximum 4 personnes. Utilise la plateforme pour trouver des coéquipiers !</div>
                </div>
              </div>

              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background-color: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; margin-top: 2px;">2</span>
                <div>
                  <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">Prépare tes idées</div>
                  <div style="color: #92400e; font-size: 14px;">Brainstorme et développe ton concept innovant !</div>
                </div>
              </div>

              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="background-color: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; margin-top: 2px;">3</span>
                <div>
                  <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">Suis les annonces</div>
                  <div style="color: #92400e; font-size: 14px;">Consulte régulièrement tes emails et la plateforme !</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Rappel deadline -->
          ${hackathon?.dateLimiteInscription ? `
          <div style="background-color: #fed7d7; border: 1px solid #fc8181; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <div style="display: flex; align-items: center;">
              <span style="color: #c53030; font-size: 20px; margin-right: 10px;">⏰</span>
              <div style="color: #c53030; font-size: 14px;">
                <strong>Rappel :</strong> L'inscription était ouverte jusqu'au ${formatDateSimple(hackathon.dateLimiteInscription)}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- CTA final -->
          <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 18px 35px; border-radius: 30px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              🎯 PRÊT À INNOVER ?
            </div>
            <p style="color: #718096; margin: 15px 0 0 0; font-size: 14px;">
              Connecte-toi à la plateforme pour commencer l'aventure !
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; margin-top: 40px; padding-top: 25px; text-align: center;">
            <p style="color: #718096; margin: 0 0 8px 0; font-size: 14px;">
              Questions ? Contacte-nous via la plateforme !
            </p>
            <p style="color: #a0aec0; margin: 0; font-size: 12px;">
              Cordialement,<br>
              <strong>L'équipe du ${hackathon?.nom || 'Hackathon CFI-CIRAS'}</strong>
            </p>
            <p style="color: #cbd5e0; margin: 8px 0 0 0; font-size: 11px;">
              Email envoyé automatiquement • ${new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    `;
    return this.sendEmail(email, `🎯 Bienvenue au ${hackathon?.nom || 'Hackathon CFI-CIRAS'} !`, html);
  }

  async sendAnnonceInscrits(
    email: string,
    nom: string,
    prenom: string,
    titre: string,
    contenu: string,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">📢 Hackathon CFI-CIRAS</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Annonce importante</p>
          </div>

          <h2 style="color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            ${titre}
          </h2>

          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Bonjour <strong>${prenom} ${nom}</strong>,
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; line-height: 1.6;">
            <div style="color: #1e293b;">
              ${contenu}
            </div>
          </div>

          <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">💡 Information importante</h4>
            <p style="color: #065f46; margin: 0; line-height: 1.5;">
              Cette annonce concerne votre participation au Hackathon CFI-CIRAS. Nous vous recommandons de la lire attentivement.
            </p>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h4 style="color: #1f2937; margin: 0 0 10px 0;">Vos coordonnées :</h4>
            <p style="margin: 5px 0; color: #374151;"><strong>Nom :</strong> ${nom}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Prénom :</strong> ${prenom}</p>
            <p style="margin: 5px 0; color: #374151;"><strong>Email :</strong> ${email}</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Restez connecté pour les dernières actualités du Hackathon CFI-CIRAS
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Cordialement,<br>
              <strong>L'équipe d'organisation du Hackathon CFI-CIRAS</strong>
            </p>
            <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
              Cet email a été envoyé automatiquement. Pour toute question, contactez-nous.
            </p>
          </div>
        </div>
      </div>
    `;
    return this.sendEmail(email, `Hackathon CFI-CIRAS - ${titre}`, html);
  }
}
