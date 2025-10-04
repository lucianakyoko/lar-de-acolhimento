/* eslint-disable @typescript-eslint/require-await */
// src/animal/dto/create-animal.dto.spec.ts
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAnimalDto } from './create-animal.dto';

describe('CreateAnimalDto', () => {
  let validDto: CreateAnimalDto;

  beforeEach(() => {
    validDto = {
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
      images: ['foto1.jpg', 'foto2.jpg'],
    };
  });

  it('deve validar DTO com dados válidos', async () => {
    const dto = plainToInstance(CreateAnimalDto, validDto);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    if (dto.needsList) {
      expect(dto.needsList[1].price).toBe(25.5);
    }
  });

  it('deve falhar se name estiver vazio', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      name: '',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBe('Nome não pode estar vazio');
  });

  it('deve falhar se birthDate não for uma data válida', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      birthDate: 'not-a-date',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isDate).toBe(
      'Data de nascimento deve ser uma data válida',
    );
  });

  it('deve falhar se personality estiver vazio', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      personality: '',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'Personalidade não pode estar vazia',
    );
  });

  it('deve falhar se size for inválido', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      size: 'gigante',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isEnum).toContain(
      'Tamanho deve ser um dos valores',
    );
  });

  it('deve transformar vaccinated e neutered de string "true"/"false" para boolean', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      vaccinated: 'true',
      neutered: 'false',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.vaccinated).toBe(true);
    expect(dto.neutered).toBe(false);
  });

  it('deve falhar se vaccinated não for booleano', async () => {
    expect(() => {
      plainToInstance(CreateAnimalDto, {
        ...validDto,
        vaccinated: 'not-a-boolean',
      });
    }).toThrow('Vacinação deve ser true ou false');
  });

  it('deve aceitar needsList vazia ou undefined', async () => {
    const dto1 = plainToInstance(CreateAnimalDto, {
      ...validDto,
      needsList: [],
    });
    const dto2 = plainToInstance(CreateAnimalDto, {
      ...validDto,
      needsList: undefined,
    });

    const errors1 = await validate(dto1);
    const errors2 = await validate(dto2);

    expect(errors1.length).toBe(0);
    expect(errors2.length).toBe(0);
  });

  it('deve falhar se needsList contiver item inválido', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      needsList: [{ image: '', name: 'Ração', price: 0 }],
    });
    const errors = await validate(dto, {
      forbidNonWhitelisted: true,
      whitelist: true,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'needsList')).toBe(true);
    const nestedErrors = errors.find(
      (error) => error.property === 'needsList',
    )?.children;
    expect(nestedErrors).toBeDefined();
    expect(nestedErrors?.length).toBeGreaterThan(0);
    if (nestedErrors && nestedErrors[0] && nestedErrors[0].children) {
      expect(nestedErrors[0].children[0].constraints?.isNotEmpty).toBe(
        'Imagem não pode estar vazia',
      );
    }
  });

  it('deve transformar price de string com formatação para número', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      needsList: [{ image: 'item.jpg', name: 'Ração', price: 'R$ 99,99' }],
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    if (dto.needsList) {
      expect(dto.needsList[0].price).toBe(99.99);
    }
  });

  it('deve falhar se price não for número válido', async () => {
    expect(() => {
      plainToInstance(CreateAnimalDto, {
        ...validDto,
        needsList: [
          { image: 'item.jpg', name: 'Ração', price: 'not-a-number' },
        ],
      });
    }).toThrow('Preço deve ser um número válido');
  });

  it('deve validar about como string não vazia', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      about: '',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotEmpty).toBe(
      'Sobre não pode estar vazio',
    );
  });

  it('deve aceitar images como array vazio ou undefined', async () => {
    const dto1 = plainToInstance(CreateAnimalDto, {
      ...validDto,
      images: [],
    });
    const dto2 = plainToInstance(CreateAnimalDto, {
      ...validDto,
      images: undefined,
    });

    const errors1 = await validate(dto1);
    const errors2 = await validate(dto2);

    expect(errors1.length).toBe(0);
    expect(errors2.length).toBe(0);
  });

  it('deve falhar se images contiver não-strings', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      images: ['foto.jpg', 123],
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isString).toBe(
      'Cada imagem deve ser uma string',
    );
  });

  it('deve transformar availableForAdoption de string para boolean', async () => {
    const dto = plainToInstance(CreateAnimalDto, {
      ...validDto,
      availableForAdoption: 'true',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.availableForAdoption).toBe(true);
  });
});
