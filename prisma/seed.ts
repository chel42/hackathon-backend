import {
  PrismaClient,
  Role,
  HackathonStatus,
  AnnonceCible,
  Promo,
  StatutInscription,
  TypeIALog,
  TypeEvenementSurveillance,
  NiveauEvenementSurveillance,
  TypeNotification,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env') });

// Créer PrismaClient avec la même logique que PrismaService
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL n\'est pas défini dans les variables d\'environnement.');
  }

  // Pour le seed, on utilise l'adapter PostgreSQL si l'URL ne commence pas par "prisma+"
  if (databaseUrl.startsWith('prisma+')) {
    return new PrismaClient({
      accelerateUrl: databaseUrl,
    });
  } else {
    // Connexion directe PostgreSQL avec adapter
    try {
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = parseInt(url.port) || 5432;
      const database = url.pathname.split('/').filter(Boolean)[0] || 'postgres';
      const user = url.username || 'postgres';
      const password = decodeURIComponent(url.password || '');

      const pool = new Pool({
        host,
        port,
        database,
        user,
        password,
      });

      return new PrismaClient({
        adapter: new PrismaPg(pool),
      });
    } catch (urlError) {
      // Fallback : utiliser connectionString directement
      const pool = new Pool({ connectionString: databaseUrl });
      return new PrismaClient({
        adapter: new PrismaPg(pool),
      });
    }
  }
}

const prisma = createPrismaClient();

async function main() {
  console.log('🌱 Début du seed complet avec au moins 2 données par table...\n');

  // ============================================
  // 1. USERS (Au moins 2 utilisateurs)
  // ============================================
  console.log('📝 Création des utilisateurs...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hackathon.com' },
    update: {},
    create: {
      email: 'admin@hackathon.com',
      password: adminPassword,
      nom: 'Admin',
      prenom: 'Système',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin créé:', admin.email);

  const userPassword = await bcrypt.hash('user123', 10);
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@hackathon.com' },
    update: {},
    create: {
      email: 'user1@hackathon.com',
      password: userPassword,
      nom: 'Dupont',
      prenom: 'Jean',
      role: Role.USER,
    },
  });
  console.log('✅ Utilisateur 1 créé:', user1.email);

  const user2Password = await bcrypt.hash('user123', 10);
  const user2 = await prisma.user.upsert({
    where: { email: 'user2@hackathon.com' },
    update: {},
    create: {
      email: 'user2@hackathon.com',
      password: user2Password,
      nom: 'Martin',
      prenom: 'Marie',
      role: Role.USER,
    },
  });
  console.log('✅ Utilisateur 2 créé:', user2.email);

  // ============================================
  // 2. HACKATHONS (Au moins 2 hackathons)
  // ============================================
  console.log('\n📝 Création des hackathons...');

  // Supprimer les anciens hackathons avec des IDs personnalisés (non-UUID)
  console.log('🧹 Nettoyage des anciens hackathons avec IDs personnalisés...');
  const oldHackathons = await prisma.hackathon.findMany({
    where: {
      OR: [
        { id: 'hackathon-upcoming-2026' },
        { id: 'hackathon-ongoing-2026' },
        { id: 'hackathon-past-2025' },
      ],
    },
  });
  
  if (oldHackathons.length > 0) {
    // Supprimer les inscriptions liées d'abord (cascade)
    for (const oldHackathon of oldHackathons) {
      await prisma.inscription.deleteMany({
        where: { hackathonId: oldHackathon.id },
      });
      await prisma.annonce.deleteMany({
        where: { hackathonId: oldHackathon.id },
      });
    }
    // Puis supprimer les hackathons
    await prisma.hackathon.deleteMany({
      where: {
        OR: [
          { id: 'hackathon-upcoming-2026' },
          { id: 'hackathon-ongoing-2026' },
          { id: 'hackathon-past-2025' },
        ],
      },
    });
    console.log(`✅ ${oldHackathons.length} ancien(s) hackathon(s) supprimé(s)`);
  }

  // Utiliser des UUIDs fixes pour les hackathons (le backend valide avec @IsUUID())
  const hackathonUpcomingId = 'a1b2c3d4-e5f6-4789-a012-345678901234';
  const hackathonOngoingId = 'b2c3d4e5-f6a7-4890-b123-456789012345';

  const hackathonUpcoming = await prisma.hackathon.upsert({
    where: { id: hackathonUpcomingId },
    update: {},
    create: {
      id: hackathonUpcomingId,
      nom: 'Hackathon Innovation 2026',
      description: 'Le plus grand hackathon de l\'année 2026 sur l\'innovation technologique',
      themes: ['IA', 'Blockchain', 'IoT', 'Cybersécurité'],
      dateDebut: new Date('2026-02-15T09:00:00Z'),
      dateFin: new Date('2026-02-17T18:00:00Z'),
      dateLimiteInscription: new Date('2026-02-10T23:59:59Z'),
      status: HackathonStatus.UPCOMING,
    },
  });
  console.log('✅ Hackathon à venir créé:', hackathonUpcoming.nom, `(ID: ${hackathonUpcoming.id})`);

  const hackathonOngoing = await prisma.hackathon.upsert({
    where: { id: hackathonOngoingId },
    update: {},
    create: {
      id: hackathonOngoingId,
      nom: 'Hackathon Développement Web 2026',
      description: 'Hackathon en cours sur le développement web moderne',
      themes: ['React', 'Next.js', 'TypeScript', 'Node.js'],
      dateDebut: new Date('2026-01-10T09:00:00Z'),
      dateFin: new Date('2026-01-12T18:00:00Z'),
      dateLimiteInscription: new Date('2026-01-08T23:59:59Z'),
      status: HackathonStatus.ONGOING,
    },
  });
  console.log('✅ Hackathon en cours créé:', hackathonOngoing.nom);

  // ============================================
  // 3. INSCRIPTIONS (Au moins 2 inscriptions)
  // ============================================
  console.log('\n📝 Création des inscriptions...');

  const inscription1 = await prisma.inscription.upsert({
    where: {
      userId_hackathonId: {
        userId: user1.id,
        hackathonId: hackathonUpcoming.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      hackathonId: hackathonUpcoming.id,
      promo: Promo.L2,
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      statut: StatutInscription.VALIDE,
    },
  });
  console.log('✅ Inscription 1 créée:', `User ${user1.email} → Hackathon ${hackathonUpcoming.nom}`);

  const inscription2 = await prisma.inscription.upsert({
    where: {
      userId_hackathonId: {
        userId: user2.id,
        hackathonId: hackathonUpcoming.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      hackathonId: hackathonUpcoming.id,
      promo: Promo.L1,
      technologies: ['Python', 'Flask', 'Docker', 'MongoDB'],
      statut: StatutInscription.EN_ATTENTE,
    },
  });
  console.log('✅ Inscription 2 créée:', `User ${user2.email} → Hackathon ${hackathonUpcoming.nom}`);

  // ============================================
  // 4. ANNONCES (Au moins 2 annonces)
  // ============================================
  console.log('\n📝 Création des annonces...');

  const annonce1 = await prisma.annonce.create({
    data: {
      titre: 'Bienvenue au Hackathon Innovation 2026',
      contenu: 'Nous sommes ravis de vous accueillir pour cette édition 2026 ! Le hackathon se déroulera du 15 au 17 février 2026. N\'oubliez pas de venir avec votre ordinateur portable et votre bonne humeur !',
      cible: AnnonceCible.PUBLIC,
      hackathonId: hackathonUpcoming.id,
      userId: admin.id,
      sentAt: new Date(),
    },
  });
  console.log('✅ Annonce publique créée:', annonce1.titre);

  const annonce2 = await prisma.annonce.create({
    data: {
      titre: 'Informations importantes pour les inscrits',
      contenu: 'Chers participants, veuillez noter que le hackathon débutera à 9h00 précises. Le matériel sera fourni sur place. Pour toute question, contactez-nous à admin@hackathon.com',
      cible: AnnonceCible.INSCRITS,
      hackathonId: hackathonUpcoming.id,
      userId: admin.id,
      sentAt: new Date(),
    },
  });
  console.log('✅ Annonce pour inscrits créée:', annonce2.titre);

  // ============================================
  // 5. IA LOGS (Au moins 2 logs IA)
  // ============================================
  console.log('\n📝 Création des logs IA...');

  const iaLog1 = await prisma.iALog.create({
    data: {
      userId: user1.id,
      type: TypeIALog.ANALYSE,
      input: {
        inscriptionId: inscription1.id,
        technologies: inscription1.technologies,
        promo: inscription1.promo,
      },
      output: {
        score: 0.85,
        recommandations: ['Excellent profil technique', 'Recommandé pour équipe senior'],
      },
      score: 0.85,
      suggestions: ['React', 'TypeScript', 'Node.js'],
      metadata: {
        model: 'gpt-4',
        timestamp: new Date().toISOString(),
      },
    },
  });
  console.log('✅ Log IA 1 créé:', `Type ${iaLog1.type} pour User ${user1.email}`);

  const iaLog2 = await prisma.iALog.create({
    data: {
      userId: user2.id,
      type: TypeIALog.SURVEILLANCE,
      input: {
        inscriptionId: inscription2.id,
        technologies: inscription2.technologies,
        promo: inscription2.promo,
      },
      output: {
        score: 0.65,
        recommandations: ['Profil intéressant', 'Recommandé pour équipe junior'],
      },
      score: 0.65,
      suggestions: ['Python', 'Flask', 'Docker'],
      metadata: {
        model: 'gpt-3.5-turbo',
        timestamp: new Date().toISOString(),
      },
    },
  });
  console.log('✅ Log IA 2 créé:', `Type ${iaLog2.type} pour User ${user2.email}`);

  // ============================================
  // 6. ÉVÉNEMENTS DE SURVEILLANCE (Au moins 2 événements)
  // ============================================
  console.log('\n📝 Création des événements de surveillance...');

  const event1 = await prisma.evenementSurveillance.create({
    data: {
      type: TypeEvenementSurveillance.INSCRIPTION,
      valeur: 50,
      seuil: 100,
      niveau: NiveauEvenementSurveillance.INFO,
      message: 'Taux d\'inscription normal : 50 inscriptions par heure',
      details: {
        hackathonId: hackathonUpcoming.id,
        period: 'last_hour',
      },
      userId: admin.id,
    },
  });
  console.log('✅ Événement de surveillance 1 créé:', event1.type);

  const event2 = await prisma.evenementSurveillance.create({
    data: {
      type: TypeEvenementSurveillance.CONNEXION,
      valeur: 150,
      seuil: 200,
      niveau: NiveauEvenementSurveillance.WARNING,
      message: 'Nombre de connexions élevé : 150 connexions simultanées',
      details: {
        timestamp: new Date().toISOString(),
        ipAddresses: ['192.168.1.1', '192.168.1.2', '192.168.1.3'],
      },
      userId: user1.id,
    },
  });
  console.log('✅ Événement de surveillance 2 créé:', event2.type);

  // ============================================
  // 7. NOTIFICATIONS (Au moins 2 notifications)
  // ============================================
  console.log('\n📝 Création des notifications...');

  const notification1 = await prisma.notification.create({
    data: {
      type: TypeNotification.EMAIL,
      message: 'Votre inscription au Hackathon Innovation 2026 a été validée !',
      scheduledAt: new Date('2026-02-10T10:00:00Z'),
      sent: true,
      sentAt: new Date('2026-02-10T10:00:00Z'),
      userId: user1.id,
      annonceId: annonce2.id,
    },
  });
  console.log('✅ Notification 1 créée:', `Type ${notification1.type} pour User ${user1.email}`);

  const notification2 = await prisma.notification.create({
    data: {
      type: TypeNotification.SITE,
      message: 'Nouvelle annonce publiée : Bienvenue au Hackathon Innovation 2026',
      scheduledAt: new Date('2026-02-09T08:00:00Z'),
      sent: true,
      sentAt: new Date('2026-02-09T08:00:00Z'),
      userId: user2.id,
      annonceId: annonce1.id,
    },
  });
  console.log('✅ Notification 2 créée:', `Type ${notification2.type} pour User ${user2.email}`);

  // ============================================
  // 8. ANALYSES IA (Au moins 2 analyses)
  // ============================================
  console.log('\n📝 Création des analyses IA...');

  // Utiliser upsert car inscriptionId est unique (une seule analyse par inscription)
  const analyse1 = await prisma.analyseIA.upsert({
    where: { inscriptionId: inscription1.id },
    update: {
      scoreMatching: 92.5,
      scoreSpam: 5.2,
      suggestionsEquipes: {
        team1: {
          members: [user1.id, user2.id],
          compatibility: 0.88,
          skills: ['React', 'TypeScript', 'Node.js', 'Python'],
        },
        team2: {
          members: [user1.id],
          compatibility: 0.75,
          skills: ['React', 'TypeScript'],
        },
      },
      autoTags: ['senior', 'fullstack', 'react', 'typescript', 'high-potential'],
    },
    create: {
      inscriptionId: inscription1.id,
      scoreMatching: 92.5,
      scoreSpam: 5.2,
      suggestionsEquipes: {
        team1: {
          members: [user1.id, user2.id],
          compatibility: 0.88,
          skills: ['React', 'TypeScript', 'Node.js', 'Python'],
        },
        team2: {
          members: [user1.id],
          compatibility: 0.75,
          skills: ['React', 'TypeScript'],
        },
      },
      autoTags: ['senior', 'fullstack', 'react', 'typescript', 'high-potential'],
    },
  });
  console.log('✅ Analyse IA 1 créée:', `Inscription ${inscription1.id} - Score: ${analyse1.scoreMatching}`);

  const analyse2 = await prisma.analyseIA.upsert({
    where: { inscriptionId: inscription2.id },
    update: {
      scoreMatching: 78.3,
      scoreSpam: 8.1,
      suggestionsEquipes: {
        team1: {
          members: [user2.id],
          compatibility: 0.70,
          skills: ['Python', 'Flask'],
        },
        team2: {
          members: [user2.id, user1.id],
          compatibility: 0.65,
          skills: ['Python', 'React'],
        },
      },
      autoTags: ['junior', 'backend', 'python', 'docker', 'learning'],
    },
    create: {
      inscriptionId: inscription2.id,
      scoreMatching: 78.3,
      scoreSpam: 8.1,
      suggestionsEquipes: {
        team1: {
          members: [user2.id],
          compatibility: 0.70,
          skills: ['Python', 'Flask'],
        },
        team2: {
          members: [user2.id, user1.id],
          compatibility: 0.65,
          skills: ['Python', 'React'],
        },
      },
      autoTags: ['junior', 'backend', 'python', 'docker', 'learning'],
    },
  });
  console.log('✅ Analyse IA 2 créée:', `Inscription ${inscription2.id} - Score: ${analyse2.scoreMatching}`);

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log('\n✅ Seed terminé avec succès !\n');
  console.log('📊 Résumé des données créées :');
  console.log('  • Users : 3 (1 ADMIN + 2 USER)');
  console.log('  • Hackathons : 2 (1 UPCOMING + 1 ONGOING)');
  console.log('  • Inscriptions : 2 (1 VALIDE + 1 EN_ATTENTE)');
  console.log('  • Annonces : 2 (1 PUBLIC + 1 INSCRITS)');
  console.log('  • IA Logs : 2 (1 ANALYSE + 1 SURVEILLANCE)');
  console.log('  • Événements de surveillance : 2');
  console.log('  • Notifications : 2 (1 EMAIL + 1 SITE)');
  console.log('  • Analyses IA : 2');
  console.log('\n🎉 Toutes les tables contiennent maintenant au moins 2 données !\n');

  // Informations de connexion
  console.log('🔑 Informations de connexion :');
  console.log('  Admin : admin@hackathon.com / admin123');
  console.log('  User 1 : user1@hackathon.com / user123');
  console.log('  User 2 : user2@hackathon.com / user123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
