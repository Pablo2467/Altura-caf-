import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(60)
  name?: string;

  @IsOptional() @IsEmail() @MaxLength(120)
  email?: string;

  @IsOptional() @IsEnum(Role)
  role?: Role;

  @IsOptional() @IsBoolean()
  active?: boolean;
}