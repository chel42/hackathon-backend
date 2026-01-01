import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceController } from './annonce.controller';
import { AnnonceService } from './annonce.service';
import { AnnonceCible } from '@prisma/client';

describe('AnnonceController', () => {
  let controller: AnnonceController;
  let service: AnnonceService;

  const mockAnnonceService = {
    create: jest.fn(),
    getPublicAnnonces: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnonceController],
      providers: [
        {
          provide: AnnonceService,
          useValue: mockAnnonceService,
        },
      ],
    }).compile();

    controller = module.get<AnnonceController>(AnnonceController);
    service = module.get<AnnonceService>(AnnonceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait appeler le service pour créer une annonce', async () => {
      const createDto = {
        titre: 'Annonce test',
        contenu: 'Contenu test',
        cible: AnnonceCible.PUBLIC,
      };

      const mockResult = {
        id: '1',
        ...createDto,
        hackathonId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnnonceService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResult);
      expect(mockAnnonceService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('getPublicAnnonces', () => {
    it('devrait appeler le service pour récupérer les annonces publiques', async () => {
      const mockResult = [
        {
          id: '1',
          titre: 'Annonce 1',
          contenu: 'Contenu 1',
          cible: AnnonceCible.PUBLIC,
          hackathon: null,
        },
      ];

      mockAnnonceService.getPublicAnnonces.mockResolvedValue(mockResult);

      const result = await controller.getPublicAnnonces();

      expect(result).toEqual(mockResult);
      expect(mockAnnonceService.getPublicAnnonces).toHaveBeenCalled();
    });
  });
});

