/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockRequest = {
    headers: {
      authorization: 'Bearer valid_token',
    } as { authorization?: string },
    user: undefined as any,
  } as Request;

  const mockExecutionContext = {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => mockRequest),
    })),
  } as unknown as ExecutionContext;

  const mockPayload = {
    username: 'admin',
    sub: '507f1f77bcf86cd799439011',
  };

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'admin';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
    mockRequest.headers.authorization = 'Bearer valid_token';
    mockRequest.user = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    it('deve retornar true e definir request.user para token válido e username de admin', () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockRequest.headers.authorization = 'Bearer valid_token';

      const result = authGuard.canActivate(mockExecutionContext);

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid_token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(result).toBe(true);
    });

    it('deve lançar UnauthorizedException se o cabeçalho Authorization estiver ausente', () => {
      mockRequest.headers.authorization = undefined;

      expect(() => authGuard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('Token not provided.'),
      );

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se o token for inválido', () => {
      mockRequest.headers.authorization = 'Bearer invalid_token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authGuard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('Invalid or expired token.'),
      );

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockJwtService.verify).toHaveBeenCalledWith('invalid_token');
    });

    it('deve lançar ForbiddenException se o username não for admin', () => {
      const nonAdminPayload = {
        username: 'user',
        sub: '507f1f77bcf86cd799439011',
      };
      mockJwtService.verify.mockReturnValue(nonAdminPayload);
      mockRequest.headers.authorization = 'Bearer valid_token';

      expect(() => authGuard.canActivate(mockExecutionContext)).toThrow(
        new ForbiddenException(
          'Access denied! Only administrators can access this route.',
        ),
      );

      expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid_token');
      expect(mockRequest.user).toBeUndefined();
    });
  });
});
