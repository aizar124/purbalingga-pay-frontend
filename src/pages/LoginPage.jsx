import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { redirectToSsoLogin } from '../auth/ssoAuth';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    redirectToSsoLogin().catch(() => {
      // Kalau redirect otomatis gagal, halaman tetap tampil sebagai fallback.
    });
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="auth-page">
        <section className="auth-panel card">
          <p className="eyebrow">Memuat sesi</p>
          <h1>Menyiapkan login</h1>
          <p className="muted">Sedang memeriksa status akun.</p>
        </section>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <section className="auth-panel card">
        <div className="auth-copy">
          <p className="eyebrow">Purbalingga SSO</p>
          <h1>Mengarahkan ke halaman login SSO</h1>
          <p className="muted">Kamu akan masuk lewat Purbalingga SSO lalu kembali ke dashboard Pay.</p>
        </div>
        <p className="stat-hint">Jika belum diarahkan otomatis, gunakan tombol di bawah.</p>
        <button className="primary-btn wide" type="button" onClick={() => redirectToSsoLogin()}>
          Masuk dengan SSO
        </button>
      </section>
    </div>
  );
}
