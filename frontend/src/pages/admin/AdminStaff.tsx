import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ApiError, apiGet, apiPatch, apiPost } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Role, StaffMember } from '../../types';
import StaffFormModal from './StaffFormModal';
import type { StaffPayload } from './StaffFormModal';
import PasswordModal from './PasswordModal';

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: 'bg-violet-500/20 text-violet-300',
  WAITER: 'bg-amber-500/20 text-amber-300',
  BARISTA: 'bg-sky-500/20 text-sky-300',
};
const ROLE_FILTERS: Role[] = ['ADMIN', 'WAITER', 'BARISTA'];

export default function AdminStaff() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [editing, setEditing] = useState<StaffMember | 'new' | null>(null);
  const [resetting, setResetting] = useState<StaffMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const users = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiGet<StaffMember[]>('/admin/users'),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const save = useMutation({
    mutationFn: (data: StaffPayload) =>
      editing && editing !== 'new'
        ? apiPatch(`/admin/users/${editing.id}`, { name: data.name, email: data.email, role: data.role })
        : apiPost('/admin/users', data),
    onSuccess: () => {
      setEditing(null);
      setFormError(null);
      refresh();
    },
    onError: (err) =>
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t('admin.staff.emailTaken')
          : t('admin.staff.saveError'),
      ),
  });

  const toggle = useMutation({
    mutationFn: (m: StaffMember) => apiPatch(`/admin/users/${m.id}`, { active: !m.active }),
    onSuccess: () => {
      setNotice(null);
      refresh();
    },
    onError: () => setNotice({ ok: false, text: t('admin.staff.actionError') }),
  });

  const reset = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      apiPatch(`/admin/users/${id}/password`, { password }),
    onSuccess: () => {
      setNotice({ ok: true, text: t('admin.staff.passwordUpdated', { name: resetting?.name }) });
      setResetting(null);
      setFormError(null);
    },
    onError: () => setFormError(t('admin.staff.saveError')),
  });

  const list = users.data ?? [];
  const inactiveCount = list.filter((u) => !u.active).length;

  const q = search.trim().toLowerCase();
  const shown = list.filter(
    (u) =>
      (role === 'all' || u.role === role) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );

  const askToggle = (m: StaffMember) => {
    // Al desactivar se pide confirmación; al reactivar no hace falta
    if (m.active && !window.confirm(t('admin.staff.confirmDeactivate', { name: m.name }))) return;
    toggle.mutate(m);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.staff.title')}</h1>
          <p className="text-zinc-400">
            {t('admin.staff.summary', { total: list.length, inactive: inactiveCount })}
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setEditing('new');
          }}
          className="rounded-full bg-caramelo px-5 py-2 text-sm font-bold text-zinc-950 hover:brightness-110"
        >
          + {t('admin.staff.new')}
        </button>
      </div>

      {/* Búsqueda y filtro por rol */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.staff.search')}
          className="w-full rounded-full border border-white/15 bg-zinc-900 px-5 py-2.5 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-caramelo"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setRole('all')}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
              role === 'all' ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'
            }`}
          >
            {t('all')} · {list.length}
          </button>
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                role === r ? 'bg-white text-zinc-900' : 'bg-white/10 text-zinc-300'
              }`}
            >
              {t(`roles.${r}`)} · {list.filter((u) => u.role === r).length}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            notice.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
          }`}
        >
          {notice.text}
        </p>
      )}
      {users.isError && <p className="text-red-400">{t('admin.staff.loadError')}</p>}
      {users.isSuccess && shown.length === 0 && (
        <p className="text-zinc-500">{t('admin.staff.empty')}</p>
      )}

      {/* Tarjetas */}
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((m) => {
          const isSelf = m.id === me?.id;
          return (
            <article
              key={m.id}
              className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900 p-4 transition ${
                m.active ? '' : 'opacity-60'
              }`}
            >
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl font-bold text-caramelo">
                {m.name.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold text-zinc-100">
                  <span className="truncate">{m.name}</span>
                  {isSelf && (
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                      {t('admin.staff.you')}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-500">{m.email}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_BADGE[m.role]}`}
                >
                  {t(`roles.${m.role}`)}
                </span>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  role="switch"
                  aria-checked={m.active}
                  aria-label={t('admin.staff.toggle')}
                  title={isSelf ? t('admin.staff.selfLocked') : undefined}
                  disabled={isSelf || (toggle.isPending && toggle.variables?.id === m.id)}
                  onClick={() => askToggle(m)}
                  className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed ${
                    m.active ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                      m.active ? 'left-5.5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-[11px] text-zinc-500">
                  {m.active ? t('admin.staff.active') : t('admin.staff.inactive')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormError(null);
                      setEditing(m);
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-white/20"
                  >
                    ✏️ {t('admin.staff.edit')}
                  </button>
                  <button
                    onClick={() => {
                      setFormError(null);
                      setNotice(null);
                      setResetting(m);
                    }}
                    title={t('admin.staff.resetPassword')}
                    aria-label={t('admin.staff.resetPassword')}
                    className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/25"
                  >
                    🔑
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <StaffFormModal
          member={editing === 'new' ? null : editing}
          isSelf={editing !== 'new' && editing.id === me?.id}
          saving={save.isPending}
          error={formError}
          onSave={(data) => save.mutate(data)}
          onClose={() => setEditing(null)}
        />
      )}
      {resetting && (
        <PasswordModal
          member={resetting}
          saving={reset.isPending}
          error={formError}
          onSave={(password) => reset.mutate({ id: resetting.id, password })}
          onClose={() => setResetting(null)}
        />
      )}
    </div>
  );
}