/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateDonationDto, DonatedItemDto } from './create-donation.dto';

describe('CreateDonationDto', () => {
  let dto: CreateDonationDto;

  const validMongoId = '507f1f77bcf86cd799439011';
  const validDonatedItem: DonatedItemDto = {
    itemId: validMongoId,
    quantity: 5,
  };

  beforeEach(() => {
    dto = new CreateDonationDto();
    dto.donorName = 'João';
    dto.animalId = validMongoId;
    dto.donatedItems = [validDonatedItem];
    dto.extraAmount = 100.5;
  });

  describe('validação bem-sucedida', () => {
    it('deve passar com todos os campos válidos', async () => {
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('deve passar sem donorName (opcional)', async () => {
      delete dto.donorName;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('deve passar sem extraAmount (opcional)', async () => {
      delete dto.extraAmount;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('deve passar com extraAmount como string numérica (ex.: "123,45")', async () => {
      dto.extraAmount = '123,45' as any;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
      expect(instance.extraAmount).toBe(123.45);
    });

    it('deve passar com extraAmount como string com formato monetário (ex.: "R$ 123.45")', async () => {
      dto.extraAmount = 'R$ 123.45' as any;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
      expect(instance.extraAmount).toBe(123.45);
    });
  });

  describe('validação de donorName', () => {
    it('deve falhar se donorName não for string', async () => {
      dto.donorName = 123 as any;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('donorName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('validação de animalId', () => {
    it('deve falhar se animalId não for fornecido', async () => {
      dto.animalId = undefined as any;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('animalId');
      expect(errors[0].constraints).toHaveProperty('isMongoId');
    });

    it('deve falhar se animalId não for um MongoID válido', async () => {
      dto.animalId = 'invalid-id';
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('animalId');
      expect(errors[0].constraints).toHaveProperty('isMongoId');
    });
  });

  describe('validação de donatedItems', () => {
    it('deve falhar se donatedItems não for um array', async () => {
      dto.donatedItems = 'not-an-array' as any;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('donatedItems');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('deve falhar se donatedItems for um array vazio', async () => {
      dto.donatedItems = [];
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('donatedItems');
      expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
    });

    it('deve falhar se itemId em donatedItems não for um MongoID válido', async () => {
      dto.donatedItems = [{ itemId: 'invalid-id', quantity: 5 }];
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('donatedItems');
      expect(errors[0].children).toBeDefined();
      expect(errors[0].children![0]).toBeDefined();
      expect(errors[0].children![0].property).toBe('0');
      expect(errors[0].children![0].children).toBeDefined();
      expect(errors[0].children![0].children![0]).toBeDefined();
      expect(errors[0].children![0].children![0].property).toBe('itemId');
      expect(errors[0].children![0].children![0].constraints).toHaveProperty(
        'isMongoId',
      );
    });

    it('deve falhar se quantity em donatedItems não for um número', async () => {
      dto.donatedItems = [{ itemId: validMongoId, quantity: 'invalid' as any }];
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('donatedItems');
      expect(errors[0].children).toBeDefined();
      expect(errors[0].children![0]).toBeDefined();
      expect(errors[0].children![0].property).toBe('0');
      expect(errors[0].children![0].children).toBeDefined();
      expect(errors[0].children![0].children![0]).toBeDefined();
      expect(errors[0].children![0].children![0].property).toBe('quantity');
      expect(errors[0].children![0].children![0].constraints).toHaveProperty(
        'isNumber',
      );
    });
  });

  describe('validação de extraAmount', () => {
    it('deve falhar se extraAmount não for um número ou string numérica', async () => {
      dto.extraAmount = 'not-a-number' as any;
      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('extraAmount');
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });
  });

  describe('validação de múltiplos erros', () => {
    it('deve detectar múltiplos erros em campos inválidos', async () => {
      dto.donorName = 123 as any;
      dto.animalId = 'invalid-id';
      dto.donatedItems = [{ itemId: 'invalid-id', quantity: 'invalid' as any }];
      dto.extraAmount = 'not-a-number' as any;

      const instance = plainToInstance(CreateDonationDto, dto);
      const errors = await validate(instance);
      expect(errors).toHaveLength(4);
      expect(errors.some((e) => e.property === 'donorName')).toBe(true);
      expect(errors.some((e) => e.property === 'animalId')).toBe(true);
      expect(errors.some((e) => e.property === 'donatedItems')).toBe(true);
      expect(errors.some((e) => e.property === 'extraAmount')).toBe(true);
    });
  });
});
