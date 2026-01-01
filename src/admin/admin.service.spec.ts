import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { HackathonStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    hackathon: {
      findFirst: jest.fn(),
    },
    inscription: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    iALog: {
      findMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  const mockEventsGateway = {
    emitNewInscription: jest.fn(),
    emitStatsUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('devrait retourner les statistiques du dashboard', async () => {
      const mockHackathon = {
        id: 'hackathon-1',
        nom: 'Hackathon 2024',
        status: HackathonStatus.UPCOMING,
        dateDebut: new Date('2024-12-01'),
        dateFin: new Date('2024-12-03'),
        dateLimiteInscription: new Date('2024-11-30'),
      };

      const mockInscriptions = [
        {
          user: {
            promo: '2024',
            technologies: ['React', 'Node.js'],
          },
        },
        {
          user: {
            promo: '2024',
            technologies: ['React', 'TypeScript'],
          },
        },
        {
          user: {
            promo: '2023',
            technologies: ['Vue.js'],
          },
        },
        {
          user: {
            promo: null,
            technologies: ['Angular'],
          },
        },
      ];

      mockPrismaService.hackathon.findFirst.mockResolvedValue(mockHackathon);
      mockPrismaService.inscription.count.mockResolvedValue(4);
      mockPrismaService.inscription.findMany
        .mockResolvedValueOnce(mockInscriptions) // Pour parPromo
        .mockResolvedValueOnce(mockInscriptions); // Pour parTechnologie

      const result = await service.getDashboard();

      expect(result).toHaveProperty('hackathon');
      expect(result).toHaveProperty('totalInscrits', 4);
      expect(result).toHaveProperty('parPromo');
      expect(result).toHaveProperty('parTechnologie');
      expect(result.parPromo).toContainEqual({ promo: '2024', count: 2 });
      expect(result.parPromo).toContainEqual({ promo: '2023', count: 1 });
      expect(result.parPromo).toContainEqual({ promo: 'Non renseignée', count: 1 });
      expect(result.parTechnologie).toContainEqual({ technologie: 'React', count: 2 });
      expect(result.parTechnologie).toContainEqual({ technologie: 'Node.js', count: 1 });
    });

    it('devrait retourner un message si aucun hackathon actif', async () => {
      mockPrismaService.hackathon.findFirst.mockResolvedValue(null);

      const result = await service.getDashboard();

      expect(result).toHaveProperty('message', 'Aucun hackathon actif');
      expect(result).toHaveProperty('totalInscrits', 0);
      expect(result).toHaveProperty('parPromo', []);
      expect(result).toHaveProperty('parTechnologie', []);
    });
  });

  describe('getMonitoringLogs', () => {
    it('devrait retourner les logs avec pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          type: 'inscription_analysis',
          score: 85,
          suggestions: [],
          metadata: {},
          createdAt: new Date(),
          user: {
            id: 'user-1',
            email: 'user@example.com',
            nom: 'Dupont',
            prenom: 'Jean',
          },
        },
      ];

      mockPrismaService.iALog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.iALog.count.mockResolvedValue(1);

      const result = await service.getMonitoringLogs(1, 50);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 50);
      expect(result.meta).toHaveProperty('total', 1);
    });

    it('devrait filtrer par type si fourni', async () => {
      const mockLogs = [];
      mockPrismaService.iALog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.iALog.count.mockResolvedValue(0);

      await service.getMonitoringLogs(1, 50, 'inscription_analysis');

      expect(mockPrismaService.iALog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'inscription_analysis' },
        }),
      );
    });
  });

  describe('getMetrics', () => {
    it('devrait retourner les métriques du système', async () => {
      const maintenant = new Date();
      const ilYUneHeure = new Date(maintenant.getTime() - 60 * 60 * 1000);

      mockPrismaService.inscription.count
        .mockResolvedValueOnce(5) // inscriptionsPerHour
        .mockResolvedValueOnce(20) // inscriptionsPerDay
        .mockResolvedValueOnce(100); // totalInscriptions
      mockPrismaService.user.count.mockResolvedValue(50);
      mockPrismaService.iALog.count.mockResolvedValue(30);
      mockPrismaService.iALog.findMany.mockResolvedValue([
        { score: 85 },
        { score: 90 },
        { score: 75 },
      ]);

      const result = await service.getMetrics();

      expect(result).toHaveProperty('inscriptions');
      expect(result.inscriptions).toHaveProperty('perHour', 5);
      expect(result.inscriptions).toHaveProperty('perDay', 20);
      expect(result.inscriptions).toHaveProperty('total', 100);
      expect(result).toHaveProperty('users');
      expect(result.users).toHaveProperty('total', 50);
      expect(result).toHaveProperty('ai');
      expect(result.ai).toHaveProperty('totalAnalyses', 30);
      expect(result.ai).toHaveProperty('averageScore');
    });
  });
});

