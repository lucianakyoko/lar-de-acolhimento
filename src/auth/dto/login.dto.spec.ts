/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  let loginDto: LoginDto;

  beforeEach(() => {
    loginDto = new LoginDto();
  });

  it('deve passar na validação com username e password válidos', async () => {
    loginDto.username = 'teste';
    loginDto.password = 'senha123';

    const errors = await validate(loginDto);

    expect(errors).toHaveLength(0);
  });

  it('deve falhar se o username estiver ausente', async () => {
    loginDto.password = 'senha123';

    const errors = await validate(loginDto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints).toHaveProperty(
      'isString',
      'username must be a string',
    );
  });

  it('deve falhar se o password estiver ausente', async () => {
    loginDto.username = 'teste';

    const errors = await validate(loginDto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty(
      'isString',
      'password must be a string',
    );
  });

  it('deve falhar se o username não for uma string', async () => {
    loginDto.username = 123 as any;
    loginDto.password = 'senha123';

    const errors = await validate(loginDto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('username');
    expect(errors[0].constraints).toHaveProperty(
      'isString',
      'username must be a string',
    );
  });

  it('deve falhar se o password não for uma string', async () => {
    loginDto.username = 'teste';
    loginDto.password = 123 as any;

    const errors = await validate(loginDto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty(
      'isString',
      'password must be a string',
    );
  });

  it('deve falhar se ambos username e password estiverem ausentes', async () => {
    const errors = await validate(loginDto);

    expect(errors).toHaveLength(2);
    expect(errors.some((error) => error.property === 'username')).toBe(true);
    expect(errors.some((error) => error.property === 'password')).toBe(true);
    expect(
      errors.find((error) => error.property === 'username')?.constraints,
    ).toHaveProperty('isString', 'username must be a string');
    expect(
      errors.find((error) => error.property === 'password')?.constraints,
    ).toHaveProperty('isString', 'password must be a string');
  });

  it('deve falhar se ambos username e password não forem strings', async () => {
    loginDto.username = null as any;
    loginDto.password = null as any;

    const errors = await validate(loginDto);

    expect(errors).toHaveLength(2);
    expect(errors.some((error) => error.property === 'username')).toBe(true);
    expect(errors.some((error) => error.property === 'password')).toBe(true);
    expect(
      errors.find((error) => error.property === 'username')?.constraints,
    ).toHaveProperty('isString', 'username must be a string');
    expect(
      errors.find((error) => error.property === 'password')?.constraints,
    ).toHaveProperty('isString', 'password must be a string');
  });
});
