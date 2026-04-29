import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { exchangeSsoCodeForTokens, validateSsoState } from '../auth/ssoAuth';

export default function SsoCallbackPage() {
  const navigate = useNavigate();
  const { loginWithSsoToken } = useAuth();
  const [message, setMessage] = useState('Memproses login SSO...');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function completeLogin() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const returnedState = params.get('state');
      const errorParam = params.get('error');

      if (errorParam) {
        throw new Error(params.get('error_description') || 'Login SSO dibatalkan.');
      }

      if (!code) {
        throw new Error('Kode autentikasi SSO tidak ditemukan.');
      }

      validateSsoState(returnedState);

      setMessage('Menukar kode SSO...');
      const ssoTokens = await exchangeSsoCodeForTokens(code);

      if (cancelled) {
        return;
      }

      setMessage('Menyiapkan sesi Pay...');
      const response = await loginWithSsoToken(ssoTokens.access_token, ssoTokens.refresh_token);

      if (cancelled) {
        return;
      }

      if (response.user) {
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Sesi Pay gagal dibuat.');
      }
    }

    completeLogin().catch((err) => {
      if (!cancelled) {
        setError(err?.message || 'Login SSO gagal.');
        setMessage('');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loginWithSsoToken, navigate]);

  return (
    <div className="auth-page">
      <section className="auth-panel card">
        <p className="eyebrow">SSO Callback</p>
        <h1>{error ? 'Login gagal' : 'Sedang masuk...'}</h1>
        {error ? <p className="negative">{error}</p> : <p className="muted">{message}</p>}
        {error ? (
          <button className="primary-btn wide" type="button" onClick={() => navigate('/login', { replace: true })}>
            Kembali ke Login
          </button>
        ) : null}
      </section>
    </div>
  );
}
