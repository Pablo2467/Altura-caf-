import { Navigate, Route, Routes } from "react-router-dom";
import PublicMenu from "./pages/public/PublicMenu";
import Login from "./pages/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminStaff from "./pages/admin/AdminStaff";
import WaiterHome from "./pages/waiter/WaiterHome";
import TableOrder from "./pages/waiter/TableOrder";
import BaristaHome from "./pages/barista/BaristaHome";
import ProtectedRoute from "./components/ProtectedRoute";
import StaffLayout from "./components/StaffLayout";
import AdminDatabase from "./pages/admin/AdminDatabase";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicMenu />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route element={<StaffLayout />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/staff" element={<AdminStaff />} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["WAITER"]} />}>
        <Route element={<StaffLayout />}>
          <Route path="/waiter" element={<WaiterHome />} />
          <Route path="/waiter/table/:tableId" element={<TableOrder />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["BARISTA"]} />}>
        <Route element={<StaffLayout />}>
          <Route path="/barista" element={<BaristaHome />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/admin/database" element={<AdminDatabase />} />
    </Routes>
  );
}