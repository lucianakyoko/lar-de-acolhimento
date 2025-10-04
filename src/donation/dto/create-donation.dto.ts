import {
  IsMongoId,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class DonatedItemDto {
  @IsMongoId()
  itemId: string;

  @IsNumber()
  quantity: number;
}

export class CreateDonationDto {
  @IsOptional()
  @IsString()
  donorName?: string;

  @IsMongoId()
  animalId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DonatedItemDto)
  donatedItems: DonatedItemDto[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const clean = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
      return parseFloat(clean);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  })
  @IsNumber()
  extraAmount?: number;
}
