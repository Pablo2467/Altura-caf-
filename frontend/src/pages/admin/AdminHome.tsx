import { useState } from 'react';
import type { ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiGet } from '../../services/api';
import type { DashboardData, PaymentMethod, RangeKey } from '../../types';
import { formatDay, formatMoney } from '../../utils/format';
import { METHOD_ICON } from '../../utils/payment';
import BarChart from './BarChart';
import type { Bar } from './BarChart';
import SalesHistory from './SalesHistory';

const RANGES: RangeKey[] = ['today', '7d', '30d'];
const METHOD_BAR: Record<PaymentMethod, string> = {
  CASH: 'bg-emerald-400',
  CARD: 'bg-sky-400',
  TRANSFER: 'bg-violet-400',
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <h2 className="mb-4 font-bold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({
  icon,
  label,
  value,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">
        {icon} {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-zinc-100 sm:text-3xl">{value}</p>
      {children}
    </div>
  );
}

function Delta({ current, previous, range }: { current: number; previous: number; range: RangeKey }) {
  const { t } = useTranslation();
  if (previous <= 0) {
    return <p className="mt-1 text-xs text-zinc-500">{t('admin.dash.noPrevious')}</p>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <p className={`mt-1 text-xs font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%{' '}
      <span className="font-normal text-zinc-500">{t(`admin.dash.vsPrev.${range}`)}</span>
    </p>
  );
}

export default function AdminHome() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const isEn = lang === 'en';
  const [range, setRange] = useState<RangeKey>('today');

  const dash = useQuery({
    queryKey: ['admin-dashboard', range],
    queryFn: () => apiGet<DashboardData>(`/admin/reports/dashboard?range=${range}`),
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });
  const d = dash.data;

  let hourBars: Bar[] = [];
  let dayBars: Bar[] = [];
  if (d) {
    const withSales = d.byHour.filter((h) => h.orders > 0).map((h) => h.hour);
    const first = Math.min(7, ...withSales);
    const last = Math.max(20, ...withSales);
    hourBars = d.byHour
      .filter((h) => h.hour >= first && h.hour <= last)
      .map((h) => ({
        key: String(h.hour),
        label: `${h.hour}h`,
        value: h.revenue,
        tooltip: `${h.hour}:00 · ${formatMoney(h.revenue, lang)} · ${t('admin.dash.ordersCount', { count: h.orders })}`,
      }));
    dayBars = d.byDay.map((x) => ({
      key: x.date,
      label: `${x.date.slice(8, 10)}/${x.date.slice(5, 7)}`,
      value: x.revenue,
      tooltip: `${formatDay(x.date, lang)} · ${formatMoney(x.revenue, lang)} · ${t('admin.dash.ordersCount', { count: x.orders })}`,
    }));
  }

  const prevAvg = d && d.previous.orders > 0 ? d.previous.revenue / d.previous.orders : 0;
  const maxQty = d?.topProducts[0]?.quantity ?? 0;

  return (
    <div className="space-y-6">
      {/* Encabezado y selector de rango */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.dash.title')}</h1>
          <p className="text-zinc-400">{t('admin.dash.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                range === r ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300 hover:bg-white/15'
              }`}
            >
              {t(`admin.dash.ranges.${r}`)}
            </button>
          ))}
        </div>
      </div>

      {dash.isError && <p className="text-red-400">{t('admin.dash.loadError')}</p>}

      {d && (
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon="💰" label={t('admin.dash.kpi.revenue')} value={formatMoney(d.revenue, lang)}>
              <Delta current={d.revenue} previous={d.previous.revenue} range={range} />
            </Kpi>
            <Kpi icon="🧾" label={t('admin.dash.kpi.orders')} value={String(d.orders)}>
              <Delta current={d.orders} previous={d.previous.orders} range={range} />
            </Kpi>
            <Kpi icon="🎟️" label={t('admin.dash.kpi.avgTicket')} value={formatMoney(d.avgTicket, lang)}>
              <Delta current={d.avgTicket} previous={prevAvg} range={range} />
            </Kpi>
            <Kpi icon="☕" label={t('admin.dash.kpi.items')} value={String(d.itemsSold)} />
          </div>

          {/* Ventas por día (solo si el rango tiene más de un día) */}
          {range !== 'today' && (
            <Card title={t('admin.dash.byDay')}>
              <BarChart bars={dayBars} emptyText={t('admin.dash.noSales')} />
            </Card>
          )}

          {/* Ventas por hora */}
          <Card title={t('admin.dash.byHour')}>
            <BarChart bars={hourBars} emptyText={t('admin.dash.noSales')} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Métodos de pago */}
            <Card title={t('admin.dash.byMethod')}>
              <ul className="space-y-4">
                {d.byMethod.map((m) => {
                  const pct = d.revenue > 0 ? Math.round((m.amount / d.revenue) * 100) : 0;
                  return (
                    <li key={m.method}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-200">
                          {METHOD_ICON[m.method]} {t(`waiter.methods.${m.method}`)}
                        </span>
                        <span className="font-semibold text-zinc-100">
                          {formatMoney(m.amount, lang)}{' '}
                          <span className="font-normal text-zinc-500">· {pct}%</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full ${METHOD_BAR[m.method]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Productos más vendidos */}
            <Card title={t('admin.dash.topProducts')}>
              {d.topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">{t('admin.dash.noSales')}</p>
              ) : (
                <ol className="space-y-4">
                  {d.topProducts.map((p, i) => (
                    <li key={p.productId}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-zinc-200">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-caramelo">
                            {i + 1}
                          </span>
                          <span className="truncate">{isEn ? p.nameEn : p.nameEs}</span>
                        </span>
                        <span className="shrink-0 font-semibold text-zinc-100">
                          {t('admin.dash.units', { count: p.quantity })}{' '}
                          <span className="font-normal text-zinc-500">
                            · {formatMoney(p.revenue, lang)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-caramelo"
                          style={{ width: `${maxQty > 0 ? (p.quantity / maxQty) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}

      {/* El key reinicia la página y el pedido abierto al cambiar de rango */}
      <SalesHistory key={range} range={range} />
    </div>
  );
}