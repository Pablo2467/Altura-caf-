import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiGet, apiPatch } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { BaristaOrder, OrderStatus } from '../../types';
import { minutesSince } from '../../utils/format';
import { TABLE_VISUALS, visualOfOrder } from '../../utils/tableStatus';

type Column = Extract<OrderStatus, 'PENDING' | 'PREPARING' | 'READY'>;
type Action = 'start' | 'ready';

const COLUMNS: Column[] = ['PENDING', 'PREPARING', 'READY'];
const URGENT_MINUTES = 5; // un pedido esperando más de esto se marca en rojo

interface CardProps {
  order: BaristaOrder;
  isEn: boolean;
  busy: boolean;
  onAdvance: (id: number, action: Action) => void;
}

function OrderCard({ order, isEn, busy, onAdvance }: CardProps) {
  const { t } = useTranslation();
  const v = TABLE_VISUALS[visualOfOrder(order.status)];
  const min = minutesSince(order.updatedAt);
  const urgent = order.status === 'PENDING' && min >= URGENT_MINUTES;

  return (
    <article
      className={`rounded-2xl border-2 p-4 ${
        urgent ? 'border-red-500 bg-red-500/10 animate-pulse' : v.card.split(' hover:')[0]
      }`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-3xl font-extrabold leading-none ${v.number}`}>
            {t('barista.table', { number: String(order.table.number).padStart(2, '0') })}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {t('barista.waiter', { name: order.waiter.name })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            urgent ? 'bg-red-500 text-white' : v.badge
          }`}
        >
          ⏱ {t('barista.min', { min })}
        </span>
      </header>

      <ul className="mt-3 space-y-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-3 rounded-xl bg-black/20 px-3 py-2">
            <span className="text-xl font-extrabold text-caramelo">{item.quantity}×</span>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100">
                {isEn ? item.product.nameEn : item.product.nameEs}
              </p>
              {item.notes && <p className="text-sm italic text-amber-300">“{item.notes}”</p>}
            </div>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          📝 <span className="font-semibold">{t('barista.orderNote')}:</span> {order.notes}
        </p>
      )}

      {order.status === 'PENDING' && (
        <button
          disabled={busy}
          onClick={() => onAdvance(order.id, 'start')}
          className="mt-4 w-full rounded-xl bg-sky-500 py-3 font-bold text-zinc-950 transition hover:bg-sky-400 active:scale-[0.98] disabled:opacity-50"
        >
          ☕ {t('barista.start')}
        </button>
      )}
      {order.status === 'PREPARING' && (
        <button
          disabled={busy}
          onClick={() => onAdvance(order.id, 'ready')}
          className="mt-4 w-full rounded-xl bg-fuchsia-500 py-3 font-bold text-white transition hover:bg-fuchsia-400 active:scale-[0.98] disabled:opacity-50"
        >
          🛎️ {t('barista.markReady')}
        </button>
      )}
      {order.status === 'READY' && (
        <p className="mt-4 rounded-xl bg-fuchsia-500/15 py-2 text-center text-sm font-semibold text-fuchsia-300">
          {t('barista.waitingWaiter')}
        </p>
      )}
    </article>
  );
}

export default function BaristaHome() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.resolvedLanguage === 'en';
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const orders = useQuery({
    queryKey: ['barista-orders'],
    queryFn: () => apiGet<BaristaOrder[]>('/barista/orders'),
    refetchInterval: 4000,
  });

  const advance = useMutation({
    mutationFn: ({ id, action }: { id: number; action: Action }) =>
      apiPatch(`/barista/orders/${id}/${action}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['barista-orders'] }),
  });

  const list = orders.data ?? [];
  const byStatus = (s: Column) => list.filter((o) => o.status === s);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('barista.title')}</h1>
          <p className="text-zinc-400">
            {t('barista.hello', { name: user?.name })} · {t('barista.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {t('barista.live')}
          </span>
          <button
            onClick={() => orders.refetch()}
            className="rounded-full border border-white/15 px-3 py-1 font-semibold text-zinc-300 hover:bg-white/10"
          >
            ↻ {t('barista.refresh')}
          </button>
        </div>
      </div>

      {orders.isError && <p className="text-red-400">{t('barista.loadError')}</p>}
      {advance.isError && <p className="text-red-400">{t('barista.actionError')}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const v = TABLE_VISUALS[visualOfOrder(col)];
          const items = byStatus(col);
          return (
            <section key={col} className="space-y-3">
              <h2
                className={`flex items-center justify-between rounded-xl px-4 py-2 font-bold ${v.badge}`}
              >
                <span>
                  {v.icon} {t(`barista.columns.${col}`)}
                </span>
                <span className="rounded-full bg-black/25 px-2.5 text-sm">{items.length}</span>
              </h2>

              {orders.isSuccess && items.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-sm text-zinc-500">
                  {t('barista.empty')}
                </p>
              )}

              {items.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  isEn={isEn}
                  busy={advance.isPending && advance.variables?.id === o.id}
                  onAdvance={(id, action) => advance.mutate({ id, action })}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}