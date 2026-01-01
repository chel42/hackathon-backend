import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
  let controller: AiController;
  let service: AiService;

  const mockAiService = {
    analyzeInscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
    service = module.get<AiService>(AiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeInscription', () => {
    it('devrait appeler le service avec le userId', async () => {
      const mockResult = {
        score: 85,
        suggestions: ['Suggestion 1'],
        metadata: {
          reasons: [],
          confidence: 0.9,
        },
      };

      mockAiService.analyzeInscription.mockResolvedValue(mockResult);

      const result = await controller.analyzeInscription('user-1');

      expect(result).toEqual(mockResult);
      expect(mockAiService.analyzeInscription).toHaveBeenCalledWith('user-1');
    });
  });
});

