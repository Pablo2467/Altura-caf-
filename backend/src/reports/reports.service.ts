import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StaffUser } from '../orders/orders.service.js';
import type { HistoryQueryDto, RangeKey } from './dto/report-query.dto.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const BOGOTA_OFFSET = 5 * HOUR;
const DAYS_IN: Record<RangeKey, number> = { today: 1, '7d': 7, '30d': 30 };

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private branchOf(user: StaffUser): number {
    if (!user.branchId) throw new BadRequestException('El usuario no tiene sede asignada');
    return user.branchId;
  }

  private window(range: RangeKey) {
    const days = DAYS_IN[range];
    const localNow = new Date(Date.now() - BOGOTA_OFFSET);
    const todayStart =
      Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()) +
      BOGOTA_OFFSET;
    const from = new Date(todayStart - (days - 1) * DAY);
    const to = new Date(todayStart + DAY); // exclusivo: mañana 00:00
    const prevFrom = new Date(from.getTime() - days * DAY); // periodo anterior, mismo tamaño
    return { days, from, to, prevFrom };
  }

  async dashboard(range: RangeKey, user: StaffUser) {
    const branchId = this.branchOf(user);
    const { days, from, to, prevFrom } = this.window(range);

    const [payments, prev] = await Promise.all([
      this.prisma.payment.findMany({
        where: { createdAt: { gte: from, lt: to }, order: { branchId } },
        select: {
          amount: true,
          method: true,
          createdAt: true,
          order: {
            select: {
              items: {
                select: {
                  quantity: true,
                  unitPrice: true,
                  productId: true,
                  product: { select: { nameEs: true, nameEn: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: { createdAt: { gte: prevFrom, lt: from }, order: { branchId } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    let revenue = 0;
    let itemsSold = 0;

    const methods = new Map<PaymentMethod, { amount: number; count: number }>();
    for (const m of Object.values(PaymentMethod)) methods.set(m, { amount: 0, count: 0 });

    const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0, revenue: 0 }));

    const byDay = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let i = 0; i < days; i++) {
      const date = new Date(from.getTime() - BOGOTA_OFFSET + i * DAY).toISOString().slice(0, 10);
      byDay.set(date, { date, orders: 0, revenue: 0 });
    }

    const products = new Map<
      number,
      { productId: number; nameEs: string; nameEn: string; quantity: number; revenue: number }
    >();

    for (const p of payments) {
      revenue += p.amount;

      const local = new Date(p.createdAt.getTime() - BOGOTA_OFFSET);
      const h = hours[local.getUTCHours()];
      if (h) {
        h.orders += 1;
        h.revenue += p.amount;
      }
      const d = byDay.get(local.toISOString().slice(0, 10));
      if (d) {
        d.orders += 1;
        d.revenue += p.amount;
      }
      const m = methods.get(p.method);
      if (m) {
        m.amount += p.amount;
        m.count += 1;
      }

      for (const it of p.order.items) {
        itemsSold += it.quantity;
        const row = products.get(it.productId) ?? {
          productId: it.productId,
          nameEs: it.product.nameEs,
          nameEn: it.product.nameEn,
          quantity: 0,
          revenue: 0,
        };
        row.quantity += it.quantity;
        row.revenue += it.quantity * it.unitPrice;
        products.set(it.productId, row);
      }
    }

    const orders = payments.length;
    return {
      range,
      revenue,
      orders,
      avgTicket: orders ? Math.round(revenue / orders) : 0,
      itemsSold,
      previous: { revenue: prev._sum.amount ?? 0, orders: prev._count._all },
      byMethod: [...methods].map(([method, v]) => ({ method, ...v })),
      topProducts: [...products.values()]
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .slice(0, 5),
      byHour: hours,
      byDay: [...byDay.values()],
    };
  }

  async history(q: HistoryQueryDto, user: StaffUser) {
    const branchId = this.branchOf(user);
    const { from, to } = this.window(q.range);
    const where = { createdAt: { gte: from, lt: to }, order: { branchId } };

    const [total, rows] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        select: {
          id: true,
          amount: true,
          method: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              table: { select: { number: true } },
              waiter: { select: { name: true } },
              items: {
                orderBy: { id: 'asc' },
                select: {
                  quantity: true,
                  unitPrice: true,
                  product: { select: { nameEs: true, nameEn: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      page: q.page,
      pageSize: q.pageSize,
      items: rows.map((r) => ({
        paymentId: r.id,
        orderId: r.order.id,
        paidAt: r.createdAt,
        amount: r.amount,
        method: r.method,
        tableNumber: r.order.table.number,
        waiter: r.order.waiter.name,
        items: r.order.items.map((i) => ({
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          nameEs: i.product.nameEs,
          nameEn: i.product.nameEn,
        })),
      })),
    };
  }
}