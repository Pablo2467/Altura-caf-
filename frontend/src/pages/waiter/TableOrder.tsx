import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiGet, apiPatch, apiPost } from '../../services/api';
import type { Category, OrderStatus, PaymentMethod, Product, TableOrderResponse } from '../../types';
import { formatMoney } from '../../utils/format';
import { TABLE_VISUALS, visualOfOrder } from '../../utils/tableStatus';

const STEPS = ['PENDING', 'PREPARING', 'READY', 'DELIVERED'] as const;
const METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER'];
const METHOD_ICON: Record<PaymentMethod, string> = { CASH: '💵', CARD: '💳', TRANSFER: '📲' };

function Progress({ status }: { status: OrderStatus }) {
  const { t } = useTranslation();
  const current = STEPS.findIndex((s) => s === status);
  return (
    <ol className="flex items-start gap-1.5">
      {STEPS.map((s, i) => {
        const v = TABLE_VISUALS[visualOfOrder(s)];
        const done = i <= current;
        return (
          <li key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className={`h-2 w-full rounded-full ${done ? v.bar : 'bg-white/10'}`} />
            <span className={`text-[11px] font-semibold ${done ? v.number : 'text-zinc-500'}`}>
              {t(`waiter.progress.${s}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function TableOrder() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const isEn = lang === 'en';
  const { tableId } = useParams();
  const id = Number(tableId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cartRef = useRef<HTMLElement>(null);

  const [cart, setCart] = useState<Record<number, { quantity: number; notes: string }>>({});
  const [activeCat, setActiveCat] = useState<number | 'all'>('all');
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const tableOrder = useQuery({
    queryKey: ['table-order', id],
    queryFn: () => apiGet<TableOrderResponse>(`/tables/${id}/order`),
    refetchInterval: 5000,
    enabled: Number.isInteger(id),
  });
  const menu = useQuery({
    queryKey: ['menu'],
    queryFn: () => apiGet<Category[]>('/public/menu'),
  });

  const order = tableOrder.data?.order ?? null;
  const table = tableOrder.data?.table;
  const total = tableOrder.data?.total ?? 0;
  const orderId = order?.id;

  const productsById = useMemo(() => {
    const map = new Map<number, Product>();
    menu.data?.forEach((c) => c.products.forEach((p) => map.set(p.id, p)));
    return map;
  }, [menu.data]);

  const nameOf = (p: Product) => (isEn ? p.nameEn : p.nameEs);

  // ---- carrito ----
  const add = (pid: number) =>
    setCart((c) => ({
      ...c,
      [pid]: { quantity: (c[pid]?.quantity ?? 0) + 1, notes: c[pid]?.notes ?? '' },
    }));

  const remove = (pid: number) =>
    setCart((c) => {
      const cur = c[pid];
      if (!cur) return c;
      if (cur.quantity <= 1) {
        const next = { ...c };
        delete next[pid];
        return next;
      }
      return { ...c, [pid]: { ...cur, quantity: cur.quantity - 1 } };
    });

  const setNote = (pid: number, notes: string) =>
    setCart((c) => (c[pid] ? { ...c, [pid]: { ...c[pid], notes } } : c));

  const cartLines = Object.entries(cart).flatMap(([pid, line]) => {
    const product = productsById.get(Number(pid));
    return product ? [{ product, ...line }] : [];
  });
  const cartCount = cartLines.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.quantity * l.product.price, 0);

  // ---- acciones ----
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['tables'] });
    qc.invalidateQueries({ queryKey: ['table-order', id] });
  };

  const send = useMutation({
    mutationFn: () =>
      apiPost('/orders', {
        tableId: id,
        items: cartLines.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          notes: l.notes.trim() || undefined,
        })),
      }),
    onSuccess: () => {
      setCart({});
      refresh();
    },
  });

  const deliver = useMutation({
    mutationFn: () => apiPatch(`/orders/${orderId}/deliver`),
    onSuccess: refresh,
  });

  const pay = useMutation({
    mutationFn: () => apiPost(`/orders/${orderId}/pay`, { method }),
    onSuccess: () => {
      refresh();
      navigate('/waiter');
    },
  });

  const hasError = send.isError || deliver.isError || pay.isError;

  // ---- estados de carga ----
  if (tableOrder.isLoading) return <p className="text-zinc-400">{t('loading')}</p>;
  if (tableOrder.isError || !table) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{t('waiter.notFound')}</p>
        <Link to="/waiter" className="text-caramelo hover:underline">
          ← {t('waiter.back')}
        </Link>
      </div>
    );
  }

  const kind = order ? visualOfOrder(order.status) : 'free';
  const vis = TABLE_VISUALS[kind];
  const categories = (menu.data ?? []).filter((c) => activeCat === 'all' || c.id === activeCat);

  return (
    <div className="pb-24 lg:pb-0">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to="/waiter"
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
        >
          ← {t('waiter.back')}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t('waiter.table', { number: String(table.number).padStart(2, '0') })}
          </h1>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${vis.badge}`}>
            {vis.icon} {t(`waiter.states.${kind}`)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        {/* ---------- Menú ---------- */}
        <section>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCat('all')}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                activeCat === 'all' ? 'bg-caramelo text-zinc-900' : 'bg-white/10 text-zinc-300'
              }`}
            >
              {t('all')}
            </button>
            {menu.data?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                  activeCat === c.id ? 'bg-caramelo text-zinc-900' : 'bg-white/10 text-zinc-300'
                }`}
              >
                {isEn ? c.nameEn : c.nameEs}
              </button>
            ))}
          </div>

          {categories.map((c) => (
            <div key={c.id} className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-caramelo">{isEn ? c.nameEn : c.nameEs}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.products.map((p) => {
                  const qty = cart[p.id]?.quantity ?? 0;
                  return (
                    <div
                      key={p.id}
                      className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                        qty > 0
                          ? 'border-caramelo/60 bg-caramelo/10'
                          : 'border-white/10 bg-zinc-900'
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold">{nameOf(p)}</h3>
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                          {isEn ? p.descriptionEn : p.descriptionEs}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-bold text-caramelo">{formatMoney(p.price, lang)}</span>
                        {qty === 0 ? (
                          <button
                            onClick={() => add(p.id)}
                            className="rounded-full bg-caramelo px-4 py-1.5 text-sm font-bold text-zinc-900 transition active:scale-95"
                          >
                            + {t('waiter.add')}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => remove(p.id)}
                              className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-bold">{qty}</span>
                            <button
                              onClick={() => add(p.id)}
                              className="h-9 w-9 rounded-full bg-caramelo text-lg font-bold text-zinc-900"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* ---------- Cuenta ---------- */}
        <aside ref={cartRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-3xl border border-white/10 bg-zinc-900 p-5">
            <h2 className="text-lg font-bold">🧾 {t('waiter.account')}</h2>

            {order && <Progress status={order.status} />}

            {/* Ya pedido */}
            {order && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {t('waiter.alreadyOrdered')}
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {order.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span>
                        {i.quantity}× {nameOf(i.product)}
                        {i.notes && <em className="block text-xs text-zinc-500">{i.notes}</em>}
                      </span>
                      <span className="text-zinc-300">
                        {formatMoney(i.quantity * i.unitPrice, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-bold">
                  <span>{t('waiter.total')}</span>
                  <span className="text-caramelo">{formatMoney(total, lang)}</span>
                </div>
              </div>
            )}

            {/* Nuevo pedido */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                {t('waiter.newOrder')}
              </h3>
              {cartLines.length === 0 ? (
                <p className="text-sm text-zinc-500">{t('waiter.emptyCart')}</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {cartLines.map((l) => (
                      <li key={l.product.id} className="rounded-2xl bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{nameOf(l.product)}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => remove(l.product.id)}
                              className="h-8 w-8 rounded-full bg-white/10 text-lg"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-bold">{l.quantity}</span>
                            <button
                              onClick={() => add(l.product.id)}
                              className="h-8 w-8 rounded-full bg-caramelo text-lg font-bold text-zinc-900"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <input
                          value={l.notes}
                          onChange={(e) => setNote(l.product.id, e.target.value)}
                          placeholder={t('waiter.notePlaceholder')}
                          className="mt-2 w-full rounded-lg bg-zinc-800 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-caramelo"
                        />
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => send.mutate()}
                    disabled={send.isPending}
                    className="mt-4 w-full rounded-2xl bg-caramelo py-3 font-bold text-zinc-900 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {send.isPending
                      ? t('waiter.sending')
                      : `📤 ${t('waiter.send')} · ${formatMoney(cartTotal, lang)}`}
                  </button>
                </>
              )}
            </div>

            {/* Acciones según el estado del pedido */}
            {(order?.status === 'PENDING' || order?.status === 'PREPARING') && (
              <p className="rounded-xl bg-sky-500/10 px-3 py-2 text-sm text-sky-300">
                ☕ {t('waiter.waitingKitchen')}
              </p>
            )}

            {order?.status === 'READY' && (
              <button
                onClick={() => deliver.mutate()}
                disabled={deliver.isPending}
                className="w-full animate-pulse rounded-2xl bg-fuchsia-500 py-3.5 text-lg font-bold text-white shadow-lg shadow-fuchsia-500/30 disabled:opacity-60"
              >
                🛎️ {deliver.isPending ? t('waiter.delivering') : t('waiter.deliver')}
              </button>
            )}

            {order?.status === 'DELIVERED' && (
              <div className="space-y-3 border-t border-white/10 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {t('waiter.payWith')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`rounded-2xl border-2 px-2 py-3 text-center text-xs font-bold transition ${
                        method === m
                          ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                          : 'border-white/10 text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="block text-xl">{METHOD_ICON[m]}</span>
                      {t(`waiter.methods.${m}`)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => pay.mutate()}
                  disabled={pay.isPending}
                  className="w-full rounded-2xl bg-emerald-500 py-3.5 text-lg font-bold text-zinc-950 transition hover:brightness-110 disabled:opacity-60"
                >
                  {pay.isPending
                    ? t('waiter.charging')
                    : `✅ ${t('waiter.charge', { amount: formatMoney(total, lang) })}`}
                </button>
              </div>
            )}

            {hasError && (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {t('waiter.actionError')}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Barra inferior solo en celular */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-900/95 p-3 backdrop-blur lg:hidden">
        <button
          onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex w-full items-center justify-between rounded-2xl bg-caramelo px-5 py-3 font-bold text-zinc-900"
        >
          <span>🧾 {t('waiter.viewOrder')}</span>
          {cartCount > 0 && (
            <span>
              {cartCount} · {formatMoney(cartTotal, lang)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}