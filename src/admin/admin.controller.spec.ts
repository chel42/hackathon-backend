import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getDashboard: jest.fn(),
    getMonitoringLogs: jest.fn(),
    getMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('devrait appeler le service et retourner les statistiques', async () => {
      const mockResult = {
        hackathon: {
          id: 'hackathon-1',
          nom: 'Hackathon 2024',
          status: 'UPCOMING',
        },
        totalInscrits: 10,
        parPromo: [
          { promo: '2024', count: 5 },
          { promo: '2023', count: 3 },
        ],
        parTechnologie: [
          { technologie: 'React', count: 8 },
          { technologie: 'Node.js', count: 5 },
        ],
      };

      mockAdminService.getDashboard.mockResolvedValue(mockResult);

      const result = await controller.getDashboard();

      expect(result).toEqual(mockResult);
      expect(mockAdminService.getDashboard).toHaveBeenCalled();
    });
  });

  describe('getMonitoringLogs', () => {
    it('devrait appeler le service avec les paramètres de pagination', async () => {
      const mockResult = {
        data: [],
        meta: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };

      mockAdminService.getMonitoringLogs.mockResolvedValue(mockResult);

      const result = await controller.getMonitoringLogs(1, 50, undefined);

      expect(result).toEqual(mockResult);
      expect(mockAdminService.getMonitoringLogs).toHaveBeenCalledWith(1, 50, undefined);
    });

    it('devrait appeler le service avec le type si fourni', async () => {
      const mockResult = {
        data: [],
        meta: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };

      mockAdminService.getMonitoringLogs.mockResolvedValue(mockResult);

      const result = await controller.getMonitoringLogs(1, 50, 'inscription_analysis');

      expect(result).toEqual(mockResult);
      expect(mockAdminService.getMonitoringLogs).toHaveBeenCalledWith(1, 50, 'inscription_analysis');
    });
  });

  describe('getMetrics', () => {
    it('devrait appeler le service et retourner les métriques', async () => {
      const mockResult = {
        inscriptions: {
          perHour: 5,
          perDay: 20,
          total: 100,
        },
        users: {
          total: 50,
        },
        ai: {
          totalAnalyses: 30,
          averageScore: 83.33,
        },
        timestamp: new Date(),
      };

      mockAdminService.getMetrics.mockResolvedValue(mockResult);

      const result = await controller.getMetrics();

      expect(result).toEqual(mockResult);
      expect(mockAdminService.getMetrics).toHaveBeenCalled();
    });
  });
});

