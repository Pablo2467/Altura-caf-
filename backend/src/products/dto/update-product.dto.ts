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

export class UpdateProductDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  nameEs?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80)
  nameEn?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(300)
  descriptionEs?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(300)
  descriptionEn?: string;

  @IsOptional() @IsInt() @Min(1) @Max(10_000_000)
  price?: number;

  @IsOptional() @IsInt()
  categoryId?: number;

  @IsOptional() @IsString() @MaxLength(500)
  imageUrl?: string;

  @IsOptional() @IsBoolean()
  available?: boolean;
}