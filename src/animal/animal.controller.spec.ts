/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AnimalController } from './animal.controller';
import { AnimalService } from './animal.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/guard/auth.guard';

describe('AnimalController', () => {
  let controller: AnimalController;
  let animalService: AnimalService;

  const mockAnimal = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Rex',
    birthDate: new Date('2020-01-01'),
    personality: 'Amigável e brincalhão',
    size: 'medio',
    vaccinated: true,
    neutered: false,
    needsList: [
      { image: 'item.jpg', name: 'Ração', price: 59.99 },
      { image: 'coleira.jpg', name: 'Coleira', price: 25.5 },
    ],
    about: 'Um cãozinho resgatado que ama correr.',
    availableForAdoption: true,
    images: [
      'https://res.cloudinary.com/test/image/upload/v123/animals/foto1.jpg',
      'https://res.cloudinary.com/test/image/upload/v123/animals/foto2.jpg',
    ],
  };

  const mockCreateAnimalResponse = {
    success: true,
    message: 'Animal cadastrado com sucesso!',
    data: mockAnimal,
  };

  const mockDeleteAnimalResponse = {
    success: true,
    message: 'Animal deletado com sucesso!',
    data: mockAnimal,
  };

  const mockAnimalService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimalController],
      providers: [
        {
          provide: AnimalService,
          useValue: mockAnimalService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true }) // Mock AuthGuard para permitir testes sem autenticação
      .compile();

    controller = module.get<AnimalController>(AnimalController);
    animalService = module.get<AnimalService>(AnimalService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAnimalDto: CreateAnimalDto = {
      name: 'Rex',
      birthDate: new Date('2020-01-01'),
      personality: 'Amigável e brincalhão',
      size: 'medio',
      vaccinated: true,
      neutered: false,
      needsList: [
        { image: 'item.jpg', name: 'Ração', price: 59.99 },
        { image: 'coleira.jpg', name: 'Coleira', price: 25.5 },
      ],
      about: 'Um cãozinho resgatado que ama correr.',
      availableForAdoption: true,
      images: [],
    };

    it('deve criar um animal com DTO válido e sem imagens', async () => {
      mockAnimalService.create.mockResolvedValue(mockCreateAnimalResponse);
      const createAnimalDtoString = JSON.stringify(createAnimalDto);

      const result = await controller.create(createAnimalDtoString, []);

      expect(animalService.create).toHaveBeenCalledWith(createAnimalDto, []);
      expect(result).toEqual(mockCreateAnimalResponse);
    });

    it('deve criar um animal com DTO válido e com imagens', async () => {
      const images = [
        { buffer: Buffer.from('image1') } as Express.Multer.File,
        { buffer: Buffer.from('image2') } as Express.Multer.File,
      ];
      mockAnimalService.create.mockResolvedValue(mockCreateAnimalResponse);
      const createAnimalDtoString = JSON.stringify(createAnimalDto);

      const result = await controller.create(createAnimalDtoString, images);

      expect(animalService.create).toHaveBeenCalledWith(
        createAnimalDto,
        images,
      );
      expect(result).toEqual(mockCreateAnimalResponse);
    });

    it('deve lançar BadRequestException se o DTO for inválido', async () => {
      const invalidDtoString = 'invalid-json';

      await expect(controller.create(invalidDtoString, [])).rejects.toThrow(
        BadRequestException,
      );
      expect(animalService.create).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se faltarem campos obrigatórios no DTO', async () => {
      const invalidDto = { ...createAnimalDto, name: undefined };
      const invalidDtoString = JSON.stringify(invalidDto);

      await expect(controller.create(invalidDtoString, [])).rejects.toThrow(
        BadRequestException,
      );
      expect(animalService.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista de animais', async () => {
      const animals = [
        mockAnimal,
        { ...mockAnimal, _id: '507f1f77bcf86cd799439012' },
      ];
      mockAnimalService.findAll.mockResolvedValue(animals);

      const result = await controller.findAll();

      expect(animalService.findAll).toHaveBeenCalled();
      expect(result).toEqual(animals);
    });

    it('deve retornar uma lista vazia se não houver animais', async () => {
      mockAnimalService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(animalService.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um animal por ID', async () => {
      mockAnimalService.findOne.mockResolvedValue(mockAnimal);

      const result = await controller.findOne('507f1f77bcf86cd799439011');

      expect(animalService.findOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockAnimal);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalService.findOne.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );

      await expect(
        controller.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      expect(animalService.findOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('update', () => {
    const updateAnimalDto: UpdateAnimalDto = {
      name: 'Rex Atualizado',
      vaccinated: true,
    };

    it('deve atualizar um animal com DTO válido e sem imagens', async () => {
      const updatedAnimal = { ...mockAnimal, ...updateAnimalDto };
      mockAnimalService.update.mockResolvedValue(updatedAnimal);
      const updateAnimalDtoString = JSON.stringify(updateAnimalDto);

      const result = await controller.update(
        '507f1f77bcf86cd799439011',
        updateAnimalDtoString,
        [],
      );

      expect(animalService.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateAnimalDto,
        [],
      );
      expect(result).toEqual(updatedAnimal);
    });

    it('deve atualizar um animal com DTO válido e com imagens', async () => {
      const images = [
        { buffer: Buffer.from('image1') } as Express.Multer.File,
        { buffer: Buffer.from('image2') } as Express.Multer.File,
      ];
      const updatedAnimal = {
        ...mockAnimal,
        ...updateAnimalDto,
        images: [
          'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto1.jpg',
          'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto2.jpg',
        ],
      };
      mockAnimalService.update.mockResolvedValue(updatedAnimal);
      const updateAnimalDtoString = JSON.stringify(updateAnimalDto);

      const result = await controller.update(
        '507f1f77bcf86cd799439011',
        updateAnimalDtoString,
        images,
      );

      expect(animalService.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateAnimalDto,
        images,
      );
      expect(result).toEqual(updatedAnimal);
    });

    it('deve lançar BadRequestException se o DTO for inválido', async () => {
      const invalidDtoString = 'invalid-json';

      await expect(
        controller.update('507f1f77bcf86cd799439011', invalidDtoString, []),
      ).rejects.toThrow(BadRequestException);
      expect(animalService.update).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalService.update.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );
      const updateAnimalDtoString = JSON.stringify(updateAnimalDto);

      await expect(
        controller.update(
          '507f1f77bcf86cd799439011',
          updateAnimalDtoString,
          [],
        ),
      ).rejects.toThrow(NotFoundException);
      expect(animalService.update).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateAnimalDto,
        [],
      );
    });
  });

  describe('delete', () => {
    it('deve deletar um animal', async () => {
      mockAnimalService.delete.mockResolvedValue(mockDeleteAnimalResponse);

      const result = await controller.delete('507f1f77bcf86cd799439011');

      expect(animalService.delete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockDeleteAnimalResponse);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalService.delete.mockRejectedValue(
        new NotFoundException('Animal não encontrado'),
      );

      await expect(
        controller.delete('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      expect(animalService.delete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });
});
