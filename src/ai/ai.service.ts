import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TypeIALog } from '@prisma/client';

export interface AnalysisResult {
  score: number; // Score de spam (0-100, plus bas = moins suspect)
  suggestions: string[];
  metadata: {
    reasons: string[];
    confidence: number;
  };
}

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Analyse une inscription utilisateur pour détecter le spam et générer des suggestions
   * Cette fonction simule une analyse IA (dans un vrai projet, on appellerait une API IA)
   */
  async analyzeInscription(userId: string): Promise<AnalysisResult> {
    // Récupérer l'utilisateur avec ses inscriptions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        inscriptions: {
          include: {
            hackathon: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} non trouvé`);
    }

    // Simuler l'analyse IA
    const analysisResult = this.performAnalysis(user);

    // Enregistrer le log IA
    await this.prisma.iALog.create({
      data: {
        userId: user.id,
        type: TypeIALog.ANALYSE,
        input: {
          userId: user.id,
          email: user.email,
          inscriptions: user.inscriptions.map((i: any) => ({
            hackathonId: i.hackathonId,
            hackathonNom: i.hackathon?.nom,
          })),
        },
        output: {
          score: analysisResult.score,
          suggestions: analysisResult.suggestions,
          metadata: analysisResult.metadata,
        },
        score: analysisResult.score,
        suggestions: analysisResult.suggestions,
        metadata: analysisResult.metadata,
      },
    });

    return analysisResult;
  }

  /**
   * Fonction de simulation d'analyse IA
   * Dans un vrai projet, cela appellerait une API d'IA (OpenAI, etc.)
   */
  private performAnalysis(user: any): AnalysisResult {
    const reasons: string[] = [];
    let score = 100; // Score initial (100 = parfait, 0 = très suspect)

    // Vérifier l'email (simulation de détection de spam)
    if (user.email.includes('test') || user.email.includes('fake')) {
      score -= 20;
      reasons.push('Email suspect (contient "test" ou "fake")');
    }

    // Vérifier le nombre d'inscriptions
    if (user.inscriptions.length > 5) {
      score -= 15;
      reasons.push('Nombre élevé d\'inscriptions');
    }

    // Vérifier les technologies (maintenant dans Inscription, pas User)
    const latestInscription = user.inscriptions[user.inscriptions.length - 1];
    const technologies = latestInscription?.technologies 
      ? (Array.isArray(latestInscription.technologies) 
          ? latestInscription.technologies 
          : [])
      : [];

    if (technologies.length === 0) {
      score -= 10;
      reasons.push('Aucune technologie renseignée dans l\'inscription');
    }

    // Vérifier la promo (maintenant dans Inscription, pas User)
    const promo = latestInscription?.promo;

    if (!promo) {
      score -= 5;
      reasons.push('Promo non renseignée dans l\'inscription');
    }

    // Générer des suggestions
    const suggestions: string[] = [];
    
    if (technologies.length === 0) {
      suggestions.push('Ajoutez vos technologies préférées dans votre inscription pour améliorer votre profil');
    }
    
    if (!promo) {
      suggestions.push('Renseignez votre promo dans votre inscription pour une meilleure visibilité');
    }

    if (user.inscriptions.length === 0) {
      suggestions.push('Vous n\'êtes inscrit à aucun hackathon actuellement');
    } else if (user.inscriptions.length === 1) {
      suggestions.push('Pensez à vous inscrire à d\'autres hackathons pour plus d\'opportunités');
    }

    if (score < 50) {
      suggestions.push('Votre profil semble incomplet, pensez à le compléter');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      suggestions,
      metadata: {
        reasons: reasons.length > 0 ? reasons : ['Aucun problème détecté'],
        confidence: score > 70 ? 0.9 : score > 40 ? 0.7 : 0.5,
      },
    };
  }

  /**
   * Récupère les logs IA pour un utilisateur
   */
  async getUserLogs(userId: string) {
    return this.prisma.iALog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupère tous les logs IA avec filtres
   */
  async getAllLogs(page: number = 1, limit: number = 50, type?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) {
      where.type = type;
    }

    const [logs, total] = await Promise.all([
      this.prisma.iALog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.iALog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

