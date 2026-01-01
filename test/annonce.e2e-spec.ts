import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HackathonStatus, AnnonceCible } from '@prisma/client';

describe('Annonce E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hackathonId: string;
  let adminToken: string;
  let userId: string;

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
        nom: 'Hackathon Test Annonce',
        description: 'Description test',
        dateDebut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        dateLimiteInscription: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: HackathonStatus.UPCOMING,
      },
    });
    hackathonId = hackathon.id;

    // Créer un utilisateur inscrit
    const user = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: '$2b$10$rQZ8X5Y5Y5Y5Y5Y5Y5Y5Y.5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y',
        nom: 'User',
        prenom: 'Test',
        role: 'USER',
      },
    });
    userId = user.id;

    await prisma.inscription.create({
      data: {
        userId: user.id,
        hackathonId,
      },
    });

    // Créer un admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: '$2b$10$rQZ8X5Y5Y5Y5Y5Y5Y5Y5Y.5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y',
        nom: 'Admin',
        prenom: 'Test',
        role: 'ADMIN',
      },
    });

    // Login admin
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password',
      });

    adminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await prisma.annonce.deleteMany({
      where: {
        hackathonId,
      },
    });
    await prisma.inscription.deleteMany({
      where: {
        hackathonId,
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['user@test.com', 'admin@test.com'],
        },
      },
    });
    await prisma.hackathon.delete({
      where: { id: hackathonId },
    });
    await app.close();
  });

  describe('POST /admin/annonces', () => {
    it('devrait créer une annonce publique', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/annonces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Annonce publique test',
          contenu: 'Contenu de l\'annonce',
          cible: AnnonceCible.PUBLIC,
          hackathonId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.titre).toBe('Annonce publique test');
      expect(response.body.cible).toBe(AnnonceCible.PUBLIC);
    });

    it('devrait créer une annonce pour inscrits', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/annonces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titre: 'Annonce inscrits test',
          contenu: 'Contenu pour inscrits',
          cible: AnnonceCible.INSCRITS,
          hackathonId,
        });

      expect(response.status).toBe(201);
      expect(response.body.cible).toBe(AnnonceCible.INSCRITS);
    });

    it('devrait refuser l\'accès sans token admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/annonces')
        .send({
          titre: 'Test',
          contenu: 'Test',
          cible: AnnonceCible.PUBLIC,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /annonces/public', () => {
    it('devrait retourner les annonces publiques', async () => {
      const response = await request(app.getHttpServer())
        .get('/annonces/public');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].cible).toBe(AnnonceCible.PUBLIC);
    });
  });
});

