import { Navigate, Route, Routes } from 'react-router-dom';
import PublicMenu from './pages/public/PublicMenu';
import Login from './pages/Login';
import AdminHome from './pages/admin/AdminHome';
import WaiterHome from './pages/waiter/WaiterHome';
import BaristaHome from './pages/barista/BaristaHome';
import ProtectedRoute from './components/ProtectedRoute';
import StaffLayout from './components/StaffLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicMenu />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/admin" element={<AdminHome />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['WAITER']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/waiter" element={<WaiterHome />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['BARISTA']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/barista" element={<BaristaHome />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}