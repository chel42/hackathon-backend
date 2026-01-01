import { PrismaClient, Role, HackathonStatus, AnnonceCible, Promo } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Créer un admin
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

  // Créer un utilisateur test
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@hackathon.com' },
    update: {},
    create: {
      email: 'user@hackathon.com',
      password: userPassword,
      nom: 'User',
      prenom: 'Test',
      role: Role.USER,
    },
  });
  console.log('✅ Utilisateur créé:', user.email);

  // Créer un hackathon à venir
  const hackathonUpcoming = await prisma.hackathon.upsert({
    where: { id: 'hackathon-upcoming-2026' },
    update: {},
    create: {
      id: 'hackathon-upcoming-2026',
      nom: 'Hackathon 2026',
      description: 'Le plus grand hackathon de l\'année 2026',
      dateDebut: new Date('2026-02-15T09:00:00Z'),
      dateFin: new Date('2026-02-17T18:00:00Z'),
      dateLimiteInscription: new Date('2026-02-10T23:59:59Z'),
      status: HackathonStatus.UPCOMING,
    },
  });
  console.log('✅ Hackathon à venir créé:', hackathonUpcoming.nom);

  // Créer un hackathon passé
  const hackathonPast = await prisma.hackathon.upsert({
    where: { id: 'hackathon-past-2025' },
    update: {},
    create: {
      id: 'hackathon-past-2025',
      nom: 'Hackathon 2025',
      description: 'Hackathon de l\'année 2025',
      dateDebut: new Date('2025-01-15T09:00:00Z'),
      dateFin: new Date('2025-01-17T18:00:00Z'),
      dateLimiteInscription: new Date('2025-01-10T23:59:59Z'),
      status: HackathonStatus.PAST,
    },
  });
  console.log('✅ Hackathon passé créé:', hackathonPast.nom);

  // Créer une inscription avec promo et technologies (selon le nouveau schéma)
  const inscription = await prisma.inscription.upsert({
    where: {
      userId_hackathonId: {
        userId: user.id,
        hackathonId: hackathonUpcoming.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      hackathonId: hackathonUpcoming.id,
      promo: Promo.L2,
      technologies: ['React', 'TypeScript', 'Node.js'],
    },
  });
  console.log('✅ Inscription créée avec promo et technologies');

  // Créer des annonces
  const annonce1 = await prisma.annonce.create({
    data: {
      titre: 'Bienvenue au Hackathon 2026',
      contenu: 'Nous sommes ravis de vous accueillir pour cette édition 2026 !',
      cible: AnnonceCible.PUBLIC,
      hackathonId: hackathonUpcoming.id,
    },
  });
  console.log('✅ Annonce publique créée:', annonce1.titre);

  const annonce2 = await prisma.annonce.create({
    data: {
      titre: 'Informations importantes pour les inscrits',
      contenu: 'N\'oubliez pas d\'apporter votre ordinateur portable et votre bonne humeur !',
      cible: AnnonceCible.INSCRITS,
      hackathonId: hackathonUpcoming.id,
    },
  });
  console.log('✅ Annonce pour inscrits créée:', annonce2.titre);

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

