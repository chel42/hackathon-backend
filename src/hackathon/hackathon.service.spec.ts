import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { PrismaService } from '../prisma/prisma.service';
import { HackathonStatus } from '@prisma/client';

describe('HackathonService', () => {
  let service: HackathonService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    hackathon: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HackathonService>(HackathonService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicHackathon', () => {
    it('devrait retourner le hackathon public avec compte à rebours', async () => {
      const mockHackathon = {
        id: '1',
        nom: 'Hackathon 2024',
        description: 'Description',
        dateDebut: new Date('2024-12-01'),
        dateFin: new Date('2024-12-03'),
        dateLimiteInscription: new Date(Date.now() + 86400000), // +1 jour
        status: HackathonStatus.UPCOMING,
      };

      mockPrismaService.hackathon.findFirst.mockResolvedValue(mockHackathon);

      const result = await service.getPublicHackathon();

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('nom', 'Hackathon 2024');
      expect(result).toHaveProperty('compteARebours');
      expect(result.compteARebours).toBeGreaterThan(0);
      expect(mockPrismaService.hackathon.findFirst).toHaveBeenCalledWith({
        where: {
          status: {
            in: [HackathonStatus.UPCOMING, HackathonStatus.ONGOING],
          },
        },
        orderBy: {
          dateDebut: 'asc',
        },
      });
    });

    it('devrait lever une exception si aucun hackathon public n\'est trouvé', async () => {
      mockPrismaService.hackathon.findFirst.mockResolvedValue(null);

      await expect(service.getPublicHackathon()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPastHackathons', () => {
    it('devrait retourner la liste des hackathons passés avec pagination', async () => {
      const mockHackathons = [
        {
          id: '1',
          nom: 'Hackathon 2023',
          description: 'Description',
          dateDebut: new Date('2023-12-01'),
          dateFin: new Date('2023-12-03'),
          status: HackathonStatus.PAST,
          _count: { inscriptions: 10 },
        },
      ];

      mockPrismaService.hackathon.findMany.mockResolvedValue(mockHackathons);
      mockPrismaService.hackathon.count.mockResolvedValue(1);

      const result = await service.getPastHackathons(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('nombreInscriptions', 10);
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 10);
      expect(result.meta).toHaveProperty('total', 1);
      expect(result.meta).toHaveProperty('totalPages', 1);
    });

    it('devrait filtrer par année si fourni', async () => {
      const mockHackathons = [];
      mockPrismaService.hackathon.findMany.mockResolvedValue(mockHackathons);
      mockPrismaService.hackathon.count.mockResolvedValue(0);

      await service.getPastHackathons(1, 10, 2023);

      expect(mockPrismaService.hackathon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: HackathonStatus.PAST,
            dateDebut: {
              gte: new Date('2023-01-01'),
              lt: new Date('2024-01-01'),
            },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('devrait retourner le hackathon par ID', async () => {
      const mockHackathon = {
        id: '1',
        nom: 'Hackathon 2024',
        description: 'Description',
        dateDebut: new Date('2024-12-01'),
        dateFin: new Date('2024-12-03'),
        dateLimiteInscription: new Date('2024-11-30'),
        status: HackathonStatus.UPCOMING,
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(mockHackathon);

      const result = await service.findById('1');

      expect(result).toEqual(mockHackathon);
      expect(mockPrismaService.hackathon.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('devrait lever une exception si le hackathon n\'existe pas', async () => {
      mockPrismaService.hackathon.findUnique.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});

