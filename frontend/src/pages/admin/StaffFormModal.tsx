import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Role, StaffMember } from '../../types';
import { generatePassword } from '../../utils/password';

export interface StaffPayload {
  name: string;
  email: string;
  role: Role;
  password: string; 
}

interface Props {
  member: StaffMember | null; 
  isSelf: boolean;
  saving: boolean;
  error: string | null;
  onSave: (data: StaffPayload) => void;
  onClose: () => void;
}

const ROLES: Role[] = ['WAITER', 'BARISTA', 'ADMIN'];

const inputCls =
  'w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-caramelo disabled:opacity-50';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

export default function StaffFormModal({ member, isSelf, saving, error, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: member?.name ?? '',
    email: member?.email ?? '',
    role: (member?.role ?? 'WAITER') as Role,
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const emailOk = /^\S+@\S+\.\S+$/.test(form.email.trim());
    if (!form.name.trim() || !emailOk || (!member && form.password.length < 8)) {
      setLocalError(t('admin.staff.invalid'));
      return;
    }
    setLocalError(null);
    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      password: form.password,
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
        className="max-h-[92vh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900 p-6"
      >
        <h2 className="text-xl font-bold">
          {member ? t('admin.staff.editTitle') : t('admin.staff.newTitle')}
        </h2>

        <Field label={t('admin.staff.name')}>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label={t('admin.staff.email')}>
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>

        <Field label={t('admin.staff.role')}>
          <select
            className={inputCls}
            value={form.role}
            disabled={isSelf}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
          {isSelf && <p className="text-xs text-zinc-500">{t('admin.staff.roleLocked')}</p>}
        </Field>

        {!member && (
          <Field label={t('admin.staff.password')}>
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={t('admin.staff.passwordHint')}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, password: generatePassword() })}
                className="shrink-0 rounded-xl bg-white/10 px-3 text-sm font-semibold text-zinc-200 hover:bg-white/20"
              >
                🎲 {t('admin.staff.generate')}
              </button>
            </div>
          </Field>
        )}

        {(localError || error) && <p className="text-sm text-red-400">{localError ?? error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10"
          >
            {t('admin.staff.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-caramelo px-6 py-2 text-sm font-bold text-zinc-950 hover:brightness-110 disabled:opacity-50"
          >
            {saving ? t('admin.staff.saving') : t('admin.staff.save')}
          </button>
        </div>
      </form>
    </div>
  );
}