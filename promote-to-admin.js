const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Configuration Prisma avec adaptateur PostgreSQL
const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl.replace('prisma://', 'postgresql://');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function promoteToAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Utilisateur ${user.email} promu au rôle ADMIN`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nom: ${user.nom} ${user.prenom}`);
    console.log(`🔑 Rôle: ${user.role}`);
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Utilisation: node promote-to-admin.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node promote-to-admin.js <email>');
  console.log('Exemple: node promote-to-admin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email);

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Configuration Prisma avec adaptateur PostgreSQL
const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl.replace('prisma://', 'postgresql://');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function promoteToAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Utilisateur ${user.email} promu au rôle ADMIN`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nom: ${user.nom} ${user.prenom}`);
    console.log(`🔑 Rôle: ${user.role}`);
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Utilisation: node promote-to-admin.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node promote-to-admin.js <email>');
  console.log('Exemple: node promote-to-admin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email);

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Configuration Prisma avec adaptateur PostgreSQL
const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl.replace('prisma://', 'postgresql://');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function promoteToAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Utilisateur ${user.email} promu au rôle ADMIN`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nom: ${user.nom} ${user.prenom}`);
    console.log(`🔑 Rôle: ${user.role}`);
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Utilisation: node promote-to-admin.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node promote-to-admin.js <email>');
  console.log('Exemple: node promote-to-admin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email);

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Configuration Prisma avec adaptateur PostgreSQL
const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl.replace('prisma://', 'postgresql://');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function promoteToAdmin(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Utilisateur ${user.email} promu au rôle ADMIN`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Nom: ${user.nom} ${user.prenom}`);
    console.log(`🔑 Rôle: ${user.role}`);
  } catch (error) {
    console.error('❌ Erreur lors de la promotion:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Utilisation: node promote-to-admin.js <email>
const email = process.argv[2];
if (!email) {
  console.log('Usage: node promote-to-admin.js <email>');
  console.log('Exemple: node promote-to-admin.js user@example.com');
  process.exit(1);
}

promoteToAdmin(email);
