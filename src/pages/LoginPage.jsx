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
        <section className="auth-panel card auth-panel-loading">
          <p className="eyebrow">Memuat sesi</p>
          <h1>Menyiapkan login</h1>
          <p className="muted">Sedang memeriksa status akun.</p>
          <div className="auth-skeleton">
            <span />
            <span />
            <span />
          </div>
        </section>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <section className="auth-panel card auth-panel-login">
        <div className="auth-hero">
          <div className="auth-mark" aria-hidden="true">
            P
          </div>
          <div className="auth-copy">
            <p className="eyebrow">Purbalingga SSO</p>
            <h1>Mengarahkan ke halaman login SSO</h1>
            <p className="muted">Kamu akan masuk lewat Purbalingga SSO lalu kembali ke dashboard Pay.</p>
          </div>
        </div>
        <div className="auth-notes">
          <div className="auth-note">
            <strong>Langkah 1</strong>
            <span>Login dengan akun SSO resmi.</span>
          </div>
          <div className="auth-note">
            <strong>Langkah 2</strong>
            <span>Kembali otomatis ke aplikasi Pay.</span>
          </div>
        </div>
        <p className="stat-hint">Jika belum diarahkan otomatis, gunakan tombol di bawah.</p>
        <button className="primary-btn wide" type="button" onClick={() => redirectToSsoLogin()}>
          Masuk dengan SSO
        </button>
      </section>
    </div>
  );
}
