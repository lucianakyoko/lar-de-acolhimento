/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NeedItemDto } from './need-item.dto';

describe('NeedItemDto', () => {
  let dto: NeedItemDto;

  beforeEach(() => {
    dto = new NeedItemDto();
  });

  describe('image', () => {
    it('deve passar com uma string não vazia', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve falhar se image for vazia', async () => {
      dto.image = '';
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isNotEmpty',
        'image should not be empty',
      );
    });

    it('deve falhar se image não for string', async () => {
      dto.image = 123 as any;
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isString',
        'image must be a string',
      );
    });
  });

  describe('name', () => {
    it('deve passar com uma string não vazia', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve falhar se name for vazio', async () => {
      dto.image = 'item.jpg';
      dto.name = '';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isNotEmpty',
        'name should not be empty',
      );
    });

    it('deve falhar se name não for string', async () => {
      dto.image = 'item.jpg';
      dto.name = 123 as any;
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isString',
        'name must be a string',
      );
    });
  });

  describe('price', () => {
    it('deve passar com um número', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve transformar string de preço com vírgula em número', async () => {
      const input = {
        image: 'item.jpg',
        name: 'Ração',
        price: '59,99',
      };

      const transformed = plainToInstance(NeedItemDto, input);
      const errors = await validate(transformed);

      expect(errors.length).toBe(0);
      expect(transformed.price).toBe(59.99);
    });

    it('deve transformar string de preço com formato monetário em número', async () => {
      const input = {
        image: 'item.jpg',
        name: 'Ração',
        price: 'R$ 59,99',
      };

      const transformed = plainToInstance(NeedItemDto, input);
      const errors = await validate(transformed);

      expect(errors.length).toBe(0);
      expect(transformed.price).toBe(59.99);
    });

    it('deve transformar string de preço com apenas números e ponto em número', async () => {
      const input = {
        image: 'item.jpg',
        name: 'Ração',
        price: '59.99',
      };

      const transformed = plainToInstance(NeedItemDto, input);
      const errors = await validate(transformed);

      expect(errors.length).toBe(0);
      expect(transformed.price).toBe(59.99);
    });

    it('deve falhar se price for uma string inválida', async () => {
      const input = {
        image: 'item.jpg',
        name: 'Ração',
        price: 'invalid',
      };

      const transformed = plainToInstance(NeedItemDto, input);
      const errors = await validate(transformed);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isNumber',
        'price must be a number conforming to the specified constraints',
      );
    });

    it('deve falhar se price for vazio', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      dto.price = undefined as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isNumber',
        'price must be a number conforming to the specified constraints',
      );
    });
  });
});
