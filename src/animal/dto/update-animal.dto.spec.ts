/* eslint-disable @typescript-eslint/require-await */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateAnimalDto } from './update-animal.dto';

describe('UpdateAnimalDto', () => {
  let validDto: UpdateAnimalDto;

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

  it('deve validar DTO vazio', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('deve validar DTO com dados válidos', async () => {
    const dto = plainToInstance(UpdateAnimalDto, validDto);
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    if (dto.needsList) {
      expect(dto.needsList[1].price).toBe(25.5);
    }
  });

  it('deve falhar se name for fornecido mas não for string', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      name: 123,
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isString).toBe('Nome deve ser uma string');
  });

  it('deve falhar se birthDate for fornecido mas não for uma data válida', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      birthDate: 'not-a-date',
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isDate).toBe(
      'Data de nascimento deve ser uma data válida',
    );
  });

  it('deve falhar se personality for fornecido mas não for string', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      personality: 123,
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isString).toBe(
      'Personalidade deve ser uma string',
    );
  });

  it('deve falhar se size for fornecido mas for inválido', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
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
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      vaccinated: 'true',
      neutered: 'false',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.vaccinated).toBe(true);
    expect(dto.neutered).toBe(false);
  });

  it('deve falhar se vaccinated for fornecido mas não for booleano', async () => {
    expect(() => {
      plainToInstance(UpdateAnimalDto, {
        ...validDto,
        vaccinated: 'not-a-boolean',
      });
    }).toThrow('Vacinação deve ser true ou false');
  });

  it('deve aceitar needsList vazia ou undefined', async () => {
    const dto1 = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      needsList: [],
    });
    const dto2 = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      needsList: undefined,
    });

    const errors1 = await validate(dto1);
    const errors2 = await validate(dto2);

    expect(errors1.length).toBe(0);
    expect(errors2.length).toBe(0);
  });

  it('deve falhar se needsList contiver item inválido', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      needsList: [{ image: 123, name: 'Ração', price: 0 }],
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
      expect(nestedErrors[0].children[0].constraints?.isString).toBe(
        'Imagem deve ser uma string',
      );
    }
  });

  it('deve transformar price de string com formatação para número', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      needsList: [{ image: 'item.jpg', name: 'Ração', price: 'R$ 99,99' }],
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    if (dto.needsList) {
      expect(dto.needsList[0].price).toBe(99.99);
    }
  });

  it('deve falhar se price for fornecido mas não for número válido', async () => {
    expect(() => {
      plainToInstance(UpdateAnimalDto, {
        ...validDto,
        needsList: [
          { image: 'item.jpg', name: 'Ração', price: 'not-a-number' },
        ],
      });
    }).toThrow('Preço deve ser um número válido');
  });

  it('deve validar about como string se fornecido', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      about: 123,
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isString).toBe('Sobre deve ser uma string');
  });

  it('deve aceitar images como array vazio ou undefined', async () => {
    const dto1 = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      images: [],
    });
    const dto2 = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      images: undefined,
    });

    const errors1 = await validate(dto1);
    const errors2 = await validate(dto2);

    expect(errors1.length).toBe(0);
    expect(errors2.length).toBe(0);
  });

  it('deve falhar se images contiver não-strings', async () => {
    const dto = plainToInstance(UpdateAnimalDto, {
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
    const dto = plainToInstance(UpdateAnimalDto, {
      ...validDto,
      availableForAdoption: 'true',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
    expect(dto.availableForAdoption).toBe(true);
  });
});
