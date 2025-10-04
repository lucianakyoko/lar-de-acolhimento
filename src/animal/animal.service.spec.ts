/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnimalService } from './animal.service';
import { UploadService } from '../upload/upload.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { Animal, AnimalDocument } from './schema/animal.schema';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('AnimalService', () => {
  let service: AnimalService;
  let animalModel: Model<AnimalDocument>;
  let uploadService: UploadService;

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

  const mockUploadService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  class MockAnimalModel {
    constructor(public data: any) {
      this.data = { ...data, _id: '507f1f77bcf86cd799439011' };
    }
    save = jest.fn().mockImplementation(function () {
      return Promise.resolve(this.data);
    });
    static find = jest.fn();
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
    static findByIdAndDelete = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalService,
        {
          provide: getModelToken(Animal.name),
          useValue: MockAnimalModel,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<AnimalService>(AnimalService);
    animalModel = module.get<Model<AnimalDocument>>(getModelToken(Animal.name));
    uploadService = module.get<UploadService>(UploadService);
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

    it('deve criar um animal sem imagens', async () => {
      const expectedAnimal = {
        ...createAnimalDto,
        _id: '507f1f77bcf86cd799439011',
        images: [],
      };
      const result = await service.create(createAnimalDto);

      expect(uploadService.uploadImage).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Animal cadastrado com sucesso!',
        data: expectedAnimal,
      });
    });

    it('deve criar um animal com imagens', async () => {
      const images = [
        { buffer: Buffer.from('image1') } as Express.Multer.File,
        { buffer: Buffer.from('image2') } as Express.Multer.File,
      ];
      mockUploadService.uploadImage
        .mockResolvedValueOnce(
          'https://res.cloudinary.com/test/image/upload/v123/animals/foto1.jpg',
        )
        .mockResolvedValueOnce(
          'https://res.cloudinary.com/test/image/upload/v123/animals/foto2.jpg',
        );
      const expectedAnimal = {
        ...createAnimalDto,
        _id: '507f1f77bcf86cd799439011',
        images: [
          'https://res.cloudinary.com/test/image/upload/v123/animals/foto1.jpg',
          'https://res.cloudinary.com/test/image/upload/v123/animals/foto2.jpg',
        ],
      };

      const result = await service.create(createAnimalDto, images);

      expect(uploadService.uploadImage).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        message: 'Animal cadastrado com sucesso!',
        data: expectedAnimal,
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista de animais', async () => {
      const animals = [
        mockAnimal,
        { ...mockAnimal, _id: '507f1f77bcf86cd799439012' },
      ];
      MockAnimalModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(animals),
      });

      const result = await service.findAll();

      expect(MockAnimalModel.find).toHaveBeenCalled();
      expect(result).toEqual(animals);
    });

    it('deve retornar uma lista vazia se não houver animais', async () => {
      MockAnimalModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(MockAnimalModel.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar um animal por ID', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnimal),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockAnimal);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('update', () => {
    const updateAnimalDto: UpdateAnimalDto = {
      name: 'Rex Atualizado',
      vaccinated: true,
    };

    it('deve atualizar um animal sem novas imagens', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnimal),
      });
      MockAnimalModel.findByIdAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockAnimal, ...updateAnimalDto }),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateAnimalDto,
      );

      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(uploadService.deleteImage).not.toHaveBeenCalled();
      expect(uploadService.uploadImage).not.toHaveBeenCalled();
      expect(MockAnimalModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateAnimalDto,
        { new: true },
      );
      expect(result).toEqual({ ...mockAnimal, ...updateAnimalDto });
    });

    it('deve atualizar um animal com novas imagens', async () => {
      const images = [
        { buffer: Buffer.from('image1') } as Express.Multer.File,
        { buffer: Buffer.from('image2') } as Express.Multer.File,
      ];
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnimal),
      });
      mockUploadService.uploadImage
        .mockResolvedValueOnce(
          'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto1.jpg',
        )
        .mockResolvedValueOnce(
          'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto2.jpg',
        );
      MockAnimalModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockAnimal,
          ...updateAnimalDto,
          images: [
            'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto1.jpg',
            'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto2.jpg',
          ],
        }),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateAnimalDto,
        images,
      );

      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(uploadService.deleteImage).toHaveBeenCalledTimes(2);
      expect(uploadService.deleteImage).toHaveBeenCalledWith('animals/foto1');
      expect(uploadService.deleteImage).toHaveBeenCalledWith('animals/foto2');
      expect(uploadService.uploadImage).toHaveBeenCalledTimes(2);
      expect(MockAnimalModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        {
          ...updateAnimalDto,
          images: [
            'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto1.jpg',
            'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto2.jpg',
          ],
        },
        { new: true },
      );
      expect(result).toEqual({
        ...mockAnimal,
        ...updateAnimalDto,
        images: [
          'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto1.jpg',
          'https://res.cloudinary.com/test/image/upload/v123/animals/new-foto2.jpg',
        ],
      });
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', updateAnimalDto),
      ).rejects.toThrow(NotFoundException);
      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('delete', () => {
    it('deve deletar um animal e suas imagens', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnimal),
      });
      MockAnimalModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAnimal),
      });
      mockUploadService.deleteImage.mockResolvedValue(undefined);

      const result = await service.delete('507f1f77bcf86cd799439011');

      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(uploadService.deleteImage).toHaveBeenCalledTimes(2);
      expect(uploadService.deleteImage).toHaveBeenCalledWith('animals/foto1');
      expect(uploadService.deleteImage).toHaveBeenCalledWith('animals/foto2');
      expect(MockAnimalModel.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual({
        success: true,
        message: 'Animal deletado com sucesso!',
        data: mockAnimal,
      });
    });

    it('deve lançar NotFoundException se o ID for inválido', async () => {
      await expect(service.delete('invalid-id')).rejects.toThrow('ID inválido');
      expect(MockAnimalModel.findById).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.delete('507f1f77bcf86cd799439011')).rejects.toThrow(
        'Animal não encontrado',
      );
      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('deve lançar InternalServerErrorException em erro inesperado', async () => {
      MockAnimalModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Erro inesperado')),
      });

      await expect(service.delete('507f1f77bcf86cd799439011')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(MockAnimalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });
});
