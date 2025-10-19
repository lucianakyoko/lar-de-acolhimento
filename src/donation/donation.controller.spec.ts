/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DonationController } from './donation.controller';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/guard/auth.guard';

describe('DonationController', () => {
  let app: INestApplication;
  let donationService: DonationService;

  const validMongoId = '507f1f77bcf86cd799439011';
  const mockDonation = {
    _id: validMongoId,
    donorName: 'João',
    animalId: validMongoId,
    donatedItems: [
      { itemId: '507f1f77bcf86cd799439012', quantity: 5 },
      { itemId: '507f1f77bcf86cd799439013', quantity: 2 },
    ],
    extraAmount: 100.5,
  };

  const mockAnimal = {
    _id: validMongoId,
    name: 'Rex',
    birthDate: '2020-01-01T00:00:00.000Z',
    personality: 'Amigável e brincalhão',
    size: 'medio',
    vaccinated: true,
    neutered: false,
    needsList: [
      {
        _id: '507f1f77bcf86cd799439012',
        image: 'item.jpg',
        name: 'Ração',
        price: 59.99,
      },
      {
        _id: '507f1f77bcf86cd799439013',
        image: 'coleira.jpg',
        name: 'Coleira',
        price: 25.5,
      },
    ],
    about: 'Um cãozinho resgatado que ama correr.',
    availableForAdoption: true,
    images: [],
  };

  const mockCreateDonationDto: CreateDonationDto = {
    donorName: 'João',
    animalId: validMongoId,
    donatedItems: [
      { itemId: '507f1f77bcf86cd799439012', quantity: 5 },
      { itemId: '507f1f77bcf86cd799439013', quantity: 2 },
    ],
    extraAmount: 100.5,
  };

  const mockDonationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByAnimal: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonationController],
      providers: [
        {
          provide: DonationService,
          useValue: mockDonationService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = module.createNestApplication();
    // Desativa os logs do NestJS durante os testes
    app.useLogger(false);
    await app.init();
    donationService = module.get<DonationService>(DonationService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /donation', () => {
    it('deve criar uma nova doação', async () => {
      mockDonationService.create.mockResolvedValue(mockDonation);

      const response = await request(app.getHttpServer())
        .post('/donation')
        .send(mockCreateDonationDto)
        .expect(201);

      expect(mockDonationService.create).toHaveBeenCalledWith(
        mockCreateDonationDto,
      );
      expect(response.body).toEqual(mockDonation);
    });

    it('deve lançar erro se o serviço falhar', async () => {
      mockDonationService.create.mockRejectedValue(
        new Error('Erro ao criar doação'),
      );

      const response = await request(app.getHttpServer())
        .post('/donation')
        .send(mockCreateDonationDto)
        .expect(500);

      expect(mockDonationService.create).toHaveBeenCalledWith(
        mockCreateDonationDto,
      );
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /donation', () => {
    it('deve retornar uma lista de doações com autenticação', async () => {
      const donations = [mockDonation];
      mockDonationService.findAll.mockResolvedValue(donations);

      const response = await request(app.getHttpServer())
        .get('/donation')
        .expect(200);

      expect(mockDonationService.findAll).toHaveBeenCalled();
      expect(response.body).toEqual(donations);
    });

    it('deve retornar uma lista vazia se não houver doações', async () => {
      mockDonationService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/donation')
        .expect(200);

      expect(mockDonationService.findAll).toHaveBeenCalled();
      expect(response.body).toEqual([]);
    });

    it('deve lançar UnauthorizedException se não autenticado', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DonationController],
        providers: [
          {
            provide: DonationService,
            useValue: mockDonationService,
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
      unauthorizedApp.useLogger(false); // Desativa logs para a aplicação não autenticada
      await unauthorizedApp.init();

      await request(unauthorizedApp.getHttpServer())
        .get('/donation')
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        });

      await unauthorizedApp.close();
    });
  });

  describe('GET /donation/:id', () => {
    it('deve retornar uma doação por ID com autenticação', async () => {
      mockDonationService.findOne.mockResolvedValue(mockDonation);

      const response = await request(app.getHttpServer())
        .get(`/donation/${validMongoId}`)
        .expect(200);

      expect(mockDonationService.findOne).toHaveBeenCalledWith(validMongoId);
      expect(response.body).toEqual(mockDonation);
    });

    it('deve lançar NotFoundException se a doação não for encontrada', async () => {
      mockDonationService.findOne.mockRejectedValue(
        new NotFoundException('Donation not found'),
      );

      const response = await request(app.getHttpServer())
        .get(`/donation/${validMongoId}`)
        .expect(404);

      expect(mockDonationService.findOne).toHaveBeenCalledWith(validMongoId);
      expect(response.body.message).toBe('Donation not found');
    });

    it('deve lançar UnauthorizedException se não autenticado', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DonationController],
        providers: [
          {
            provide: DonationService,
            useValue: mockDonationService,
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
      unauthorizedApp.useLogger(false);
      await unauthorizedApp.init();

      await request(unauthorizedApp.getHttpServer())
        .get(`/donation/${validMongoId}`)
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        });

      await unauthorizedApp.close();
    });
  });

  describe('GET /donation/animal/:animalId', () => {
    it('deve retornar animal e suas doações com autenticação', async () => {
      const responseData = { animal: mockAnimal, donations: [mockDonation] };
      mockDonationService.findByAnimal.mockResolvedValue(responseData);

      const response = await request(app.getHttpServer())
        .get(`/donation/animal/${validMongoId}`)
        .expect(200);

      expect(mockDonationService.findByAnimal).toHaveBeenCalledWith(
        validMongoId,
      );
      expect(response.body).toEqual(responseData);
    });

    it('deve retornar mensagem se não houver doações para o animal', async () => {
      const responseData = { message: 'No donations found for this animal.' };
      mockDonationService.findByAnimal.mockResolvedValue(responseData);

      const response = await request(app.getHttpServer())
        .get(`/donation/animal/${validMongoId}`)
        .expect(200);

      expect(mockDonationService.findByAnimal).toHaveBeenCalledWith(
        validMongoId,
      );
      expect(response.body).toEqual(responseData);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockDonationService.findByAnimal.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );

      const response = await request(app.getHttpServer())
        .get(`/donation/animal/${validMongoId}`)
        .expect(404);

      expect(mockDonationService.findByAnimal).toHaveBeenCalledWith(
        validMongoId,
      );
      expect(response.body.message).toBe('Animal not found');
    });

    it('deve lançar UnauthorizedException se não autenticado', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DonationController],
        providers: [
          {
            provide: DonationService,
            useValue: mockDonationService,
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
      unauthorizedApp.useLogger(false);
      await unauthorizedApp.init();

      await request(unauthorizedApp.getHttpServer())
        .get(`/donation/animal/${validMongoId}`)
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        });

      await unauthorizedApp.close();
    });
  });

  describe('DELETE /donation/:id', () => {
    it('deve remover uma doação por ID com autenticação', async () => {
      mockDonationService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/donation/${validMongoId}`)
        .expect(200);

      expect(mockDonationService.remove).toHaveBeenCalledWith(validMongoId);
      expect(response.body).toEqual({
        message: 'Donation removed successfully',
      });
    });

    it('deve lançar NotFoundException se a doação não for encontrada', async () => {
      mockDonationService.remove.mockRejectedValue(
        new NotFoundException('Donation not found'),
      );

      const response = await request(app.getHttpServer())
        .delete(`/donation/${validMongoId}`)
        .expect(404);

      expect(mockDonationService.remove).toHaveBeenCalledWith(validMongoId);
      expect(response.body.message).toBe('Donation not found');
    });

    it('deve lançar UnauthorizedException se não autenticado', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [DonationController],
        providers: [
          {
            provide: DonationService,
            useValue: mockDonationService,
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
      unauthorizedApp.useLogger(false);
      await unauthorizedApp.init();

      await request(unauthorizedApp.getHttpServer())
        .delete(`/donation/${validMongoId}`)
        .expect(401)
        .expect({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        });

      await unauthorizedApp.close();
    });
  });
});
