import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiGet } from '../../services/api';
import type { DbColumn, DbOverview, DbTableData } from '../../types';

type View = 'data' | 'structure';

function Cell({ value, column, lang }: { value: unknown; column: DbColumn; lang?: string }) {
  if (column.hidden) return <span className="text-zinc-500">🔒 ••••••••</span>;
  if (value === null || value === undefined) {
    return <span className="italic text-zinc-600">NULL</span>;
  }
  if (column.kind === 'boolean') {
    return value ? (
      <span className="font-bold text-emerald-400">true</span>
    ) : (
      <span className="font-bold text-zinc-500">false</span>
    );
  }
  if (column.kind === 'enum') {
    return (
      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-300">
        {String(value)}
      </span>
    );
  }
  if (column.kind === 'date') {
    const d = new Date(String(value));
    return (
      <span className="text-zinc-400">
        {d.toLocaleString(lang === 'en' ? 'en-US' : 'es-CO', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </span>
    );
  }
  if (column.kind === 'number') {
    return <span className="tabular-nums text-amber-200">{String(value)}</span>;
  }
  const text = String(value);
  return <span title={text}>{text.length > 40 ? `${text.slice(0, 40)}…` : text}</span>;
}

export default function AdminDatabase() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;

  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>('data');

  const overview = useQuery({
    queryKey: ['admin-db'],
    queryFn: () => apiGet<DbOverview>('/admin/database'),
    refetchInterval: 5000,
  });

  const current = selected ?? overview.data?.tables[0]?.name ?? null;

  const data = useQuery({
    queryKey: ['admin-db', current, page],
    queryFn: () => apiGet<DbTableData>(`/admin/database/${current}?page=${page}`),
    enabled: current !== null,
    refetchInterval: 5000,
    placeholderData: keepPreviousData,
  });

  const choose = (name: string) => {
    setSelected(name);
    setPage(1);
  };

  const table = data.data && data.data.name === current ? data.data : null;
  const hasHidden = table?.columns.some((c) => c.hidden) ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('admin.db.title')}</h1>
        <p className="text-zinc-400">{t('admin.db.subtitle')}</p>
      </div>

      {overview.isError && <p className="text-red-400">{t('admin.db.loadError')}</p>}

      {overview.data && (
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/10 px-4 py-1.5">
            🐘 {t('admin.db.engine')}: <b>PostgreSQL {overview.data.version.split(' ')[0]}</b>
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5">
            🗄️ {t('admin.db.database')}: <b>{overview.data.database}</b>
          </span>
          <span className="rounded-full bg-white/10 px-4 py-1.5">
            📋 {t('admin.db.tables')}: <b>{overview.data.tables.length}</b>
          </span>
        </div>
      )}

      {/* Tablas */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {overview.data?.tables.map((tb) => (
          <button
            key={tb.name}
            onClick={() => choose(tb.name)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              current === tb.name
                ? 'bg-caramelo text-zinc-950'
                : 'bg-white/10 text-zinc-300 hover:bg-white/15'
            }`}
          >
            {tb.name} · {tb.count}
          </button>
        ))}
      </div>

      {/* Datos / Estructura */}
      <div className="flex gap-2">
        {(['data', 'structure'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1 text-sm font-semibold ${
              view === v ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {t(`admin.db.${v}`)}
          </button>
        ))}
      </div>

      {data.isError && <p className="text-red-400">{t('admin.db.loadError')}</p>}

      {table && view === 'data' && (
        <div className="space-y-3">
          <p className="overflow-x-auto rounded-xl bg-zinc-900 px-4 py-2 font-mono text-xs text-emerald-300">
            {t('admin.db.query')}: SELECT * FROM "{table.name}" ORDER BY id DESC LIMIT{' '}
            {table.pageSize} OFFSET {(table.page - 1) * table.pageSize};
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  {table.columns.map((c) => (
                    <th key={c.name} className="px-4 py-3 font-semibold">
                      {c.isPrimary && '🔑 '}
                      {c.references && '🔗 '}
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    {table.columns.map((c) => (
                      <td key={c.name} className="whitespace-nowrap px-4 py-2.5">
                        <Cell value={row[c.name]} column={c} lang={lang} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {table.rows.length === 0 && (
              <p className="px-4 py-6 text-center text-zinc-500">{t('admin.db.empty')}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-400">
            <span>{t('admin.db.records', { count: table.total })}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={table.page <= 1}
                className="rounded-full border border-white/15 px-4 py-1 font-semibold disabled:opacity-40"
              >
                ← {t('admin.db.prev')}
              </button>
              <span>{t('admin.db.page', { page: table.page, pages: table.pages })}</span>
              <button
                onClick={() => setPage((p) => Math.min(table.pages, p + 1))}
                disabled={table.page >= table.pages}
                className="rounded-full border border-white/15 px-4 py-1 font-semibold disabled:opacity-40"
              >
                {t('admin.db.next')} →
              </button>
            </div>
          </div>
          {hasHidden && <p className="text-xs text-zinc-500">{t('admin.db.hiddenNote')}</p>}
        </div>
      )}

      {table && view === 'structure' && (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-400">
              <tr>
                <th className="px-4 py-3">{t('admin.db.column')}</th>
                <th className="px-4 py-3">{t('admin.db.type')}</th>
                <th className="px-4 py-3">{t('admin.db.nullable')}</th>
                <th className="px-4 py-3">{t('admin.db.key')}</th>
              </tr>
            </thead>
            <tbody>
              {table.columns.map((c) => (
                <tr key={c.name} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2.5 font-semibold">{c.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-sky-300">{c.type}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{c.nullable ? '✓' : '—'}</td>
                  <td className="px-4 py-2.5">
                    {c.isPrimary && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                        🔑 {t('admin.db.primaryKey')}
                      </span>
                    )}
                    {c.references && (
                      <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-xs font-bold text-fuchsia-300">
                        🔗 {t('admin.db.foreignKey')} → {c.references}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}