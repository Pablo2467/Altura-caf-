import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { homeByRole } from '../utils/roles';
import type { Role } from '../types';

export default function ProtectedRoute({ roles }: { roles: Role[] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeByRole[user.role]} replace />;

  return <Outlet />;
}