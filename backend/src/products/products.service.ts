import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

const WITH_CATEGORY = {
  category: { select: { id: true, nameEs: true, nameEn: true } },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.product.findMany({
      orderBy: [{ categoryId: 'asc' }, { id: 'asc' }],
      include: WITH_CATEGORY,
    });
  }

  categories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameEs: true, nameEn: true, sortOrder: true },
    });
  }

  private async ensureCategory(id: number) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategory(dto.categoryId);
    const { imageUrl, ...rest } = dto;
    return this.prisma.product.create({
      data: { ...rest, imageUrl: imageUrl?.trim() || null },
      include: WITH_CATEGORY,
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Producto no encontrado');
    if (dto.categoryId !== undefined) await this.ensureCategory(dto.categoryId);

    const { imageUrl, ...rest } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() || null }),
      },
      include: WITH_CATEGORY,
    });
  }

  async remove(id: number) {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Producto no encontrado');

    const sold = await this.prisma.orderItem.count({ where: { productId: id } });
    if (sold > 0) {
      throw new ConflictException(
        'Este producto tiene ventas registradas. Ocúltalo en lugar de eliminarlo.',
      );
    }
    return this.prisma.product.delete({ where: { id } });
  }
}