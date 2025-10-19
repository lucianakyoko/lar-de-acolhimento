/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let compareMock: jest.SpyInstance;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'teste',
    password: 'hashedPassword',
  };

  const mockUserService = {
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    compareMock = jest.spyOn(bcrypt, 'compare'); // Configura o mock globalmente
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restaura os mocks após cada teste
  });

  describe('validateUser', () => {
    it('deve retornar um usuário se as credenciais forem válidas', async () => {
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      compareMock.mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser('teste', 'senha123');

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('teste');
      expect(compareMock).toHaveBeenCalledWith('senha123', mockUser.password);
      expect(result).toEqual(mockUser);
    });

    it('deve retornar null se o usuário não existir', async () => {
      mockUserService.findByUsername.mockResolvedValue(null);

      const result = await authService.validateUser('teste', 'senha123');

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('teste');
      expect(compareMock).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('deve retornar null se a senha for inválida', async () => {
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      compareMock.mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser('teste', 'senha123');

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('teste');
      expect(compareMock).toHaveBeenCalledWith('senha123', mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('deve retornar um access_token para credenciais válidas', async () => {
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      compareMock.mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue('jwt_token_aqui');

      const result = await authService.login('teste', 'senha123');

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('teste');
      expect(compareMock).toHaveBeenCalledWith('senha123', mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: mockUser.username,
        sub: mockUser._id,
      });
      expect(result).toEqual({ access_token: 'jwt_token_aqui' });
    });

    it('deve lançar UnauthorizedException para credenciais inválidas', async () => {
      mockUserService.findByUsername.mockResolvedValue(null);

      await expect(authService.login('teste', 'senha123')).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('teste');
      expect(compareMock).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException se a senha for inválida', async () => {
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      compareMock.mockImplementation(() => Promise.resolve(false));

      await expect(authService.login('teste', 'senha123')).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      expect(mockUserService.findByUsername).toHaveBeenCalledWith('teste');
      expect(compareMock).toHaveBeenCalledWith('senha123', mockUser.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
