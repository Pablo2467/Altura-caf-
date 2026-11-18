import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiGet } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { TableSummary } from '../../types';
import { formatMoney, minutesSince } from '../../utils/format';
import { TABLE_VISUALS, VISUAL_ORDER, visualOf } from '../../utils/tableStatus';
import type { TableVisual } from '../../utils/tableStatus';

export default function WaiterHome() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<TableVisual | 'all'>('all');

  const tables = useQuery({
    queryKey: ['tables'],
    queryFn: () => apiGet<TableSummary[]>('/tables'),
    refetchInterval: 5000,
  });

  const list = tables.data ?? [];
  const counts: Record<TableVisual, number> = {
    free: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    served: 0,
  };
  list.forEach((tb) => counts[visualOf(tb)]++);
  const openTotal = list.reduce((sum, tb) => sum + tb.total, 0);
  const shown = list.filter((tb) => filter === 'all' || visualOf(tb) === filter);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('waiter.title')}</h1>
          <p className="text-zinc-400">
            {t('waiter.hello', { name: user?.name })} · {t('waiter.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {t('waiter.live')}
          </span>
          <button
            onClick={() => tables.refetch()}
            className="rounded-full border border-white/15 px-3 py-1 font-semibold text-zinc-300 hover:bg-white/10"
          >
            ↻ {t('waiter.refresh')}
          </button>
        </div>
      </div>

      {/* Aviso de pedidos listos */}
      {counts.ready > 0 && (
        <button
          onClick={() => setFilter('ready')}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-linear-to-r from-fuchsia-600 to-pink-500 px-5 py-4 text-left shadow-lg shadow-fuchsia-500/30 transition active:scale-[0.99]"
        >
          <span className="flex items-center gap-3 text-lg font-bold">
            <span className="animate-bounce text-2xl">🛎️</span>
            {t('waiter.readyBanner', { count: counts.ready })}
          </span>
          <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-bold">
            {t('waiter.seeReady')} →
          </span>
        </button>
      )}

      {/* Filtros (sirven también de leyenda) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
            filter === 'all' ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'
          }`}
        >
          {t('waiter.filterAll')} · {list.length}
        </button>
        {VISUAL_ORDER.map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              filter === k ? TABLE_VISUALS[k].chipOn : TABLE_VISUALS[k].chipOff
            }`}
          >
            {TABLE_VISUALS[k].icon} {t(`waiter.states.${k}`)} · {counts[k]}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        💰 {t('waiter.openAccounts')}:{' '}
        <span className="font-bold text-caramelo">{formatMoney(openTotal, lang)}</span>
      </p>

      {tables.isError && <p className="text-red-400">{t('waiter.loadError')}</p>}
      {tables.isSuccess && shown.length === 0 && (
        <p className="text-zinc-500">{t('waiter.noTables')}</p>
      )}

      {/* Mesas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((tb) => {
          const kind = visualOf(tb);
          const v = TABLE_VISUALS[kind];
          return (
            <button
              key={tb.id}
              onClick={() => navigate(`/waiter/table/${tb.id}`)}
              className={`flex flex-col items-center rounded-3xl border-2 p-4 text-center transition active:scale-95 ${v.card}`}
            >
              <span className="text-2xl">{v.icon}</span>
              <span className={`text-4xl font-extrabold leading-none ${v.number}`}>
                {String(tb.number).padStart(2, '0')}
              </span>
              <span
                className={`mt-2 rounded-full px-3 py-0.5 text-xs font-bold ${v.badge} ${
                  kind === 'ready' ? 'animate-pulse' : ''
                }`}
              >
                {t(`waiter.states.${kind}`)}
              </span>
              {tb.status === 'OCCUPIED' ? (
                <>
                  <span className="mt-2 text-sm font-semibold text-zinc-100">
                    {formatMoney(tb.total, lang)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    ⏱ {t('waiter.since', { min: minutesSince(tb.openedAt) })}
                  </span>
                </>
              ) : (
                <span className="mt-2 text-xs text-transparent">.</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}