import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('devrait appeler authService.register avec les bonnes données', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        nom: 'Dupont',
        prenom: 'Jean',
      };

      const mockUser = {
        id: '1',
        ...registerDto,
        role: 'USER',
      };

      mockAuthService.register.mockResolvedValue(mockUser);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('devrait appeler authService.login avec l\'utilisateur de la requête', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'USER',
      };

      const mockRequest = {
        user: mockUser,
      };

      const mockLoginResult = {
        access_token: 'token123',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(mockLoginResult);

      const result = await controller.login(mockRequest);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockLoginResult);
    });
  });
});

