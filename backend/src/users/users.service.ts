import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StaffUser } from '../orders/orders.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

const PUBLIC = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  branchId: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private branchOf(admin: StaffUser): number {
    if (!admin.branchId) throw new BadRequestException('El usuario no tiene sede asignada');
    return admin.branchId;
  }

  private rethrow(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    throw e;
  }

  private async findInBranch(id: number, admin: StaffUser) {
    const user = await this.prisma.user.findFirst({
      where: { id, branchId: this.branchOf(admin) },
      select: PUBLIC,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  list(admin: StaffUser) {
    return this.prisma.user.findMany({
      where: { branchId: this.branchOf(admin) },
      orderBy: [{ active: 'desc' }, { role: 'asc' }, { name: 'asc' }],
      select: PUBLIC,
    });
  }

  async create(dto: CreateUserDto, admin: StaffUser) {
    const branchId = this.branchOf(admin);
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          passwordHash: await hash(dto.password, 10),
          role: dto.role,
          branchId,
        },
        select: PUBLIC,
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async update(id: number, dto: UpdateUserDto, admin: StaffUser) {
    const target = await this.findInBranch(id, admin);

    const demotes = dto.role !== undefined && dto.role !== Role.ADMIN;
    if (target.id === admin.id && (dto.active === false || demotes)) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta ni cambiar tu propio rol',
      );
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          email: dto.email?.trim().toLowerCase(),
          role: dto.role,
          active: dto.active,
        },
        select: PUBLIC,
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async resetPassword(id: number, dto: ResetPasswordDto, admin: StaffUser) {
    await this.findInBranch(id, admin);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(dto.password, 10) },
    });
    return { ok: true };
  }
}