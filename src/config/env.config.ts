import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement AVANT tout le reste
// Chercher .env à la racine du projet
// __dirname pointe vers dist/src/config en production, ou src/config en dev
// On remonte jusqu'à la racine du projet
const rootPath = process.cwd();
const envPath = resolve(rootPath, '.env');
const result = config({ path: envPath });

// Vérifier que DATABASE_URL est défini
if (!process.env.DATABASE_URL) {
  console.error(
    '⚠️  ATTENTION: DATABASE_URL n\'est pas défini dans les variables d\'environnement.\n' +
    `Fichier .env cherché à: ${envPath}\n` +
    `Fichier .env existe: ${result.parsed ? 'Oui' : 'Non'}\n` +
    'Veuillez créer un fichier .env à la racine du projet avec DATABASE_URL.\n' +
    'Exemple: DATABASE_URL="postgresql://user:password@localhost:5432/hackathon?schema=public"',
  );
} else {
  console.log(`✅ DATABASE_URL chargé depuis: ${envPath}`);
}

