/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateNeedItemDto {
  @IsOptional()
  @IsString({ message: 'Imagem deve ser uma string' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  name?: string;

  @IsOptional()
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
  price?: number;
}

export class UpdateAnimalDto {
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  name?: string;

  @IsOptional()
  @IsDate({ message: 'Data de nascimento deve ser uma data válida' })
  @Type(() => Date)
  birthDate?: Date;

  @IsOptional()
  @IsString({ message: 'Personalidade deve ser uma string' })
  personality?: string;

  @IsOptional()
  @IsEnum(['pequeno', 'medio', 'grande'], {
    message: 'Tamanho deve ser um dos valores: pequeno, medio ou grande',
  })
  size?: string;

  @IsOptional()
  @IsBoolean({ message: 'Vacinação deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    throw new Error('Vacinação deve ser true ou false');
  })
  vaccinated?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Castração deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    throw new Error('Castração deve ser true ou false');
  })
  neutered?: boolean;

  @IsOptional()
  @IsArray({ message: 'Lista de necessidades deve ser um array' })
  @ValidateNested({
    each: true,
    message: 'Cada item na lista de necessidades deve ser válido',
  })
  @Type(() => UpdateNeedItemDto)
  needsList?: UpdateNeedItemDto[];

  @IsOptional()
  @IsString({ message: 'Sobre deve ser uma string' })
  about?: string;

  @IsOptional()
  @IsBoolean({ message: 'Disponibilidade para adoção deve ser true ou false' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    throw new Error('Disponibilidade para adoção deve ser true ou false');
  })
  availableForAdoption?: boolean;

  @IsOptional()
  @IsArray({ message: 'Imagens deve ser um array' })
  @IsString({ each: true, message: 'Cada imagem deve ser uma string' })
  images?: string[];
}
