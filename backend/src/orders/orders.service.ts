import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, TableStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';

const CLOSED = [OrderStatus.PAID, OrderStatus.CANCELLED];

export interface StaffUser {
  id: number;
  role: string;
  branchId: number | null;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private branchOf(user: StaffUser): number {
    if (!user.branchId) throw new BadRequestException('El usuario no tiene sede asignada');
    return user.branchId;
  }

  private totalOf(items: { quantity: number; unitPrice: number }[]) {
    return items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  }

  // Tablero de mesas de la sede, con el consumo acumulado
  async listTables(user: StaffUser) {
    const tables = await this.prisma.cafeTable.findMany({
      where: { branchId: this.branchOf(user) },
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: { status: { notIn: CLOSED } },
          include: { items: true },
          take: 1,
        },
      },
    });

    return tables.map((t) => {
      const order = t.orders[0];
      return {
        id: t.id,
        number: t.number,
        status: t.status,
        orderId: order?.id ?? null,
        orderStatus: order?.status ?? null,
        total: order ? this.totalOf(order.items) : 0,
        openedAt: order?.createdAt ?? null,
      };
    });
  }

  async getTableOrder(tableId: number, user: StaffUser) {
    const table = await this.prisma.cafeTable.findFirst({
      where: { id: tableId, branchId: this.branchOf(user) },
    });
    if (!table) throw new NotFoundException('Mesa no encontrada');

    const order = await this.prisma.order.findFirst({
      where: { tableId, status: { notIn: CLOSED } },
      include: { items: { include: { product: true }, orderBy: { id: 'asc' } } },
    });
    if (!order) return { table, order: null, total: 0 };

    return { table, order, total: this.totalOf(order.items) };
  }

  async createOrAppend(dto: CreateOrderDto, user: StaffUser) {
    const branchId = this.branchOf(user);

    const table = await this.prisma.cafeTable.findFirst({
      where: { id: dto.tableId, branchId },
    });
    if (!table) throw new NotFoundException('Mesa no encontrada');

    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, available: true },
    });
    if (products.length !== ids.length) {
      throw new BadRequestException('Algún producto no existe o no está disponible');
    }
    const priceOf = new Map(products.map((p) => [p.id, p.price]));

    const itemsData = dto.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: priceOf.get(i.productId)!, // precio guardado al momento del pedido
      notes: i.notes,
    }));

    return this.prisma.$transaction(async (tx) => {
      const open = await tx.order.findFirst({
        where: { tableId: table.id, status: { notIn: CLOSED } },
      });

      if (!open) {
        await tx.cafeTable.update({
          where: { id: table.id },
          data: { status: TableStatus.OCCUPIED },
        });
        return tx.order.create({
          data: {
            tableId: table.id,
            branchId,
            waiterId: user.id,
            notes: dto.notes,
            items: { create: itemsData },
          },
          include: { items: true },
        });
      }

      await tx.orderItem.createMany({
        data: itemsData.map((i) => ({ ...i, orderId: open.id })),
      });
      return tx.order.update({
        where: { id: open.id },
        data: { status: OrderStatus.PENDING }, // el barista debe verlo otra vez
        include: { items: true },
      });
    });
  }

  async deliver(orderId: number, user: StaffUser) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, branchId: this.branchOf(user) },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException('Solo se puede entregar un pedido que esté listo');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });
  }

  // Cobra, cierra el pedido y libera la mesa
  async pay(orderId: number, dto: PayOrderDto, user: StaffUser) {
    const branchId = this.branchOf(user);

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, branchId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status === OrderStatus.PAID) {
        throw new ConflictException('Este pedido ya fue pagado');
      }
      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException('Solo se cobra un pedido ya entregado');
      }

      const amount = this.totalOf(order.items);
      const payment = await tx.payment.create({
        data: { amount, method: dto.method, orderId },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID } });
      await tx.cafeTable.update({
        where: { id: order.tableId },
        data: { status: TableStatus.AVAILABLE },
      });
      return payment;
    });
  }
}