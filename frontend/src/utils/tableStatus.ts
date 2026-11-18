import type { OrderStatus, TableSummary } from '../types';

export type TableVisual = 'free' | 'pending' | 'preparing' | 'ready' | 'served';

export const VISUAL_ORDER: TableVisual[] = ['free', 'pending', 'preparing', 'ready', 'served'];

interface VisualStyle {
  icon: string;
  card: string;
  badge: string;
  number: string;
  bar: string;
  chipOn: string;
  chipOff: string;
}

export const TABLE_VISUALS: Record<TableVisual, VisualStyle> = {
  free: {
    icon: '🪑',
    card: 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
    number: 'text-emerald-300',
    bar: 'bg-emerald-400',
    chipOn: 'bg-emerald-500 text-zinc-950',
    chipOff: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25',
  },
  pending: {
    icon: '🕒',
    card: 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
    number: 'text-amber-300',
    bar: 'bg-amber-400',
    chipOn: 'bg-amber-500 text-zinc-950',
    chipOff: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25',
  },
  preparing: {
    icon: '☕',
    card: 'border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20',
    badge: 'bg-sky-500/20 text-sky-300',
    number: 'text-sky-300',
    bar: 'bg-sky-400',
    chipOn: 'bg-sky-500 text-zinc-950',
    chipOff: 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25',
  },
  ready: {
    icon: '🛎️',
    card: 'border-fuchsia-400 bg-fuchsia-500/15 ring-2 ring-fuchsia-400/60 shadow-lg shadow-fuchsia-500/30 hover:bg-fuchsia-500/25',
    badge: 'bg-fuchsia-500 text-white',
    number: 'text-fuchsia-300',
    bar: 'bg-fuchsia-400',
    chipOn: 'bg-fuchsia-500 text-white',
    chipOff: 'bg-fuchsia-500/15 text-fuchsia-300 hover:bg-fuchsia-500/25',
  },
  served: {
    icon: '🍽️',
    card: 'border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20',
    badge: 'bg-rose-500/20 text-rose-300',
    number: 'text-rose-300',
    bar: 'bg-rose-400',
    chipOn: 'bg-rose-500 text-white',
    chipOff: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
  },
};

export function visualOfOrder(status: OrderStatus | null): TableVisual {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'PREPARING':
      return 'preparing';
    case 'READY':
      return 'ready';
    case 'DELIVERED':
      return 'served';
    default:
      return 'free';
  }
}

export function visualOf(table: TableSummary): TableVisual {
  if (table.status === 'AVAILABLE') return 'free';
  return table.orderStatus ? visualOfOrder(table.orderStatus) : 'pending';
}