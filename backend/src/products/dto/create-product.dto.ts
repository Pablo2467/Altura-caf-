import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString() @IsNotEmpty() @MaxLength(80)
  nameEs: string;

  @IsString() @IsNotEmpty() @MaxLength(80)
  nameEn: string;

  @IsString() @IsNotEmpty() @MaxLength(300)
  descriptionEs: string;

  @IsString() @IsNotEmpty() @MaxLength(300)
  descriptionEn: string;

  @IsInt() @Min(1) @Max(10_000_000)
  price: number; 

  @IsInt()
  categoryId: number;

  @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @IsOptional() @IsBoolean()
  available?: boolean;
}