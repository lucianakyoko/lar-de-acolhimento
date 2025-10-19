/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schema/user.schema';

describe('UserService', () => {
  let userService: UserService;
  let userModel: Model<UserDocument>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'admin',
    password: 'hashedPassword',
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = 'admin123';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('deve verificar a existência do usuário admin e criar se necessário', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      const bcryptHashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashedPassword');

      await userService.onModuleInit();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(bcryptHashSpy).toHaveBeenCalledWith('admin123', 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        username: 'admin',
        password: 'hashedPassword',
      });
    });

    it('não deve criar um usuário admin se ele já existe', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await userService.onModuleInit();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('ensureAdminUser', () => {
    it('não deve criar um usuário admin se ele já existe', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);

      await (userService as any)['ensureAdminUser']();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('deve criar um usuário admin se ele não existe', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      const bcryptHashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(async () => 'hashedPassword');

      await (userService as any)['ensureAdminUser']();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(bcryptHashSpy).toHaveBeenCalledWith('admin123', 10);
      expect(mockUserModel.create).toHaveBeenCalledWith({
        username: 'admin',
        password: 'hashedPassword',
      });
    });

    it('deve logar erro e não criar usuário se ADMIN_PASSWORD não estiver definido', async () => {
      delete process.env.ADMIN_PASSWORD;
      mockUserModel.findOne.mockResolvedValue(null);
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await (userService as any)['ensureAdminUser']();

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro:_PASSWORD não está definido.',
      );
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('deve retornar o usuário admin se ele existir', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await userService.findByUsername('admin');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(result).toEqual(mockUser);
    });

    it('deve retornar null se o usuário não for admin', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await userService.findByUsername('admin');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(result).toBeNull();
    });
  });
});
