import 'dotenv/config';
import { OrderStatus, PaymentMethod, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const BOGOTA_OFFSET = 5 * HOUR; // Colombia = UTC-5
const DEMO = 'DEMO'; // marca en Order.notes para poder borrarlos después
const DAYS_BACK = 30;

const HOUR_WEIGHTS = [3, 6, 7, 5, 3, 3, 4, 5, 6, 6, 4, 3, 2, 1];
const METHODS = [
  PaymentMethod.CASH,
  PaymentMethod.CASH,
  PaymentMethod.CASH,
  PaymentMethod.CARD,
  PaymentMethod.CARD,
  PaymentMethod.TRANSFER,
];

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(2026);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;

function pickDistinct<T>(all: T[], n: number): T[] {
  const pool = [...all];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!);
  }
  return out;
}

function weightedHour(): number {
  const total = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < HOUR_WEIGHTS.length; i++) {
    r -= HOUR_WEIGHTS[i]!;
    if (r <= 0) return 7 + i;
  }
  return 7;
}

async function cleanDemo(): Promise<number> {
  const demo = await prisma.order.findMany({ where: { notes: DEMO }, select: { id: true } });
  const ids = demo.map((o) => o.id);
  if (ids.length === 0) return 0;
  await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { id: { in: ids } } }); // los items caen en cascada
  return ids.length;
}

async function generate() {
  const waiters = await prisma.user.findMany({
    where: { role: Role.WAITER, active: true, branchId: { not: null } },
  });
  if (waiters.length === 0) throw new Error('No hay meseros activos con sede asignada');
  const branchId = waiters[0]!.branchId!;

  const tables = await prisma.cafeTable.findMany({ where: { branchId } });
  const products = await prisma.product.findMany({ where: { available: true } });
  if (tables.length === 0 || products.length === 0) throw new Error('Faltan mesas o productos');

  const removed = await cleanDemo(); // evita duplicar si se ejecuta dos veces
  if (removed > 0) console.log(`🧹 ${removed} pedidos de ejemplo anteriores eliminados`);

  const now = new Date();
  const localNow = new Date(now.getTime() - BOGOTA_OFFSET);
  const todayLocal = Date.UTC(
    localNow.getUTCFullYear(),
    localNow.getUTCMonth(),
    localNow.getUTCDate(),
  );

  let created = 0;
  for (let back = DAYS_BACK - 1; back >= 0; back--) {
    const dayMs = todayLocal - back * DAY;
    const dow = new Date(dayMs).getUTCDay(); 
    const weekend = dow === 0 || dow === 6;
    const count = weekend ? 10 + Math.floor(rand() * 7) : 6 + Math.floor(rand() * 6);

    for (let n = 0; n < count; n++) {
      const hour = weightedHour();
      const minute = Math.floor(rand() * 60);
      const createdAt = new Date(dayMs + BOGOTA_OFFSET + hour * HOUR + minute * 60_000);
      const paidAt = new Date(createdAt.getTime() + (15 + Math.floor(rand() * 30)) * 60_000);
      if (paidAt > now) continue; 

      const lines = pickDistinct(products, 1 + Math.floor(rand() * 4)).map((p) => ({
        productId: p.id,
        quantity: 1 + Math.floor(rand() * 3),
        unitPrice: p.price,
      }));
      const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

      await prisma.order.create({
        data: {
          status: OrderStatus.PAID,
          notes: DEMO,
          tableId: pick(tables).id,
          branchId,
          waiterId: pick(waiters).id,
          createdAt,
          updatedAt: paidAt,
          items: { create: lines },
          payment: { create: { amount: total, method: pick(METHODS), createdAt: paidAt } },
        },
      });
      created++;
    }
  }
  console.log(`✅ ${created} pedidos de ejemplo creados (últimos ${DAYS_BACK} días)`);
}

async function main() {
  if (process.argv[2] === 'clean') {
    const n = await cleanDemo();
    console.log(`🧹 ${n} pedidos de ejemplo eliminados`);
  } else {
    await generate();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());