const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const h = await prisma.hackathon.findFirst({ orderBy: { dateDebut: 'asc' } });
    console.log('RESULT:', h);
    await prisma.$disconnect();
  } catch (err) {
    console.error('ERR:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
