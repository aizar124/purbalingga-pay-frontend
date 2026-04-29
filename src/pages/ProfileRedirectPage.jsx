import { useEffect } from 'react';
import { redirectToSsoDashboard } from '../auth/ssoAuth';
import { getStoredSsoAccessToken } from '../auth/authStorage';

export default function ProfileRedirectPage() {
  useEffect(() => {
    redirectToSsoDashboard(getStoredSsoAccessToken() || '');
  }, []);

  return (
    <div className="auth-page">
      <section className="auth-panel card">
        <p className="eyebrow">Profil</p>
        <h1>Mengalihkan ke dashboard SSO</h1>
        <p className="muted">Profil akun dikelola di Purbalingga SSO.</p>
      </section>
    </div>
  );
}
