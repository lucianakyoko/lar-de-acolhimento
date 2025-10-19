/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateNeedItemDto } from './update-need-item.dto';

describe('UpdateNeedItemDto', () => {
  let dto: UpdateNeedItemDto;

  beforeEach(() => {
    dto = new UpdateNeedItemDto();
  });

  describe('DTO vazio ou parcial', () => {
    it('deve passar com DTO vazio', async () => {
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('deve passar com apenas alguns campos fornecidos', async () => {
      dto.image = 'item.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('image', () => {
    it('deve passar com uma string válida', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
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
    it('deve passar com uma string válida', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      dto.price = 59.99;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
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

      const transformed = plainToInstance(UpdateNeedItemDto, input);
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

      const transformed = plainToInstance(UpdateNeedItemDto, input);
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

      const transformed = plainToInstance(UpdateNeedItemDto, input);
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

      const transformed = plainToInstance(UpdateNeedItemDto, input);
      const errors = await validate(transformed);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty(
        'isNumber',
        'price must be a number conforming to the specified constraints',
      );
    });

    it('deve passar se price for omitido', async () => {
      dto.image = 'item.jpg';
      dto.name = 'Ração';
      // price não é definido

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
