import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { StaffMember } from '../../types';
import { generatePassword } from '../../utils/password';

interface Props {
  member: StaffMember;
  saving: boolean;
  error: string | null;
  onSave: (password: string) => void;
  onClose: () => void;
}

export default function PasswordModal({ member, saving, error, onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setLocalError(t('admin.staff.passwordShort'));
      return;
    }
    setLocalError(null);
    onSave(password);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-zinc-900 p-6"
      >
        <h2 className="text-xl font-bold">{t('admin.staff.resetTitle', { name: member.name })}</h2>
        <p className="text-sm text-zinc-400">{t('admin.staff.resetHelp')}</p>

        <div className="flex gap-2">
          <input
            autoFocus
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('admin.staff.passwordHint')}
            className="w-full rounded-xl border border-white/15 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-caramelo"
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="shrink-0 rounded-xl bg-white/10 px-3 text-sm font-semibold text-zinc-200 hover:bg-white/20"
          >
            🎲 {t('admin.staff.generate')}
          </button>
        </div>

        {(localError || error) && <p className="text-sm text-red-400">{localError ?? error}</p>}

        <div className="flex justify-end gap-2">
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
            {saving ? t('admin.staff.saving') : t('admin.staff.resetSave')}
          </button>
        </div>
      </form>
    </div>
  );
}