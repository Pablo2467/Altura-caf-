import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const TABS = [
  { to: '/admin', key: 'dashboard', icon: '📊', end: true },
  { to: '/admin/products', key: 'products', icon: '☕', end: false },
  { to: '/admin/staff', key: 'staff', icon: '👥', end: false },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                isActive ? 'bg-caramelo text-zinc-950' : 'bg-white/10 text-zinc-300 hover:bg-white/15'
              }`
            }
          >
            {tab.icon} {t(`admin.nav.${tab.key}`)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}