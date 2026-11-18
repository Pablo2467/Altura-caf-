import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiPost, ApiError } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { homeByRole } from '../utils/roles';
import type { LoginResponse } from '../types';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeByRole[user.role]} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>('/auth/login', { email, password });
      setSession(data.accessToken, data.user);
      navigate(homeByRole[data.user.role], { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 401 || err.status === 400)
          ? t('login.invalid')
          : t('login.serverError'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher dark />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-xl"
      >
        <div className="text-center">
          <div className="text-4xl">☕</div>
          <h1 className="mt-2 text-2xl font-bold text-caramelo">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t('login.subtitle')}</p>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">{t('login.email')}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 outline-none focus:border-caramelo"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">{t('login.password')}</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-2.5 outline-none focus:border-caramelo"
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-caramelo py-2.5 font-semibold text-zinc-900 transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </button>

        <Link to="/" className="block text-center text-sm text-zinc-400 hover:text-zinc-200">
          ← {t('login.back')}
        </Link>
      </form>
    </div>
  );
}