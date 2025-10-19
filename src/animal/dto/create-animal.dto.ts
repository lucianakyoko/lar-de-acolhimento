/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class NeedItemDto {
  @IsNotEmpty({ message: 'Imagem não pode estar vazia' })
  @IsString({ message: 'Imagem deve ser uma string' })
  image: string;

  @IsNotEmpty({ message: 'Nome não pode estar vazio' })
  @IsString({ message: 'Nome deve ser uma string' })
  name: string;

  @IsNotEmpty({ message: 'Preço não pode estar vazio' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const clean = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
      const parsed = parseFloat(clean);
      if (isNaN(parsed)) {
        throw new Error('Preço deve ser um número válido');
      }
      return parsed;
    }
    return value;
  })
  @IsNumber({}, { message: 'Preço deve ser um número' })
  price: number;
}

export class CreateAnimalDto {
  @IsNotEmpty({ message: 'Nome não pode estar vazio' })
  @IsString({ message: 'Nome deve ser uma string' })
  name: string;

  @IsNotEmpty({ message: 'Data de nascimento não pode estar vazia' })
  @IsDate({ message: 'Data de nascimento deve ser uma data válida' })
  @Type(() => Date)
  birthDate: Date;

  @IsNotEmpty({ message: 'Personalidade não pode estar vazia' })
  @IsString({ message: 'Personalidade deve ser uma string' })
  personality: string;

  @IsNotEmpty({ message: 'Tamanho não pode estar vazio' })
  @IsEnum(['pequeno', 'medio', 'grande'], {
    message: 'Tamanho deve ser um dos valores: pequeno, medio ou grande',
  })
  size: string;

  @IsNotEmpty({ message: 'Vacinação não pode estar vazia' })
  @IsBoolean({ message: 'Vacinação deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    throw new Error('Vacinação deve ser true ou false');
  })
  vaccinated: boolean;

  @IsNotEmpty({ message: 'Castração não pode estar vazia' })
  @IsBoolean({ message: 'Castração deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    throw new Error('Castração deve ser true ou false');
  })
  neutered: boolean;

  @IsOptional()
  @IsArray({ message: 'Lista de necessidades deve ser um array' })
  @ValidateNested({
    each: true,
    message: 'Cada item na lista de necessidades deve ser válido',
  })
  @Type(() => NeedItemDto)
  needsList?: NeedItemDto[];

  @IsNotEmpty({ message: 'Sobre não pode estar vazio' })
  @IsString({ message: 'Sobre deve ser uma string' })
  about: string;

  @IsNotEmpty({ message: 'Disponibilidade para adoção não pode estar vazia' })
  @IsBoolean({ message: 'Disponibilidade para adoção deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    throw new Error('Disponibilidade para adoção deve ser true ou false');
  })
  availableForAdoption: boolean;

  @IsOptional()
  @IsArray({ message: 'Imagens deve ser um array' })
  @IsString({ each: true, message: 'Cada imagem deve ser uma string' })
  images?: string[];
}
