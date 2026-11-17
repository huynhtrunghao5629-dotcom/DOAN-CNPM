import PresenceTracker from './components/PresenceTracker';
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// ================================
// LAYOUTS
// ================================
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import { isAdminAuthenticated } from './services/adminAuth';

// ================================
// PAGES - DU KHÁCH
// ================================
// QR duy nhất mở ứng dụng từ camera điện thoại; không cần quét QR bên trong ứng dụng.
import Home from './pages/User/Home';
import MapPage from './pages/User/MapPage';
import POIDetail from './pages/User/POIDetail';

// ================================
// PAGES - ADMIN
// ================================
import Login from './pages/Auth/Login';
import Dashboard from './pages/Admin/Dashboard';
import AccessQR from './pages/Admin/AccessQR';
import POIManager from './pages/Admin/POIManager';

// ================================
// ADMIN ROUTE
// ================================
function AdminRoute({ children }) {
  const isAuthenticated = isAdminAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}

// ================================
// MAIN APP
// ================================
export default function App() {
  return (
    <Router>
      <PresenceTracker />
      <Routes>

        {/* =====================
            TRANG DU KHÁCH
        ===================== */}

        {/* Trang quét QR */}
        <Route
          path="/"
          element={
            <UserLayout>
              <Home />
            </UserLayout>
          }
        />

        <Route path="/destinations" element={<UserLayout><Home /></UserLayout>} />

        {/* Trang chủ */}
        <Route
          path="/home"
          element={
            <UserLayout>
              <Home />
            </UserLayout>
          }
        />

        {/* Bản đồ du lịch */}
        <Route
          path="/map"
          element={
            <UserLayout>
              <MapPage />
            </UserLayout>
          }
        />

        {/* Chi tiết địa điểm */}
        <Route
          path="/poi/:id"
          element={
            <UserLayout>
              <POIDetail />
            </UserLayout>
          }
        />

        {/* =====================
            TRANG QUẢN TRỊ
        ===================== */}

        {/* Đăng nhập */}
        <Route
          path="/admin/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        {/* QR truy cập giao diện du khách */}
        <Route
          path="/admin/qr"
          element={
            <AdminRoute>
              <AccessQR />
            </AdminRoute>
          }
        />

        {/* Quản lý địa điểm */}
        <Route
          path="/admin/pois"
          element={
            <AdminRoute>
              <POIManager />
            </AdminRoute>
          }
        />


        {/* =====================
            TRANG 404
        ===================== */}

        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: 24,
              }}
            >
              <h1>404 - Không tìm thấy trang</h1>
              <p>Đường dẫn bạn truy cập không tồn tại.</p>
              <a href="/home">Quay về trang chủ</a>
            </div>
          }
        />

      </Routes>
    </Router>
  );
}
