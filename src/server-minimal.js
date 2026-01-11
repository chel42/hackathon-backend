// 🚨 SERVLET EXPRESS ULTRA-MINIMALE POUR RENDER FREE
// DERNIER RECOURS SI NESTJS EST TROP LOURD

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  log: [], // PAS DE LOGS
});

// Middleware minimal
app.use(express.json({ limit: '1mb' })); // Limiter la taille des requêtes

// CORS minimal
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes minimales
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    memory: process.memoryUsage(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Hackathon API - Minimal Mode' });
});

// Gestion d'erreur minimale
app.use((err, req, res, next) => {
  console.error(`ERROR:${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Démarrage
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`OK:${PORT}`);
}).on('error', (err) => {
  console.error(`FATAL:${err.message}`);
  process.exit(1);
});

// Nettoyage
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error(`CRASH:${err.message}`);
  process.exit(1);
});
