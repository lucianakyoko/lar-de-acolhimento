/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './guard/auth.guard';

describe('AuthController', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockLoginDto: LoginDto = {
    username: 'teste',
    password: 'senha123',
  };

  const mockToken = { access_token: 'jwt_token_aqui' };

  const mockAuthService = {
    login: jest.fn(),
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
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useLogger(false);
    await app.init();
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('deve retornar um token e definir o cookie para credenciais válidas', async () => {
      mockAuthService.login.mockResolvedValue(mockToken);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockLoginDto)
        .expect(201);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        mockLoginDto.username,
        mockLoginDto.password,
      );
      expect(response.body).toEqual({
        message: 'Login successful',
        access_token: mockToken.access_token,
      });
      expect(response.header['set-cookie']).toBeDefined();
      expect(response.header['set-cookie'][0]).toMatch(
        /token=jwt_token_aqui.*HttpOnly/,
      );
    });

    it('deve lançar UnauthorizedException para credenciais inválidas', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mockLoginDto)
        .expect(401);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        mockLoginDto.username,
        mockLoginDto.password,
      );
      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Credenciais inválidas',
        error: 'Unauthorized',
      });
    });

    it('deve retornar erro de validação se o username estiver ausente', async () => {
      const invalidDto = { password: 'senha123' };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([expect.stringContaining('username')]),
        error: 'Bad Request',
      });
    });

    it('deve retornar erro de validação se o password estiver ausente', async () => {
      const invalidDto = { username: 'teste' };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([expect.stringContaining('password')]),
        error: 'Bad Request',
      });
    });

    it('deve retornar erro de validação se o username não for string', async () => {
      const invalidDto = { username: 123, password: 'senha123' };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('username must be a string'),
        ]),
        error: 'Bad Request',
      });
    });

    it('deve retornar erro de validação se o password não for string', async () => {
      const invalidDto = { username: 'teste', password: 123 };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('password must be a string'),
        ]),
        error: 'Bad Request',
      });
    });
  });

  describe('GET /auth/validate', () => {
    it('deve retornar valid: true com autenticação válida', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .expect(200);

      expect(response.body).toEqual({ valid: true });
    });

    it('deve lançar UnauthorizedException se não autenticado', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: mockAuthService,
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: jest.fn(() => {
            throw new UnauthorizedException('Unauthorized');
          }),
        })
        .compile();

      const unauthorizedApp = module.createNestApplication();
      unauthorizedApp.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      unauthorizedApp.useLogger(false);
      await unauthorizedApp.init();

      const response = await request(unauthorizedApp.getHttpServer())
        .get('/auth/validate')
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      });

      await unauthorizedApp.close();
    });
  });
});
