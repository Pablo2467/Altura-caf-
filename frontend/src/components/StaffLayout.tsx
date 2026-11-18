import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import LanguageSwitcher from './LanguageSwitcher';

export default function StaffLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-caramelo">☕ {t('brand')}</span>
            {user && (
              <span className="hidden rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-zinc-200 sm:inline">
                {t(`roles.${user.role}`)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-400 md:inline">{user?.name}</span>
            <LanguageSwitcher dark />
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-zinc-200 hover:bg-white/10"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}