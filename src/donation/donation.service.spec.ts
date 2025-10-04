/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DonationService } from './donation.service';
import { Donation, DonationDocument } from './schema/donation.schema';
import { Animal } from '../animal/schema/animal.schema';
import { CreateDonationDto } from './dto/create-donation.dto';
import { NotFoundException } from '@nestjs/common';

describe('DonationService', () => {
  let service: DonationService;
  let donationModel: Model<DonationDocument>;
  let animalModel: Model<Animal>;

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
    birthDate: new Date('2020-01-01'),
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

  const mockDonationModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };

  const mockAnimalModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationService,
        {
          provide: getModelToken(Donation.name),
          useValue: mockDonationModel,
        },
        {
          provide: getModelToken(Animal.name),
          useValue: mockAnimalModel,
        },
      ],
    }).compile();

    service = module.get<DonationService>(DonationService);
    donationModel = module.get<Model<DonationDocument>>(
      getModelToken(Donation.name),
    );
    animalModel = module.get<Model<Animal>>(getModelToken(Animal.name));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma nova doação', async () => {
      mockDonationModel.create.mockResolvedValue(mockDonation);

      const result = await service.create(mockCreateDonationDto);

      expect(mockDonationModel.create).toHaveBeenCalledWith(
        mockCreateDonationDto,
      );
      expect(result).toEqual(mockDonation);
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista de doações', async () => {
      const donations = [mockDonation];
      mockDonationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(donations),
        }),
      });

      const result = await service.findAll();

      expect(mockDonationModel.find).toHaveBeenCalled();
      expect(mockDonationModel.find().populate).toHaveBeenCalledWith(
        'animalId',
      );
      expect(mockDonationModel.find().populate().populate).toHaveBeenCalledWith(
        'donatedItems.itemId',
      );
      expect(result).toEqual(donations);
    });

    it('deve retornar uma lista vazia se não houver doações', async () => {
      mockDonationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.findAll();

      expect(mockDonationModel.find).toHaveBeenCalled();
      expect(mockDonationModel.find().populate).toHaveBeenCalledWith(
        'animalId',
      );
      expect(mockDonationModel.find().populate().populate).toHaveBeenCalledWith(
        'donatedItems.itemId',
      );
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma doação por ID', async () => {
      mockDonationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockDonation),
        }),
      });

      const result = await service.findOne(validMongoId);

      expect(mockDonationModel.findById).toHaveBeenCalledWith(validMongoId);
      expect(mockDonationModel.findById().populate).toHaveBeenCalledWith(
        'animalId',
      );
      expect(
        mockDonationModel.findById().populate().populate,
      ).toHaveBeenCalledWith('donatedItems.itemId');
      expect(result).toEqual(mockDonation);
    });

    it('deve lançar NotFoundException se a doação não for encontrada', async () => {
      mockDonationModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne(validMongoId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDonationModel.findById).toHaveBeenCalledWith(validMongoId);
      expect(mockDonationModel.findById().populate).toHaveBeenCalledWith(
        'animalId',
      );
      expect(
        mockDonationModel.findById().populate().populate,
      ).toHaveBeenCalledWith('donatedItems.itemId');
    });
  });

  describe('findByAnimal', () => {
    it('deve retornar animal e suas doações', async () => {
      const donations = [mockDonation];
      mockAnimalModel.findById.mockResolvedValue(mockAnimal);
      mockDonationModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(donations),
      });

      const result = await service.findByAnimal(validMongoId);

      expect(mockAnimalModel.findById).toHaveBeenCalledWith(validMongoId);
      expect(mockDonationModel.find).toHaveBeenCalledWith({
        animalId: validMongoId,
      });
      expect(mockDonationModel.find().select).toHaveBeenCalledWith(
        '-animalId -updatedAt -__v',
      );
      expect(mockDonationModel.find().lean).toHaveBeenCalled();
      expect(result).toEqual({ animal: mockAnimal, donations });
    });

    it('deve retornar mensagem se não houver doações para o animal', async () => {
      mockAnimalModel.findById.mockResolvedValue(mockAnimal);
      mockDonationModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findByAnimal(validMongoId);

      expect(mockAnimalModel.findById).toHaveBeenCalledWith(validMongoId);
      expect(mockDonationModel.find).toHaveBeenCalledWith({
        animalId: validMongoId,
      });
      expect(mockDonationModel.find().select).toHaveBeenCalledWith(
        '-animalId -updatedAt -__v',
      );
      expect(mockDonationModel.find().lean).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'No donations found for this animal.',
      });
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue(null);

      await expect(service.findByAnimal(validMongoId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAnimalModel.findById).toHaveBeenCalledWith(validMongoId);
    });
  });

  describe('remove', () => {
    it('deve remover uma doação por ID', async () => {
      mockDonationModel.findByIdAndDelete.mockResolvedValue(mockDonation);

      await service.remove(validMongoId);

      expect(mockDonationModel.findByIdAndDelete).toHaveBeenCalledWith(
        validMongoId,
      );
    });

    it('deve lançar NotFoundException se a doação não for encontrada', async () => {
      mockDonationModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(service.remove(validMongoId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDonationModel.findByIdAndDelete).toHaveBeenCalledWith(
        validMongoId,
      );
    });
  });
});
