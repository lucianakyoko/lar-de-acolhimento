/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NeedItemController } from './need-item.controller';
import { NeedItemService } from './need-item.service';
import { NeedItemDto } from './dto/need-item.dto';
import { UpdateNeedItemDto } from './dto/update-need-item.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ObjectId } from 'mongodb';

describe('NeedItemController', () => {
  let controller: NeedItemController;
  let needItemService: NeedItemService;

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

  const mockNeedItemService = {
    addNeedItem: jest.fn(),
    getAllNeedItems: jest.fn(),
    getOne: jest.fn(),
    updateNeedItem: jest.fn(),
    removeNeedItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NeedItemController],
      providers: [
        {
          provide: NeedItemService,
          useValue: mockNeedItemService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<NeedItemController>(NeedItemController);
    needItemService = module.get<NeedItemService>(NeedItemService);
    jest.clearAllMocks();
  });

  describe('addNeedItem', () => {
    it('deve adicionar um novo item ao needsList', async () => {
      mockNeedItemService.addNeedItem.mockResolvedValue(mockAnimal);

      const result = await controller.addNeedItem(
        '507f1f77bcf86cd799439011',
        mockNeedItemDto,
      );

      expect(needItemService.addNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockNeedItemDto,
      );
      expect(result).toEqual(mockAnimal);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockNeedItemService.addNeedItem.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );

      await expect(
        controller.addNeedItem('507f1f77bcf86cd799439011', mockNeedItemDto),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.addNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockNeedItemDto,
      );
    });

    it('deve lançar BadRequestException se o item já existir', async () => {
      mockNeedItemService.addNeedItem.mockRejectedValue(
        new BadRequestException('This item already exists'),
      );

      await expect(
        controller.addNeedItem('507f1f77bcf86cd799439011', mockNeedItemDto),
      ).rejects.toThrow(BadRequestException);
      expect(needItemService.addNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        mockNeedItemDto,
      );
    });
  });

  describe('getAllNeedItems', () => {
    it('deve retornar a lista de needsList do animal', async () => {
      mockNeedItemService.getAllNeedItems.mockResolvedValue(
        mockAnimal.needsList,
      );

      const result = await controller.getAllNeedItems(
        '507f1f77bcf86cd799439011',
      );

      expect(needItemService.getAllNeedItems).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockAnimal.needsList);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockNeedItemService.getAllNeedItems.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );

      await expect(
        controller.getAllNeedItems('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.getAllNeedItems).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });
  });

  describe('getOne', () => {
    it('deve retornar um item do needsList por ID', async () => {
      mockNeedItemService.getOne.mockResolvedValue(mockAnimal.needsList[0]);

      const result = await controller.getOne(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );

      expect(needItemService.getOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
      expect(result).toEqual(mockAnimal.needsList[0]);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockNeedItemService.getOne.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );

      await expect(
        controller.getOne(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.getOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
    });

    it('deve lançar NotFoundException se o item não for encontrado', async () => {
      mockNeedItemService.getOne.mockRejectedValue(
        new NotFoundException('Need item not found'),
      );

      await expect(
        controller.getOne('507f1f77bcf86cd799439011', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.getOne).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'invalid-id',
      );
    });
  });

  describe('updateNeedItem', () => {
    it('deve atualizar um item do needsList', async () => {
      const updatedItem = {
        image: mockUpdateNeedItemDto.image,
        name: mockUpdateNeedItemDto.name,
        price: mockUpdateNeedItemDto.price,
      };
      mockNeedItemService.updateNeedItem.mockResolvedValue(updatedItem);

      const result = await controller.updateNeedItem(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUpdateNeedItemDto,
      );

      expect(needItemService.updateNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUpdateNeedItemDto,
      );
      expect(result).toEqual(updatedItem);
    });

    it('deve lançar NotFoundException se o animal ou item não for encontrado', async () => {
      mockNeedItemService.updateNeedItem.mockRejectedValue(
        new NotFoundException('Animal or need item not found'),
      );

      await expect(
        controller.updateNeedItem(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
          mockUpdateNeedItemDto,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.updateNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        mockUpdateNeedItemDto,
      );
    });
  });

  describe('removeNeedItem', () => {
    it('deve remover um item do needsList', async () => {
      const removedItem = {
        image: mockAnimal.needsList[0].image,
        name: mockAnimal.needsList[0].name,
        price: mockAnimal.needsList[0].price,
      };
      mockNeedItemService.removeNeedItem.mockResolvedValue(removedItem);

      const result = await controller.removeNeedItem(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );

      expect(needItemService.removeNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
      expect(result).toEqual(removedItem);
    });

    it('deve lançar NotFoundException se o animal não for encontrado', async () => {
      mockNeedItemService.removeNeedItem.mockRejectedValue(
        new NotFoundException('Animal not found'),
      );

      await expect(
        controller.removeNeedItem(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439012',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.removeNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      );
    });

    it('deve lançar NotFoundException se o item não for encontrado', async () => {
      mockNeedItemService.removeNeedItem.mockRejectedValue(
        new NotFoundException('Need item not found'),
      );

      await expect(
        controller.removeNeedItem('507f1f77bcf86cd799439011', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
      expect(needItemService.removeNeedItem).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'invalid-id',
      );
    });
  });
});
