import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnnonceService } from './annonce.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AnnonceCible } from '@prisma/client';

describe('AnnonceService', () => {
  let service: AnnonceService;
  let prismaService: PrismaService;
  let queueService: QueueService;

  const mockPrismaService = {
    annonce: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    hackathon: {
      findUnique: jest.fn(),
    },
    inscription: {
      findMany: jest.fn(),
    },
  };

  const mockQueueService = {
    addEmailJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnonceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    service = module.get<AnnonceService>(AnnonceService);
    prismaService = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait créer une annonce publique sans envoyer d\'emails', async () => {
      const createDto = {
        titre: 'Annonce publique',
        contenu: 'Contenu de l\'annonce',
        cible: AnnonceCible.PUBLIC,
      };

      const mockAnnonce = {
        id: '1',
        ...createDto,
        hackathonId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.annonce.create.mockResolvedValue(mockAnnonce);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAnnonce);
      expect(mockPrismaService.annonce.create).toHaveBeenCalled();
      expect(mockQueueService.addEmailJob).not.toHaveBeenCalled();
    });

    it('devrait créer une annonce pour inscrits et envoyer des emails en batch', async () => {
      const createDto = {
        titre: 'Annonce pour inscrits',
        contenu: 'Contenu de l\'annonce',
        cible: AnnonceCible.INSCRITS,
        hackathonId: 'hackathon-1',
      };

      const mockHackathon = {
        id: 'hackathon-1',
        nom: 'Hackathon 2024',
      };

      const mockAnnonce = {
        id: '1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInscriptions = [
        {
          user: {
            id: 'user-1',
            email: 'user1@example.com',
            nom: 'Dupont',
            prenom: 'Jean',
          },
        },
        {
          user: {
            id: 'user-2',
            email: 'user2@example.com',
            nom: 'Martin',
            prenom: 'Pierre',
          },
        },
      ];

      mockPrismaService.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrismaService.annonce.create.mockResolvedValue(mockAnnonce);
      mockPrismaService.inscription.findMany.mockResolvedValue(mockInscriptions);
      mockQueueService.addEmailJob.mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result).toEqual(mockAnnonce);
      expect(mockPrismaService.hackathon.findUnique).toHaveBeenCalledWith({
        where: { id: 'hackathon-1' },
      });
      expect(mockPrismaService.inscription.findMany).toHaveBeenCalledWith({
        where: { hackathonId: 'hackathon-1' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true,
            },
          },
        },
      });
      expect(mockQueueService.addEmailJob).toHaveBeenCalledTimes(2);
    });

    it('devrait lever une exception si le hackathon n\'existe pas', async () => {
      const createDto = {
        titre: 'Annonce',
        contenu: 'Contenu',
        cible: AnnonceCible.PUBLIC,
        hackathonId: 'hackathon-inexistant',
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPublicAnnonces', () => {
    it('devrait retourner toutes les annonces publiques', async () => {
      const mockAnnonces = [
        {
          id: '1',
          titre: 'Annonce 1',
          contenu: 'Contenu 1',
          cible: AnnonceCible.PUBLIC,
          hackathonId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          hackathon: null,
        },
        {
          id: '2',
          titre: 'Annonce 2',
          contenu: 'Contenu 2',
          cible: AnnonceCible.PUBLIC,
          hackathonId: 'hackathon-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          hackathon: {
            id: 'hackathon-1',
            nom: 'Hackathon 2024',
          },
        },
      ];

      mockPrismaService.annonce.findMany.mockResolvedValue(mockAnnonces);

      const result = await service.getPublicAnnonces();

      expect(result).toEqual(mockAnnonces);
      expect(mockPrismaService.annonce.findMany).toHaveBeenCalledWith({
        where: {
          cible: AnnonceCible.PUBLIC,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          hackathon: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
      });
    });
  });
});

