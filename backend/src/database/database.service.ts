import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const PAGE_SIZE = 15;

const TABLE_ORDER = [
  'Branch',
  'User',
  'CafeTable',
  'Category',
  'Product',
  'Order',
  'OrderItem',
  'Payment',
];

const HIDDEN_COLUMNS = new Set(['passwordHash']);

type ColumnKind = 'enum' | 'date' | 'boolean' | 'number' | 'text';

function kindOf(dataType: string): ColumnKind {
  if (dataType === 'USER-DEFINED') return 'enum';
  if (dataType.startsWith('timestamp')) return 'date';
  if (dataType === 'boolean') return 'boolean';
  if (['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision'].includes(dataType)) {
    return 'number';
  }
  return 'text';
}

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  private async tableNames(): Promise<string[]> {
    const rows = await this.prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT table_name AS name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name <> '_prisma_migrations'`,
    );
    const rank = (n: string) => {
      const i = TABLE_ORDER.indexOf(n);
      return i === -1 ? 999 : i;
    };
    return rows.map((r) => r.name).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  }

  private async countRows(table: string): Promise<number> {
    const rows = await this.prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM ${quote(table)}`,
    );
    return rows[0]?.count ?? 0;
  }

  async overview() {
    const names = await this.tableNames();
    const tables = await Promise.all(
      names.map(async (name) => ({ name, count: await this.countRows(name) })),
    );
    const meta = await this.prisma.$queryRawUnsafe<{ db: string; version: string }[]>(
      `SELECT current_database() AS db, current_setting('server_version') AS version`,
    );
    return {
      database: meta[0]?.db ?? '',
      version: meta[0]?.version ?? '',
      tables,
    };
  }

  private async columns(table: string) {
    const cols = await this.prisma.$queryRawUnsafe<
      { name: string; type: string; udtName: string; nullable: boolean }[]
    >(
      `SELECT column_name AS name,
              data_type AS type,
              udt_name AS "udtName",
              is_nullable = 'YES' AS nullable
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
      table,
    );

    const primary = await this.prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT kcu.column_name AS name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'`,
      table,
    );

    const foreign = await this.prisma.$queryRawUnsafe<
      { name: string; refTable: string; refColumn: string }[]
    >(
      `SELECT kcu.column_name AS name,
              ccu.table_name AS "refTable",
              ccu.column_name AS "refColumn"
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'`,
      table,
    );

    const pk = new Set(primary.map((p) => p.name));
    const fk = new Map(foreign.map((f) => [f.name, `${f.refTable}.${f.refColumn}`]));

    return cols.map((c) => ({
      name: c.name,
      type: c.type === 'USER-DEFINED' ? c.udtName : c.type.replace(' without time zone', ''),
      kind: kindOf(c.type),
      nullable: c.nullable,
      isPrimary: pk.has(c.name),
      references: fk.get(c.name) ?? null,
      hidden: HIDDEN_COLUMNS.has(c.name),
    }));
  }

  async table(name: string, page: number) {
    const names = await this.tableNames();
    if (!names.includes(name)) throw new NotFoundException('Tabla no encontrada');

    const columns = await this.columns(name);
    const total = await this.countRows(name);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(Math.max(1, page), pages);

    const raw = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM ${quote(name)} ORDER BY 1 DESC LIMIT $1 OFFSET $2`,
      PAGE_SIZE,
      (current - 1) * PAGE_SIZE,
    );

    const rows = raw.map((row) => {
      const safe: Record<string, unknown> = { ...row };
      for (const col of HIDDEN_COLUMNS) if (col in safe) safe[col] = null;
      return safe;
    });

    return { name, columns, rows, total, page: current, pages, pageSize: PAGE_SIZE };
  }
}