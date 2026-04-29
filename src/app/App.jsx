import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/DashboardPage';
import HistoryPage from '../pages/HistoryPage';
import LoginPage from '../pages/LoginPage';
import PaymentPage from '../pages/PaymentPage';
import QrNfcPage from '../pages/QrNfcPage';
import ProfileRedirectPage from '../pages/ProfileRedirectPage';
import SsoCallbackPage from '../pages/SsoCallbackPage';
import BarcodeTestPage from '../pages/BarcodeTestPage';
import VoucherPage from '../pages/VoucherPage';

function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <section className="auth-panel card">
          <p className="eyebrow">Memuat sesi</p>
          <h1>Menyiapkan halaman</h1>
          <p className="muted">Sedang memeriksa status login sebelum mengarahkan kamu.</p>
        </section>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/callback" element={<SsoCallbackPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr"
        element={
          <ProtectedRoute>
            <QrNfcPage />
          </ProtectedRoute>
        }
      />
      <Route path="/qr-test" element={<BarcodeTestPage />} />
      <Route path="/barcode-test" element={<BarcodeTestPage />} />
      <Route
        path="/voucher"
        element={
          <ProtectedRoute>
            <VoucherPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileRedirectPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
