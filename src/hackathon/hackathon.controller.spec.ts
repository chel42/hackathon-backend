import { Test, TestingModule } from '@nestjs/testing';
import { HackathonController } from './hackathon.controller';
import { HackathonService } from './hackathon.service';

describe('HackathonController', () => {
  let controller: HackathonController;
  let service: HackathonService;

  const mockHackathonService = {
    getPublicHackathon: jest.fn(),
    getPastHackathons: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HackathonController],
      providers: [
        {
          provide: HackathonService,
          useValue: mockHackathonService,
        },
      ],
    }).compile();

    controller = module.get<HackathonController>(HackathonController);
    service = module.get<HackathonService>(HackathonService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicHackathon', () => {
    it('devrait appeler le service et retourner le hackathon public', async () => {
      const mockResult = {
        id: '1',
        nom: 'Hackathon 2024',
        description: 'Description',
        dateDebut: new Date('2024-12-01'),
        dateFin: new Date('2024-12-03'),
        dateLimiteInscription: new Date('2024-11-30'),
        status: 'UPCOMING',
        compteARebours: 86400,
      };

      mockHackathonService.getPublicHackathon.mockResolvedValue(mockResult);

      const result = await controller.getPublicHackathon();

      expect(result).toEqual(mockResult);
      expect(mockHackathonService.getPublicHackathon).toHaveBeenCalled();
    });
  });

  describe('getPastHackathons', () => {
    it('devrait appeler le service avec les paramètres de pagination', async () => {
      const mockResult = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockHackathonService.getPastHackathons.mockResolvedValue(mockResult);

      const result = await controller.getPastHackathons(1, 10, undefined);

      expect(result).toEqual(mockResult);
      expect(mockHackathonService.getPastHackathons).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('devrait appeler le service avec l\'année si fournie', async () => {
      const mockResult = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      mockHackathonService.getPastHackathons.mockResolvedValue(mockResult);

      const result = await controller.getPastHackathons(1, 10, '2023');

      expect(result).toEqual(mockResult);
      expect(mockHackathonService.getPastHackathons).toHaveBeenCalledWith(1, 10, 2023);
    });
  });
});

