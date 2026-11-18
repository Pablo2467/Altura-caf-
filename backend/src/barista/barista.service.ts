import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StaffUser } from '../orders/orders.service.js';

const QUEUE = [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY];

@Injectable()
export class BaristaService {
  constructor(private prisma: PrismaService) {}

  private branchOf(user: StaffUser): number {
    if (!user.branchId) throw new BadRequestException('El usuario no tiene sede asignada');
    return user.branchId;
  }

  list(user: StaffUser) {
    return this.prisma.order.findMany({
      where: { branchId: this.branchOf(user), status: { in: QUEUE } },
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        table: { select: { number: true } },
        waiter: { select: { name: true } },
        items: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            quantity: true,
            notes: true,
            product: { select: { nameEs: true, nameEn: true } },
          },
        },
      },
    });
  }

  start(orderId: number, user: StaffUser) {
    return this.move(orderId, user, OrderStatus.PENDING, OrderStatus.PREPARING);
  }

  markReady(orderId: number, user: StaffUser) {
    return this.move(orderId, user, OrderStatus.PREPARING, OrderStatus.READY);
  }

  private async move(orderId: number, user: StaffUser, from: OrderStatus, to: OrderStatus) {
    const branchId = this.branchOf(user);

    const { count } = await this.prisma.order.updateMany({
      where: { id: orderId, branchId, status: from },
      data: { status: to },
    });

    if (count === 0) {
      const current = await this.prisma.order.findFirst({
        where: { id: orderId, branchId },
        select: { status: true },
      });
      if (!current) throw new NotFoundException('Pedido no encontrado');
      throw new ConflictException(
        `El pedido está en estado ${current.status}; no se puede pasar a ${to}`,
      );
    }

    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, updatedAt: true },
    });
  }
}