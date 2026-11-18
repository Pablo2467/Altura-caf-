import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  private nowInBogota(): string {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date());
  }

  async getBranches() {
    const now = this.nowInBogota();
    const branches = await this.prisma.branch.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
    });

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      phone: b.phone,
      imageUrl: b.imageUrl,
      openTime: b.openTime,
      closeTime: b.closeTime,
      isOpen: now >= b.openTime && now < b.closeTime,
    }));
  }

  async getMenu() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { available: true },
          orderBy: { id: 'asc' },
        },
      },
    });
  }
}