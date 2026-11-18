import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiGet } from '../../services/api';
import type { RangeKey, SalesHistoryResponse } from '../../types';
import { formatDateTime, formatMoney } from '../../utils/format';
import { METHOD_ICON } from '../../utils/payment';

const PAGE_SIZE = 10;

export default function SalesHistory({ range }: { range: RangeKey }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const isEn = lang === 'en';

  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | null>(null);

  const history = useQuery({
    queryKey: ['admin-sales-history', range, page],
    queryFn: () =>
      apiGet<SalesHistoryResponse>(
        `/admin/reports/orders?range=${range}&page=${page}&pageSize=${PAGE_SIZE}`,
      ),
    placeholderData: keepPreviousData,
  });

  const data = history.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">
        {t('admin.dash.history.title')}
        {data && <span className="ml-2 text-base font-normal text-zinc-500">· {data.total}</span>}
      </h2>

      {history.isError && <p className="text-red-400">{t('admin.dash.history.loadError')}</p>}
      {history.isSuccess && data && data.items.length === 0 && (
        <p className="text-zinc-500">{t('admin.dash.history.empty')}</p>
      )}

      <ul className="space-y-2">
        {data?.items.map((s) => {
          const isOpen = open === s.paymentId;
          return (
            <li
              key={s.paymentId}
              className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
            >
              <button
                onClick={() => setOpen(isOpen ? null : s.paymentId)}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-white/5"
              >
                <span className="w-14 font-bold text-caramelo">#{s.orderId}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-zinc-100">
                    {t('admin.dash.history.table', { number: s.tableNumber })}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {formatDateTime(s.paidAt, lang)} · {t('admin.dash.history.by', { name: s.waiter })}
                  </span>
                </span>
                <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-zinc-300">
                  {METHOD_ICON[s.method]} {t(`waiter.methods.${s.method}`)}
                </span>
                <span className="w-28 text-right font-bold text-zinc-100">
                  {formatMoney(s.amount, lang)}
                </span>
                <span className="text-xs text-zinc-500">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <ul className="space-y-1 border-t border-white/10 bg-black/20 px-4 py-3 text-sm">
                  {s.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-3 text-zinc-300">
                      <span>
                        {it.quantity}× {isEn ? it.nameEn : it.nameEs}
                      </span>
                      <span className="text-zinc-400">
                        {formatMoney(it.quantity * it.unitPrice, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-zinc-200 hover:bg-white/20 disabled:opacity-40"
          >
            ← {t('admin.dash.history.prev')}
          </button>
          <span className="text-sm text-zinc-500">
            {t('admin.dash.history.page', { page, pages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-zinc-200 hover:bg-white/20 disabled:opacity-40"
          >
            {t('admin.dash.history.next')} →
          </button>
        </div>
      )}
    </section>
  );
}