import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getStoredSsoAccessToken } from '../auth/authStorage';
import { redirectToSsoDashboard, redirectToSsoLogout } from '../auth/ssoAuth';

export default function Topbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const goProfile = () => redirectToSsoDashboard(getStoredSsoAccessToken() || '');
  const goLogin = () => navigate('/login');

  return (
    <header className="topbar">
      <button className="brand brand-button" type="button" onClick={() => navigate('/dashboard')}>
        <div className="brand-mark">P</div>
        <div className="brand-copy">
          <div className="brand-title">Purbalingga Pay</div>
          <div className="brand-subtitle">React Frontend</div>
        </div>
      </button>

      <div className="topbar-actions">
        <button className="ghost-btn icon-btn" type="button" aria-label="Notifikasi">
          <span className="icon-badge" aria-hidden="true">🔔</span>
        </button>
        {isAuthenticated ? (
          <>
            <button className="profile-pill" type="button" onClick={goProfile}>
              <span className="profile-avatar">
                {user?.avatarUrl ? <img src={user.avatarUrl} alt={user?.name || 'Profil'} /> : (user?.name?.[0]?.toUpperCase() ?? 'U')}
              </span>
              <span className="profile-text">Profil</span>
            </button>
            <button
              className="ghost-btn"
              type="button"
              onClick={async () => {
                await logout();
                redirectToSsoLogout();
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <button className="primary-btn" type="button" onClick={goLogin}>
            Login
          </button>
        )}
      </div>
    </header>
  );
}
