import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty() @MaxLength(60)
  name: string;

  @IsEmail() @MaxLength(120)
  email: string;

  @IsString() @MinLength(8) @MaxLength(72) // 72 = límite de bcrypt
  password: string;

  @IsEnum(Role)
  role: Role;
}