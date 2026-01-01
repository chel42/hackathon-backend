import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { HackathonStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let queueService: QueueService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    hackathon: {
      findUnique: jest.fn(),
    },
    inscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockQueueService = {
    addEmailJob: jest.fn(),
  };

  const mockEventsGateway = {
    emitNewInscription: jest.fn(),
    emitStatsUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('devrait retourner un utilisateur si les identifiants sont valides', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'USER',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('devrait retourner null si le mot de passe est incorrect', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'USER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongPassword');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    const mockHackathon = {
      id: 'hackathon-1',
      nom: 'Hackathon 2024',
      description: 'Description',
      dateDebut: new Date('2024-12-01'),
      dateFin: new Date('2024-12-03'),
      dateLimiteInscription: new Date(Date.now() + 86400000), // +1 jour
      status: HackathonStatus.UPCOMING,
    };

    it('devrait créer un nouvel utilisateur, une inscription et envoyer un email', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        nom: 'Martin',
        prenom: 'Pierre',
        promo: '2024',
        technologies: ['React'],
        hackathonId: 'hackathon-1',
      };

      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockCreatedUser = {
        id: '2',
        email: registerDto.email,
        password: hashedPassword,
        nom: registerDto.nom,
        prenom: registerDto.prenom,
        promo: registerDto.promo,
        technologies: registerDto.technologies,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInscription = {
        id: 'inscription-1',
        userId: '2',
        hackathonId: 'hackathon-1',
        createdAt: new Date(),
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockPrismaService.inscription.create.mockResolvedValue(mockInscription);
      mockQueueService.addEmailJob.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(mockPrismaService.hackathon.findUnique).toHaveBeenCalledWith({
        where: { id: 'hackathon-1' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.inscription.create).toHaveBeenCalledWith({
        data: {
          userId: '2',
          hackathonId: 'hackathon-1',
        },
      });
      expect(mockQueueService.addEmailJob).toHaveBeenCalledWith('accus_reception', {
        email: 'new@example.com',
        nom: 'Martin',
        prenom: 'Pierre',
      });
      expect(result.user.password).toBeUndefined();
      expect(result.inscription).toBeDefined();
    });

    it('devrait lever une exception si le hackathon n\'existe pas', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        nom: 'Martin',
        prenom: 'Pierre',
        hackathonId: 'hackathon-inexistant',
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(NotFoundException);
    });

    it('devrait lever une exception si la deadline est dépassée', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        nom: 'Martin',
        prenom: 'Pierre',
        hackathonId: 'hackathon-1',
      };

      const hackathonExpire = {
        ...mockHackathon,
        dateLimiteInscription: new Date(Date.now() - 86400000), // -1 jour
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(hackathonExpire);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('devrait lever une exception si l\'utilisateur est déjà inscrit', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        nom: 'Martin',
        prenom: 'Pierre',
        hackathonId: 'hackathon-1',
      };

      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        nom: 'Martin',
        prenom: 'Pierre',
      };

      const existingInscription = {
        id: 'inscription-1',
        userId: '1',
        hackathonId: 'hackathon-1',
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.inscription.findUnique.mockResolvedValue(existingInscription);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('devrait créer une inscription si l\'utilisateur existe déjà mais n\'est pas inscrit', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        nom: 'Martin',
        prenom: 'Pierre',
        hackathonId: 'hackathon-1',
      };

      const existingUser = {
        id: '1',
        email: 'existing@example.com',
        nom: 'Martin',
        prenom: 'Pierre',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInscription = {
        id: 'inscription-1',
        userId: '1',
        hackathonId: 'hackathon-1',
        createdAt: new Date(),
      };

      mockPrismaService.hackathon.findUnique.mockResolvedValue(mockHackathon);
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.inscription.findUnique.mockResolvedValue(null);
      mockPrismaService.inscription.create.mockResolvedValue(mockInscription);
      mockQueueService.addEmailJob.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.inscription.create).toHaveBeenCalled();
      expect(result.user.id).toBe('1');
      expect(result.inscription).toBeDefined();
    });
  });
});

