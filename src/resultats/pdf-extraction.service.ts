import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';

export interface ExtractedParticipant {
  email: string;
  nom?: string;
  prenom?: string;
  fullName?: string;
  promo?: string; // L1, L2...
  classe?: string; // LIC1 A...
  telephone?: string;
}

@Injectable()
export class PdfExtractionService {
  private readonly logger = new Logger(PdfExtractionService.name);

  async extractParticipantsFromPdf(
    pdfBuffer: Buffer,
  ): Promise<ExtractedParticipant[]> {
    console.log(`🚀 DÉBUT extraction PDF - Taille buffer: ${pdfBuffer.length} bytes`);

    try {
      console.log(`📄 Tentative d'extraction avec pdf-parse... Typeof pdfParse:`, typeof pdfParse);
      const data = await pdfParse(pdfBuffer);
      console.log(`✅ Extraction PDF réussie - Pages: ${data?.numpages || 'N/A'}`);
      console.log(`📝 Contenu texte brut du PDF (100 premiers caractères):`, data.text.substring(0, 100));
      return this.processExtractedText(data.text);
    } catch (error: any) {
      console.error(
        '❌ ERREUR extraction PDF:',
        error?.message || error?.toString() || error,
      );
      return [];
    }
  }

  matchParticipantsWithUsers(
    extractedParticipants: ExtractedParticipant[],
    users: Array<{ id: string; email: string; nom: string; prenom: string }>,
  ): string[] {
    console.log(`🎯 MATCHING DÉTAILLÉ:`);
    console.log(`  - ${extractedParticipants.length} participants extraits du PDF`);
    console.log(`  - ${users.length} utilisateurs inscrits au hackathon`);

    console.log(`📧 EMAILS DES UTILISATEURS INSCRITS:`);
    users.forEach((user, i) => console.log(`  ${i+1}. ${user.email} (${user.nom} ${user.prenom})`));

    console.log(`📄 PARTICIPANTS EXTRAITS DU PDF:`);
    extractedParticipants.forEach((part, i) => console.log(`  ${i+1}. ${part.email} (${part.nom || '?'} ${part.prenom || '?'})`));

    const matched: string[] = [];

    for (const participant of extractedParticipants) {
      console.log(`🔍 Tentative de matching pour: ${participant.email} (${participant.nom || '?'} ${participant.prenom || '?'})`);
      const byEmail = users.find(
        (u) => u.email.toLowerCase() === participant.email.toLowerCase(),
      );
      if (byEmail) {
        this.logger.log(`✅ Match par email: ${participant.email} -> ${byEmail.email} (${byEmail.nom} ${byEmail.prenom})`);
        matched.push(byEmail.email);
        continue;
      } else {
        this.logger.log(`❌ Pas de match par email pour: ${participant.email}`);
      }

      if (participant.nom && participant.prenom) {
        const nom = participant.nom.toLowerCase().trim();
        const prenom = participant.prenom.toLowerCase().trim();
        this.logger.log(`🔍 Recherche par nom/prénom: ${prenom} ${nom}`);
        const byName = users.find(
          (u) =>
            u.nom.toLowerCase().trim() === nom &&
            u.prenom.toLowerCase().trim() === prenom,
        );
        if (byName) {
          this.logger.log(`✅ Match par nom/prénom: ${prenom} ${nom} -> ${byName.email} (${byName.nom} ${byName.prenom})`);
          matched.push(byName.email);
          continue;
        } else {
          this.logger.log(`❌ Pas de match par nom/prénom pour: ${prenom} ${nom}`);
        }
      }

      if (participant.fullName) {
        const parts = participant.fullName.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
          const prenom = parts[0].toLowerCase().trim();
          const nom = parts.slice(1).join(' ').toLowerCase().trim();
          this.logger.log(`🔍 Recherche par nom complet: ${participant.fullName} -> ${prenom} ${nom}`);
          const byName = users.find(
            (u) =>
              u.nom.toLowerCase().trim() === nom &&
              u.prenom.toLowerCase().trim() === prenom,
          );
          if (byName) {
            this.logger.log(`✅ Match par nom complet: ${participant.fullName} -> ${byName.email} (${byName.nom} ${byName.prenom})`);
            matched.push(byName.email);
          } else {
            this.logger.log(`❌ Pas de match par nom complet pour: ${participant.fullName}`);
          }
        }
      }

      if (matched.length === 0) {
        this.logger.log(`❌ AUCUN MATCH TROUVÉ pour le participant: ${participant.email}`);
      }
    }

    const uniqueMatched = Array.from(new Set(matched));
    this.logger.log(`🎯 Résultat final: ${uniqueMatched.length} correspondances trouvées sur ${extractedParticipants.length} participants extraits`);
    uniqueMatched.forEach((email, i) => this.logger.log(`  Match ${i+1}: ${email}`));
    return uniqueMatched;
  }

  private processExtractedText(text: string): ExtractedParticipant[] {
    console.log(`=== ANALYSE PDF ===`);
    console.log(`Longueur du texte: ${text.length} caractères`);
    console.log(`Contenu COMPLET du PDF (500 premiers caractères):`);
    console.log(`"${text.substring(0, 500)}"`);
    console.log(`=== FIN CONTENU PDF ===`);

    // Recherche TRÈS large d'emails (y compris avec suffixes étranges)
    const veryPermissiveRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[A-Za-z0-9]*/g;
    const allPossibleEmails = text.match(veryPermissiveRegex) || [];
    console.log(`🔍 TOUS LES MOTIFS QUI RESSEMBLENT À DES EMAILS: ${allPossibleEmails.length}`);
    allPossibleEmails.forEach((email, i) => console.log(`  Motif ${i+1}: "${email}"`));

    // Nettoyer les emails (supprimer les suffixes comme LRT, LIC1, etc.)
    const cleanedEmails = allPossibleEmails.map(email => {
      // Supprimer les suffixes alphanumériques collés
      return email.replace(/[A-Za-z0-9]+$/g, (suffix) => {
        // Garder seulement si c'est une extension valide (.com, .fr, etc.)
        if (suffix.match(/^\.(com|fr|org|net|edu|gov|mil|biz|info)$/i)) {
          return suffix;
        }
        // Sinon supprimer le suffixe
        return '';
      });
    }).filter(email => email.includes('@') && email.split('@')[1].includes('.'));

    console.log(`🧹 APRES NETTOYAGE DES SUFFIXES: ${cleanedEmails.length}`);
    cleanedEmails.forEach((email, i) => console.log(`  Email nettoyé ${i+1}: "${email}"`));

    const emails = cleanedEmails;

    // Analyse spécialisée pour les PDFs de liste d'inscrits (avec tableaux)
    const participants: ExtractedParticipant[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log(`🎯 Extraction spécialisée pour liste d'inscrits (${lines.length} lignes)`);
    console.log(`📋 Aperçu des 20 premières lignes:`, lines.slice(0, 20));

    // Pour les PDFs avec tableaux générés par le système, utiliser une approche spécialisée
    console.log(`🔍 ANALYSE SPÉCIALISÉE POUR PDF TABLEAU GÉNÉRÉ...`);

    // Le PDF généré a maintenant un format avec séparateurs: "N° | Nom | Prénom | Email | Classe | Statut"

    let isInDataSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log(`📋 Ligne ${i+1}: "${line}"`);

      // Détecter le début de la section de données (après les en-têtes)
      if (line.toLowerCase().includes('n°') && line.includes('|')) {
        isInDataSection = true;
        console.log(`🎯 Début de section données détecté (format avec séparateurs)`);
        continue;
      }

      // Traiter seulement les lignes de données (format: "1 | DUPONT | Jean | jean@email.com | L2 | VALIDE")
      if (isInDataSection && /^\d+\s*\|\s*/.test(line)) {
        console.log(`📊 Analyse de la ligne de données: "${line}"`);

        // Séparer par les séparateurs |
        const parts = line.split('|').map(part => part.trim());

        if (parts.length >= 6) { // N°, Nom, Prénom, Email, Classe, Statut
          const numero = parts[0];
          const nom = parts[1] || '';
          const prenom = parts[2] || '';
          const email = parts[3] || '';
          const classe = parts[4] || '';
          const statut = parts[5] || '';

          // Valider l'email
          if (email && email.includes('@') && email.includes('.')) {
            const participant: ExtractedParticipant = {
              email: email,
              nom: nom,
              prenom: prenom,
              classe: classe,
            };

            console.log(`✅ Participant extrait du tableau: ${participant.prenom} ${participant.nom} - ${participant.email} (${participant.classe}) - ${statut}`);
            participants.push(participant);
          } else {
            console.log(`⚠️ Email invalide dans la ligne: "${email}"`);
          }
        } else {
          console.log(`⚠️ Ligne avec format inattendu (${parts.length} parties): ${line}`);
        }
      }
    }

    // Si l'approche tableau n'a rien donné, essayer l'approche simple par email
    if (participants.length === 0) {
      console.log(`🔄 Approche tableau échouée, tentative avec approche par email...`);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Ignorer les lignes d'en-tête
        if (!line || line.toLowerCase().includes('liste des inscrits') ||
            line.toLowerCase().includes('total:') ||
            line.toLowerCase().includes('n°') && line.toLowerCase().includes('nom') ||
            line.length < 3) {
          continue;
        }

        // Chercher les emails dans cette ligne
        const emailsInLine = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        if (emailsInLine && emailsInLine.length > 0) {
          const participant: ExtractedParticipant = {
            email: emailsInLine[0],
          };

          // Essayer d'extraire nom et prénom de la ligne
          const parts = line.split(emailsInLine[0]);
          const namePart = parts[0].trim() || parts[1]?.trim() || '';

          if (namePart) {
            const nameParts = namePart.split(/\s+/).filter(p => p.length > 0);
            if (nameParts.length >= 2) {
              participant.prenom = nameParts[0];
              participant.nom = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
              participant.nom = nameParts[0];
            }
          }

          console.log(`✅ Participant extrait (fallback): ${participant.prenom || '?'} ${participant.nom || '?'} - ${participant.email}`);
          participants.push(participant);
        }
      }
    }

    // Si on n'a rien trouvé avec l'approche simple, essayer l'approche structurée
    if (participants.length === 0) {
      console.log(`⚠️ Aucune donnée trouvée avec l'approche simple, tentative avec l'approche structurée...`);

      // Pattern pour extraire les informations structurées
      let currentParticipant: Partial<ExtractedParticipant> = {};
      let participantCount = 0;
      let pendingNames: string[] = []; // Stocker les noms temporaires

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        // Détecter le début d'un nouveau participant (numéro)
        if (/^\d+$/.test(line) && parseInt(line) > 0) {
          // Sauvegarder le participant précédent s'il existe
          if (currentParticipant.email) {
            participants.push(currentParticipant as ExtractedParticipant);
            participantCount++;
            console.log(`Participant ${participantCount} sauvegardé: ${currentParticipant.nom || 'N/A'} ${currentParticipant.prenom || 'N/A'} - ${currentParticipant.email}`);
          }

          // Nouveau participant
          currentParticipant = {};
          pendingNames = [];
          console.log(`Début participant ${parseInt(line)}`);
          continue;
        }

      // Extraire les informations selon les patterns
      if (lowerLine === 'nom') {
        continue; // Le prochain élément sera le nom
      }
      else if (lowerLine === 'prénom') {
        continue; // Le prochain élément sera le prénom
      }
      else if (lowerLine === 'email') {
        continue; // Le prochain élément sera l'email
      }
      else if (lowerLine === 'classe') {
        continue; // Le prochain élément sera la classe
      }
      else if (lowerLine.includes('@') && lowerLine.includes('.')) {
        // Cette ligne contient un email
        const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          currentParticipant.email = emailMatch[0];
          console.log(`Email trouvé: ${currentParticipant.email}`);

          // Essayer d'extraire nom et prénom des noms en attente
          if (pendingNames.length >= 2) {
            // Prendre les 2 derniers noms comme prénom + nom
            const recentNames = pendingNames.slice(-2);
            currentParticipant.prenom = recentNames[0];
            currentParticipant.nom = recentNames[1];
            console.log(`Nom/prénom extrait du contexte: ${currentParticipant.prenom} ${currentParticipant.nom}`);
          } else if (pendingNames.length === 1) {
            // Chercher dans la ligne de l'email elle-même
            const nameParts = line.replace(emailMatch[0], '').trim().split(/\s+/).filter(n => n.length > 0);
            if (nameParts.length >= 2) {
              currentParticipant.prenom = nameParts[0];
              currentParticipant.nom = nameParts.slice(1).join(' ');
              console.log(`Nom/prénom extrait de la ligne email: ${currentParticipant.prenom} ${currentParticipant.nom}`);
            } else if (nameParts.length === 1) {
              currentParticipant.prenom = nameParts[0];
              console.log(`Prénom extrait de la ligne email: ${currentParticipant.prenom}`);
            } else {
              currentParticipant.nom = pendingNames[0];
              console.log(`Nom extrait du contexte: ${currentParticipant.nom}`);
            }
          }
        }
      }
      else if (lowerLine.startsWith('lic') || lowerLine.startsWith('l1') || lowerLine.startsWith('l2') || lowerLine.startsWith('lrt')) {
        const classeMatch = line.match(/(LIC1|LIC2|LRT|L1|L2)\s*[A-Z]*/i);
        if (classeMatch) {
          currentParticipant.classe = classeMatch[0].toUpperCase();
          // Déduire la promotion de la classe
          if (currentParticipant.classe.includes('LIC1') || currentParticipant.classe.includes('LRT')) {
            currentParticipant.promo = 'L1';
          } else if (currentParticipant.classe.includes('LIC2') || currentParticipant.classe.includes('L2')) {
            currentParticipant.promo = 'L2';
          }
          console.log(`Classe trouvée: ${currentParticipant.classe}, Promo: ${currentParticipant.promo}`);
        }
      }
      else {
        // Cette ligne pourrait contenir un nom ou prénom
        const isValidName = line.length > 2 &&
                           line.length < 30 && // Pas trop long
                           !/^\d/.test(line) && // Ne commence pas par un chiffre
                           !line.includes('@') &&
                           !line.includes('.') &&
                           !line.includes(':') &&
                           line.toLowerCase() !== 'valide' &&
                           line.toLowerCase() !== 'statut' &&
                           line.toLowerCase() !== 'total' &&
                           line.toLowerCase() !== 'n°' &&
                           !line.match(/^liste/i) &&
                           !line.match(/^hackathon/i);

        if (isValidName) {
          pendingNames.push(line);
          console.log(`Nom potentiel ajouté: ${line}`);
        }
      }
    }

    // Sauvegarder le dernier participant
    if (currentParticipant.email) {
      participants.push(currentParticipant as ExtractedParticipant);
      participantCount++;
      console.log(`Dernier participant ${participantCount} sauvegardé: ${currentParticipant.nom || 'N/A'} ${currentParticipant.prenom || 'N/A'} - ${currentParticipant.email}`);
    }

    console.log(`Total participants structurés extraits: ${participants.length}`);

    // Fallback: utiliser l'ancienne méthode si la nouvelle n'a rien trouvé
    if (participants.length === 0) {
      console.log(`Aucun participant structuré trouvé, utilisation de la méthode par email`);
      const lines_old = text.split('\n');
      for (const email of emails) {
      const participant: ExtractedParticipant = { email };

      for (let i = 0; i < lines_old.length; i++) {
        const line = lines_old[i] ?? '';
        if (!line.includes(email)) continue;

        const current = line.trim();
        const contextLines = [
          i > 1 ? (lines_old[i - 2] || '').trim() : '',
          i > 0 ? (lines_old[i - 1] || '').trim() : '',
          current,
          i < lines_old.length - 1 ? (lines_old[i + 1] || '').trim() : '',
          i < lines_old.length - 2 ? (lines_old[i + 2] || '').trim() : '',
        ].filter((l) => l.length > 0);

        // Nom/prénom sur la même ligne (2 mots avant l'email)
        const parts = current.split(/\s+/);
        const emailIndex = parts.findIndex((p) => p === email);
        if (emailIndex > 0) {
          const nameParts = parts.slice(
            Math.max(0, emailIndex - 2),
            emailIndex,
          );
          if (nameParts.length >= 2) {
            participant.prenom = nameParts[0];
            participant.nom = nameParts.slice(1).join(' ');
            participant.fullName = `${participant.prenom} ${participant.nom}`;
          } else if (nameParts.length === 1) {
            participant.fullName = nameParts[0];
          }
        }

        // Chercher infos dans le contexte
        for (const ctx of contextLines) {
          if (!participant.classe && !participant.promo) {
            const classeMatch = ctx.match(/(LIC1|LIC2)\s+[A-Z]/g);
            if (classeMatch?.[0]) {
              participant.classe = classeMatch[0];
              participant.promo = classeMatch[0].includes('LIC1')
                ? 'L1'
                : 'L2';
            } else {
              const promoMatch = ctx.match(/\b(LIC1|LIC2|L1|L2|LRT|LRT\s*2)\s*[A-Z]?\b/gi);
              if (promoMatch?.[0]) {
                const promoText = promoMatch[0].toUpperCase();
                participant.promo =
                  promoText.includes('LIC1') ||
                  promoText.includes('LRT') ||
                  promoText.includes('L1')
                    ? 'L1'
                    : 'L2';
              }
            }
          }

          if (!participant.telephone) {
            const phoneMatch = ctx.match(
              /(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g,
            );
            if (phoneMatch?.[0]) participant.telephone = phoneMatch[0].trim();
          }
        }

        break;
      }

        participants.push(participant);
        console.log(`Participant extrait (fallback) - Email: ${participant.email}, Nom: ${participant.nom || 'N/A'}, Prénom: ${participant.prenom || 'N/A'}, Classe: ${participant.classe || 'N/A'}, Promo: ${participant.promo || 'N/A'}`);
        }
      }
    } // Fermeture du if (participants.length === 0)

    console.log(`🎯 Total participants extraits: ${participants.length}`);
    participants.forEach((p, i) => console.log(`  ${i+1}. ${p.email} (${p.prenom || '?'} ${p.nom || '?'})`));

    return participants;
  }
}
