/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NeedItemService } from './need-item.service';
import { Animal, AnimalDocument } from '../animal/schema/animal.schema';
import { NeedItemDto } from './dto/need-item.dto';
import { UpdateNeedItemDto } from './dto/update-need-item.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

describe('NeedItemService', () => {
  let service: NeedItemService;
  let animalModel: Model<AnimalDocument>;

  const mockAnimal = {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    name: 'Rex',
    birthDate: new Date('2020-01-01'),
    personality: 'Amigável e brincalhão',
    size: 'medio',
    vaccinated: true,
    neutered: false,
    needsList: [
      {
        _id: new ObjectId('507f1f77bcf86cd799439012'),
        image: 'item.jpg',
        name: 'Ração',
        price: 59.99,
      },
      {
        _id: new ObjectId('507f1f77bcf86cd799439013'),
        image: 'coleira.jpg',
        name: 'Coleira',
        price: 25.5,
      },
    ],
    about: 'Um cãozinho resgatado que ama correr.',
    availableForAdoption: true,
    images: [],
    save: jest.fn(),
  };

  const mockNeedItemDto: NeedItemDto = {
    image: 'new-item.jpg',
    name: 'Brinquedo',
    price: 15.99,
  };

  const mockUpdateNeedItemDto: UpdateNeedItemDto = {
    image: 'updated-item.jpg',
    name: 'Ração Premium',
    price: 79.99,
  };

  const mockAnimalModel = {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeedItemService,
        {
          provide: getModelToken(Animal.name),
          useValue: mockAnimalModel,
        },
      ],
    }).compile();

    service = module.get<NeedItemService>(NeedItemService);
    animalModel = module.get<Model<AnimalDocument>>(getModelToken(Animal.name));
    jest.clearAllMocks();
  });

  describe('addNeedItem', () => {
    it('deve adicionar um novo item ao needsList', async () => {
      const animalWithSave = {
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
        save: jest.fn().mockResolvedValue({
          ...mockAnimal,
          needsList: [
            ...mockAnimal.needsList,
            {
              _id: new ObjectId('507f1f77bcf86cd799439014'),
              ...mockNeedItemDto,
            },
          ],
        }),
      };
      mockAnimalModel.findById.mockResolvedValue(animalWithSave);

      const result = await service.addNeedItem(
        '507f1f77bcf86cd799439011',
        mockNeedItemDto,
      );

      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(animalWithSave.save).toHaveBeenCalled();
      expect(result.needsList).toContainEqual(
        expect.objectContaining({
          ...mockNeedItemDto,
          _id: expect.any(ObjectId),
        }),
      );
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue(null);

      await expect(
        service.addNeedItem('507f1f77bcf86cd799439011', mockNeedItemDto),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('deve lançar BadRequestException se o item já existir', async () => {
      const existingItemDto: NeedItemDto = {
        image: 'item.jpg',
        name: 'Ração',
        price: 59.99,
      };
      mockAnimalModel.findById.mockResolvedValue({
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
        save: jest.fn(),
      });

      await expect(
        service.addNeedItem('507f1f77bcf86cd799439011', existingItemDto),
      ).rejects.toThrow(BadRequestException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('getAllNeedItems', () => {
    it('deve retornar a lista de needsList do animal', async () => {
      mockAnimalModel.findById.mockResolvedValue({
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
      });

      const result = await service.getAllNeedItems('507f1f77bcf86cd799439011');

      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockAnimal.needsList);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue(null);

      await expect(
        service.getAllNeedItems('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('getOne', () => {
    it('deve retornar um item do needsList por ID', async () => {
      mockAnimalModel.findById.mockResolvedValue({
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
      });

      const result = await service.getOne(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );

      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockAnimal.needsList[0]);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue(null);

      await expect(
        service.getOne('507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('deve lançar NotFoundException se o item não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue({
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
      });

      await expect(
        service.getOne('507f1f77bcf86cd799439011', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('updateNeedItem', () => {
    it('deve atualizar um item do needsList', async () => {
      const updatedAnimal = {
        ...mockAnimal,
        needsList: [
          {
            ...mockAnimal.needsList[0],
            ...mockUpdateNeedItemDto,
            _id: new ObjectId('507f1f77bcf86cd799439012'),
          },
          mockAnimal.needsList[1],
        ],
      };
      mockAnimalModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedAnimal),
      });

      const result = await service.updateNeedItem(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUpdateNeedItemDto,
      );

      expect(animalModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: '507f1f77bcf86cd799439011',
          'needsList._id': new ObjectId('507f1f77bcf86cd799439012'),
        },
        {
          $set: {
            'needsList.$.name': mockUpdateNeedItemDto.name,
            'needsList.$.price': mockUpdateNeedItemDto.price,
            'needsList.$.image': mockUpdateNeedItemDto.image,
          },
        },
        { new: true },
      );
      expect(result).toEqual({
        name: mockUpdateNeedItemDto.name,
        price: mockUpdateNeedItemDto.price,
        image: mockUpdateNeedItemDto.image,
      });
    });

    it('deve lançar NotFoundException se o animal ou item não for encontrado', async () => {
      mockAnimalModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateNeedItem(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          mockUpdateNeedItemDto,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('removeNeedItem', () => {
    it('deve remover um item do needsList', async () => {
      const animalWithSave = {
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
        save: jest.fn().mockResolvedValue({
          ...mockAnimal,
          needsList: [mockAnimal.needsList[1]],
        }),
      };
      mockAnimalModel.findById.mockResolvedValue(animalWithSave);

      const result = await service.removeNeedItem(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );

      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(animalWithSave.save).toHaveBeenCalled();
      expect(result).toEqual({
        image: mockAnimal.needsList[0].image,
        name: mockAnimal.needsList[0].name,
        price: mockAnimal.needsList[0].price,
      });
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue(null);

      await expect(
        service.removeNeedItem(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('deve lançar NotFoundException se o item não for encontrado', async () => {
      mockAnimalModel.findById.mockResolvedValue({
        ...mockAnimal,
        needsList: [...mockAnimal.needsList],
      });

      await expect(
        service.removeNeedItem('507f1f77bcf86cd799439011', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      expect(animalModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });
});
