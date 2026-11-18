import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from '../../services/api';
import type { AdminCategory, AdminProduct } from '../../types';
import { formatMoney } from '../../utils/format';
import ProductFormModal from './ProductFormModal';
import type { ProductPayload } from './ProductFormModal';

export default function AdminProducts() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const isEn = lang === 'en';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<number | 'all'>('all');
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const products = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiGet<AdminProduct[]>('/admin/products'),
  });
  const categories = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiGet<AdminCategory[]>('/admin/categories'),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['menu'] });
  };

  const save = useMutation({
    mutationFn: (data: ProductPayload) =>
      editing && editing !== 'new'
        ? apiPatch(`/admin/products/${editing.id}`, data)
        : apiPost('/admin/products', data),
    onSuccess: () => {
      setEditing(null);
      setFormError(null);
      refresh();
    },
    onError: () => setFormError(t('admin.products.saveError')),
  });

  const toggle = useMutation({
    mutationFn: (p: AdminProduct) => apiPatch(`/admin/products/${p.id}`, { available: !p.available }),
    onSuccess: refresh,
    onError: () => setNotice(t('admin.products.saveError')),
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/products/${id}`),
    onSuccess: () => {
      setNotice(null);
      refresh();
    },
    onError: (err) =>
      setNotice(
        err instanceof ApiError && err.status === 409
          ? t('admin.products.deleteBlocked')
          : t('admin.products.deleteError'),
      ),
  });

  const list = products.data ?? [];
  const cats = categories.data ?? [];
  const nameOf = (p: AdminProduct) => (isEn ? p.nameEn : p.nameEs);
  const catName = (c: { nameEs: string; nameEn: string }) => (isEn ? c.nameEn : c.nameEs);

  const q = search.trim().toLowerCase();
  const shown = list.filter(
    (p) =>
      (cat === 'all' || p.categoryId === cat) &&
      (!q || p.nameEs.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q)),
  );
  const hiddenCount = list.filter((p) => !p.available).length;

  const askDelete = (p: AdminProduct) => {
    if (window.confirm(t('admin.products.confirmDelete', { name: nameOf(p) }))) remove.mutate(p.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.products.title')}</h1>
          <p className="text-zinc-400">
            {t('admin.products.summary', { total: list.length, hidden: hiddenCount })}
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setEditing('new');
          }}
          disabled={cats.length === 0}
          className="rounded-full bg-caramelo px-5 py-2 text-sm font-bold text-zinc-950 hover:brightness-110 disabled:opacity-50"
        >
          + {t('admin.products.new')}
        </button>
      </div>

      {/* Búsqueda y filtro por categoría */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.products.search')}
          className="w-full rounded-full border border-white/15 bg-zinc-900 px-5 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-caramelo"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCat('all')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
              cat === 'all' ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {t('all')}
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                cat === c.id ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'
              }`}
            >
              {catName(c)}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{notice}</p>
      )}
      {products.isError && <p className="text-red-400">{t('admin.products.loadError')}</p>}
      {products.isSuccess && shown.length === 0 && (
        <p className="text-zinc-500">{t('admin.products.empty')}</p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((p) => (
          <article
            key={p.id}
            className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4 transition ${
              p.available ? '' : 'opacity-60'
            }`}
          >
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
                ☕
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-100">{nameOf(p)}</p>
              <p className="text-xs text-zinc-500">{catName(p.category)}</p>
              <p className="font-bold text-caramelo">{formatMoney(p.price, lang)}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                role="switch"
                aria-checked={p.available}
                aria-label={t('admin.products.toggle')}
                onClick={() => toggle.mutate(p)}
                disabled={toggle.isPending && toggle.variables?.id === p.id}
                className={`relative h-6 w-11 rounded-full transition ${
                  p.available ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    p.available ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-[11px] text-zinc-500">
                {p.available ? t('admin.products.visible') : t('admin.products.hidden')}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFormError(null);
                    setEditing(p);
                  }}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-white/20"
                >
                  ✏️ {t('admin.products.edit')}
                </button>
                <button
                  onClick={() => askDelete(p)}
                  className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                >
                  🗑
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          categories={cats}
          saving={save.isPending}
          error={formError}
          onSave={(data) => save.mutate(data)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}