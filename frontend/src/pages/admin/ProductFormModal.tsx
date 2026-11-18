import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdminCategory, AdminProduct } from '../../types';

export interface ProductPayload {
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  categoryId: number;
  imageUrl: string;
  available: boolean;
}

interface Props {
  product: AdminProduct | null; 
  categories: AdminCategory[];
  saving: boolean;
  error: string | null;
  onSave: (data: ProductPayload) => void;
  onClose: () => void;
}

const inputCls =
  'w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-caramelo';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export default function ProductFormModal({ product, categories, saving, error, onSave, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.resolvedLanguage === 'en';

  const [form, setForm] = useState({
    nameEs: product?.nameEs ?? '',
    nameEn: product?.nameEn ?? '',
    descriptionEs: product?.descriptionEs ?? '',
    descriptionEn: product?.descriptionEn ?? '',
    price: product ? String(product.price) : '',
    categoryId: product ? String(product.categoryId) : String(categories[0]?.id ?? ''),
    imageUrl: product?.imageUrl ?? '',
    available: product?.available ?? true,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const texts = [form.nameEs, form.nameEn, form.descriptionEs, form.descriptionEn];
    if (texts.some((v) => !v.trim()) || !Number.isInteger(price) || price <= 0 || !form.categoryId) {
      setLocalError(t('admin.products.invalid'));
      return;
    }
    setLocalError(null);
    onSave({
      nameEs: form.nameEs.trim(),
      nameEn: form.nameEn.trim(),
      descriptionEs: form.descriptionEs.trim(),
      descriptionEn: form.descriptionEn.trim(),
      price,
      categoryId: Number(form.categoryId),
      imageUrl: form.imageUrl.trim(),
      available: form.available,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 p-6"
      >
        <h2 className="text-xl font-bold">
          {product ? t('admin.products.editTitle') : t('admin.products.newTitle')}
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.products.nameEs')}>
            <input className={inputCls} value={form.nameEs} onChange={(e) => set('nameEs', e.target.value)} />
          </Field>
          <Field label={t('admin.products.nameEn')}>
            <input className={inputCls} value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
          </Field>
        </div>

        <Field label={t('admin.products.descEs')}>
          <textarea
            rows={2}
            className={inputCls}
            value={form.descriptionEs}
            onChange={(e) => set('descriptionEs', e.target.value)}
          />
        </Field>
        <Field label={t('admin.products.descEn')}>
          <textarea
            rows={2}
            className={inputCls}
            value={form.descriptionEn}
            onChange={(e) => set('descriptionEn', e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('admin.products.price')}>
            <input
              type="number"
              min={1}
              step={100}
              inputMode="numeric"
              className={inputCls}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="8500"
            />
          </Field>
          <Field label={t('admin.products.category')}>
            <select className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isEn ? c.nameEn : c.nameEs}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t('admin.products.image')}>
          <input
            className={inputCls}
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://..."
          />
        </Field>

        <label className="flex items-center gap-3 text-sm text-zinc-200">
          <input
            type="checkbox"
            className="h-4 w-4 accent-amber-500"
            checked={form.available}
            onChange={(e) => set('available', e.target.checked)}
          />
          {t('admin.products.availableHelp')}
        </label>

        {(localError || error) && <p className="text-sm text-red-400">{localError ?? error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10"
          >
            {t('admin.products.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-caramelo px-6 py-2 text-sm font-bold text-zinc-950 hover:brightness-110 disabled:opacity-50"
          >
            {saving ? t('admin.products.saving') : t('admin.products.save')}
          </button>
        </div>
      </form>
    </div>
  );
}