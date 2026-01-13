const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('=== UTILISATEURS ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
      },
    });
    console.log(`Total utilisateurs: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.nom} ${user.prenom}) - ${user.role}`);
    });

    console.log('\n=== HACKATHONS ===');
    const hackathons = await prisma.hackathon.findMany({
      select: {
        id: true,
        nom: true,
        status: true,
      },
    });
    console.log(`Total hackathons: ${hackathons.length}`);
    hackathons.forEach(h => {
      console.log(`- ${h.id}: ${h.nom} (${h.status})`);
    });

    console.log('\n=== INSCRIPTIONS ===');
    const inscriptions = await prisma.inscription.findMany({
      include: {
        user: {
          select: { email: true, nom: true, prenom: true },
        },
        hackathon: {
          select: { nom: true, status: true },
        },
      },
    });
    console.log(`Total inscriptions: ${inscriptions.length}`);
    inscriptions.forEach(ins => {
      console.log(`- ${ins.user.email} -> ${ins.hackathon.nom} (${ins.statut})`);
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();