import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HackathonStatus, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { PdfGenerationService } from './pdf-generation.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ResultatsService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfExtractionService: PdfExtractionService,
    private readonly pdfGenerationService: PdfGenerationService,
    private readonly emailService: EmailService,
  ) {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async getResultats(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(
        `Hackathon avec l'ID ${hackathonId} non trouvé`,
      );

    const resultat = await this.prisma.resultats.findUnique({
      where: { hackathonId },
    });
    if (!resultat) {
      return {
        hackathonId,
        premierPlace: null,
        deuxiemePlace: null,
        troisiemePlace: null,
        preselectionnes: [],
        podiumPublie: false,
        preselectionsPubliees: false,
        documentPreselectionsName: null,
        documentPreselectionsUploadedAt: null,
      };
    }

    const preselectionnesArray = Array.isArray(resultat.preselectionnes)
      ? (resultat.preselectionnes as string[])
      : [];

    return {
      id: resultat.id,
      hackathonId: resultat.hackathonId,
      premierPlace: resultat.premierPlace,
      deuxiemePlace: resultat.deuxiemePlace,
      troisiemePlace: resultat.troisiemePlace,
      preselectionnes: preselectionnesArray,
      podiumPublie: resultat.podiumPublie,
      preselectionsPubliees: resultat.preselectionsPubliees,
      documentPreselectionsName: resultat.documentPreselectionsName,
      documentPreselectionsUploadedAt: resultat.documentPreselectionsUploadedAt,
      createdAt: resultat.createdAt,
      updatedAt: resultat.updatedAt,
    };
  }

  async publishPodium(
    hackathonId: string,
    data: {
      premierPlace?: string;
      deuxiemePlace?: string;
      troisiemePlace?: string;
    },
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(
        `Hackathon avec l'ID ${hackathonId} non trouvé`,
      );

    const hasAtLeastOneWinner = !!(
      data.premierPlace ||
      data.deuxiemePlace ||
      data.troisiemePlace
    );
    if (!hasAtLeastOneWinner) {
      throw new BadRequestException(
        'Au moins un gagnant doit être sélectionné pour publier le podium',
      );
    }

    const resultat = await this.prisma.resultats.upsert({
      where: { hackathonId },
      update: {
        premierPlace: data.premierPlace || null,
        deuxiemePlace: data.deuxiemePlace || null,
        troisiemePlace: data.troisiemePlace || null,
        podiumPublie: true,
      },
      create: {
        hackathonId,
        premierPlace: data.premierPlace || null,
        deuxiemePlace: data.deuxiemePlace || null,
        troisiemePlace: data.troisiemePlace || null,
        podiumPublie: true,
        preselectionsPubliees: false,
      },
    });

    return {
      id: resultat.id,
      hackathonId: resultat.hackathonId,
      premierPlace: resultat.premierPlace,
      deuxiemePlace: resultat.deuxiemePlace,
      troisiemePlace: resultat.troisiemePlace,
      podiumPublie: resultat.podiumPublie,
    };
  }

  async publishPreselections(hackathonId: string, preselectionnes: string[]) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(
        `Hackathon avec l'ID ${hackathonId} non trouvé`,
      );

    const preselectionnesJson = Array.isArray(preselectionnes)
      ? preselectionnes
      : [];

    const resultat = await this.prisma.resultats.upsert({
      where: { hackathonId },
      update: {
        preselectionnes: preselectionnesJson as any,
        preselectionsPubliees: true,
      },
      create: {
        hackathonId,
        preselectionnes: preselectionnesJson as any,
        preselectionsPubliees: true,
        podiumPublie: false,
      },
    });

    const preselectionnesArray = Array.isArray(resultat.preselectionnes)
      ? (resultat.preselectionnes as string[])
      : [];

    // Envoyer un email aux présélectionnés (si SMTP est configuré)
    try {
      if (preselectionnesArray.length > 0) {
        const users = await this.prisma.user.findMany({
          where: { email: { in: preselectionnesArray } },
          select: { email: true, nom: true, prenom: true },
        });
        for (const user of users) {
          const html = `
            <h2>Félicitations, vous êtes présélectionné(e) ! 🎉</h2>
            <p>Bonjour <strong>${user.prenom} ${user.nom}</strong>,</p>
            <p>
              Nous avons le plaisir de vous informer que vous êtes présélectionné(e) pour la prochaine phase du Hackathon CFI-CIRAS.
              Votre candidature s’est distinguée et nous vous invitons à poursuivre l’aventure.
            </p>
            <p>
              <strong>Prochaine étape :</strong><br/>
              - Confirmez votre disponibilité pour les dates prévues.<br/>
              - Préparez vos supports (pitch, prototype, démo) si nécessaire.<br/>
              - Surveillez vos emails : nous enverrons bientôt le planning détaillé et les accès.
            </p>
            <p>
              <strong>Rappel de vos informations :</strong><br/>
              - Nom : ${user.prenom} ${user.nom}<br/>
              - Email : ${user.email}<br/>
            </p>
            <p>
              Si vous ne pouvez pas participer ou si vos informations sont inexactes, merci de nous le signaler en répondant à ce mail.
            </p>
            <p>
              Cordialement,<br/>
              L’équipe d’organisation du Hackathon CFI-CIRAS<br/>
              (noreply)
            </p>
          `;

          await this.emailService.sendEmail(
            user.email,
            'Félicitations, vous êtes présélectionné(e) !',
            html,
          );
        }
      }
    } catch (error) {
      // On log mais on ne bloque pas la publication
      console.error('Erreur envoi emails présélectionnés:', error);
    }

    return {
      id: resultat.id,
      hackathonId: resultat.hackathonId,
      preselectionnes: preselectionnesArray,
      preselectionsPubliees: resultat.preselectionsPubliees,
    };
  }

  async unpublishPodium(hackathonId: string) {
    const resultat = await this.prisma.resultats.findUnique({
      where: { hackathonId },
    });
    if (!resultat)
      throw new NotFoundException(
        `Aucun résultat trouvé pour le hackathon ${hackathonId}`,
      );
    return this.prisma.resultats.update({
      where: { hackathonId },
      data: { podiumPublie: false },
    });
  }

  async unpublishPreselections(hackathonId: string) {
    const resultat = await this.prisma.resultats.findUnique({
      where: { hackathonId },
    });
    if (!resultat)
      throw new NotFoundException(
        `Aucun résultat trouvé pour le hackathon ${hackathonId}`,
      );
    return this.prisma.resultats.update({
      where: { hackathonId },
      data: { preselectionsPubliees: false },
    });
  }

  async getPublicResultats() {
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

    if (!hackathon) {
      return {
        hackathonId: null,
        podiumPublie: false,
        preselectionsPubliees: false,
        premierPlace: null,
        deuxiemePlace: null,
        troisiemePlace: null,
        preselectionnes: [],
        documentPreselectionsName: null,
        hasPreselectionsDocument: false,
      };
    }

    const resultats = await this.getResultats(hackathon.id);
    const preselectionnesArray = Array.isArray(resultats.preselectionnes)
      ? resultats.preselectionnes
      : [];

    return {
      ...resultats,
      hackathonId: hackathon.id,
      preselectionnes: preselectionnesArray,
      documentPreselectionsName: resultats.documentPreselectionsName || null,
      hasPreselectionsDocument: !!resultats.documentPreselectionsName,
    };
  }

  async uploadPreselectionsDocument(
    hackathonId: string,
    file: Express.Multer.File,
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon)
      throw new NotFoundException(
        `Hackathon avec l'ID ${hackathonId} non trouvé`,
      );

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Le fichier doit être un PDF');
    }

    try {
      const ext = path.extname(file.originalname) || '.pdf';
      const fileName = `preselections-${hackathonId}-${Date.now()}${ext}`;
      const filePath = path.join(this.uploadsDir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      console.log(`📄 Extraction des participants depuis le PDF...`);
      const extractedParticipants =
        await this.pdfExtractionService.extractParticipantsFromPdf(file.buffer);
      console.log(`📊 ${extractedParticipants.length} participants extraits du PDF`);

      // Matcher le PDF sur tous les participants du hackathon (pas uniquement VALIDE),
      // sinon on rate les EN_ATTENTE, etc.
      console.log(`👥 Récupération des inscrits au hackathon ${hackathonId}...`);
      const inscriptions = await this.prisma.inscription.findMany({
        where: {
          hackathonId,
          user: { role: { not: Role.ADMIN } }, // exclure les admins
        },
        include: { user: true },
      });
      console.log(`📋 ${inscriptions.length} inscriptions trouvées`);

      const users = inscriptions.map((ins) => ({
        id: ins.user.id,
        email: ins.user.email,
        nom: ins.user.nom,
        prenom: ins.user.prenom,
      }));
      console.log(`👤 ${users.length} utilisateurs inscrits (admins exclus)`);

      console.log(`🔗 Début du matching...`);
      const matchedEmails =
        this.pdfExtractionService.matchParticipantsWithUsers(
          extractedParticipants,
          users,
        );
      console.log(`✅ ${matchedEmails.length} correspondances trouvées`);

      const extractedEmails = extractedParticipants
        .map((p) => (p.email || '').trim())
        .filter(Boolean);
      const unmatchedEmails = extractedEmails.filter(
        (e) => !matchedEmails.some((m) => m.toLowerCase() === e.toLowerCase()),
      );

      const resultat = await this.prisma.resultats.upsert({
        where: { hackathonId },
        update: {
          documentPreselectionsName: file.originalname,
          documentPreselectionsUploadedAt: new Date(),
          preselectionnes: matchedEmails as any,
        },
        create: {
          hackathonId,
          documentPreselectionsName: file.originalname,
          documentPreselectionsUploadedAt: new Date(),
          preselectionnes: matchedEmails as any,
          podiumPublie: false,
          preselectionsPubliees: false,
        },
      });

      return {
        id: resultat.id,
        hackathonId: resultat.hackathonId,
        documentName: file.originalname,
        extractedCount: extractedParticipants.length,
        matchedCount: matchedEmails.length,
        preselectionnes: matchedEmails,
        // Aide au debug côté admin si "0 match"
        extractedEmails: extractedEmails.slice(0, 200),
        unmatchedEmails: unmatchedEmails.slice(0, 200),
      };
    } catch (error) {
      // Renvoyer une erreur claire au frontend
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Erreur lors du traitement du PDF',
      );
    }
  }

  async getPreselectionsDocument(hackathonId: string) {
    const resultat = await this.prisma.resultats.findUnique({
      where: { hackathonId },
    });
    if (!resultat?.documentPreselectionsName)
      throw new NotFoundException('Document PDF non trouvé pour ce hackathon');

    if (!fs.existsSync(resultat.documentPreselectionsName)) {
      throw new NotFoundException(
        "Le fichier PDF n'existe plus sur le serveur",
      );
    }

    return {
      path: resultat.documentPreselectionsName,
      name: resultat.documentPreselectionsName || 'document.pdf',
      buffer: fs.readFileSync(resultat.documentPreselectionsName),
    };
  }

  async deletePreselectionsDocument(hackathonId: string) {
    const resultat = await this.prisma.resultats.findUnique({
      where: { hackathonId },
    });
    if (!resultat?.documentPreselectionsName)
      throw new NotFoundException('Document PDF non trouvé pour ce hackathon');

    if (fs.existsSync(resultat.documentPreselectionsName)) {
      fs.unlinkSync(resultat.documentPreselectionsName);
    }

    return this.prisma.resultats.update({
      where: { hackathonId },
      data: {
        documentPreselectionsName: null,
        documentPreselectionsUploadedAt: null,
      },
    });
  }

  async generateInscriptionsListPdf(): Promise<Buffer> {
    // Un seul hackathon actif, mais on génère la liste globale des inscrits (hors admin) avec statut VALIDE
    const hackathon = await this.prisma.hackathon.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const inscriptions = await this.prisma.inscription.findMany({
      where: {
        statut: 'VALIDE',
        user: { role: { not: Role.ADMIN } }, // exclure les comptes admin
      },
      include: {
        user: { select: { id: true, email: true, nom: true, prenom: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = inscriptions.map((ins) => ({
      id: ins.id,
      nom: ins.user.nom,
      prenom: ins.user.prenom,
      email: ins.user.email,
      promo: ins.promo || null,
      // La "classe" doit refléter la donnée DB.
      // technologies peut être:
      // - un objet { classe: "LRT A" }
      // - un tableau ["LIC1 B"]
      // - autre (null/undefined)
      classe: (() => {
        const tech = (ins as any).technologies;
        if (!tech) return null;
        if (Array.isArray(tech)) {
          const first = tech.find((t: any) => typeof t === 'string' && t.trim().length > 0);
          return first || null;
        }
        if (typeof tech === 'object' && typeof tech.classe === 'string' && tech.classe.trim().length > 0) {
          return tech.classe;
        }
        return null;
      })(),
      statut: ins.statut,
      createdAt: ins.createdAt,
    }));

    return this.pdfGenerationService.generateInscriptionsListPdf(
      formatted,
      hackathon?.nom || 'Hackathon',
    );
  }
}
