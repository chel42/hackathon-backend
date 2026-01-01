import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HackathonStatus } from '@prisma/client';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hackathonId: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Créer un hackathon de test
    const hackathon = await prisma.hackathon.create({
      data: {
        nom: 'Hackathon Test E2E',
        description: 'Description test',
        dateDebut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
        dateFin: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // +9 jours
        dateLimiteInscription: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 jours
        status: HackathonStatus.UPCOMING,
      },
    });
    hackathonId = hackathon.id;

    // Créer un admin pour les tests
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: '$2b$10$rQZ8X5Y5Y5Y5Y5Y5Y5Y5Y.5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', // password
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
      },
    });

    // Login admin pour obtenir le token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password',
      });

    adminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.inscription.deleteMany({
      where: {
        hackathonId,
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'admin@test.com'],
        },
      },
    });
    await prisma.hackathon.delete({
      where: { id: hackathonId },
    });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('devrait créer un utilisateur et une inscription', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          nom: 'Dupont',
          prenom: 'Jean',
          promo: '2024',
          technologies: ['React', 'Node.js'],
          hackathonId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('inscription');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.inscription.hackathonId).toBe(hackathonId);
    });

    it('devrait retourner une erreur si déjà inscrit', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          nom: 'Dupont',
          prenom: 'Jean',
          hackathonId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('déjà inscrit');
    });
  });

  describe('POST /auth/login', () => {
    it('devrait retourner un token JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
    });

    it('devrait retourner une erreur avec de mauvais identifiants', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});

