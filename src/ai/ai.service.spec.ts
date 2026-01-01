import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiService', () => {
  let service: AiService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    iALog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeInscription', () => {
    it('devrait analyser une inscription et créer un log IA', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        promo: '2024',
        technologies: ['React', 'Node.js'],
        inscriptions: [],
      };

      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        type: 'inscription_analysis',
        score: 100,
        suggestions: [],
        metadata: {},
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.iALog.create.mockResolvedValue(mockLog);

      const result = await service.analyzeInscription('user-1');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('metadata');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          inscriptions: {
            include: {
              hackathon: true,
            },
          },
        },
      });
      expect(mockPrismaService.iALog.create).toHaveBeenCalled();
    });

    it('devrait détecter un email suspect et réduire le score', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@fake.com',
        nom: 'Test',
        prenom: 'User',
        promo: null,
        technologies: [],
        inscriptions: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.iALog.create.mockResolvedValue({});

      const result = await service.analyzeInscription('user-1');

      expect(result.score).toBeLessThan(100);
      expect(result.metadata.reasons.length).toBeGreaterThan(0);
    });

    it('devrait lever une exception si l\'utilisateur n\'existe pas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.analyzeInscription('user-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devrait générer des suggestions appropriées', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        promo: null,
        technologies: [],
        inscriptions: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.iALog.create.mockResolvedValue({});

      const result = await service.analyzeInscription('user-1');

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some((s) => s.includes('technologies'))).toBe(true);
      expect(result.suggestions.some((s) => s.includes('promo'))).toBe(true);
    });
  });

  describe('getAllLogs', () => {
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

      const result = await service.getAllLogs(1, 50);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 50);
      expect(result.meta).toHaveProperty('total', 1);
    });

    it('devrait filtrer par type si fourni', async () => {
      const mockLogs = [];
      mockPrismaService.iALog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.iALog.count.mockResolvedValue(0);

      await service.getAllLogs(1, 50, 'inscription_analysis');

      expect(mockPrismaService.iALog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'inscription_analysis' },
        }),
      );
    });
  });
});

