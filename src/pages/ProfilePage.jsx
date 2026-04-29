import AppShell from '../layouts/AppShell';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AppShell title="Profil" subtitle="Informasi akun dan pengaturan pribadi.">
      <article className="card section-card profile-card">
        <div className="avatar large">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt={user?.name || 'Profil'} /> : (user?.name?.[0]?.toUpperCase() ?? 'U')}
        </div>
        <div>
          <h3>{user?.name ?? 'Pengguna Purbalingga'}</h3>
          <p className="muted">{user?.role ?? 'Warga'}</p>
        </div>
        <div className="profile-grid">
          <div>
            <span className="stat-label">Saldo</span>
            <div className="row-title">{formatCurrency(user?.balance ?? 0)}</div>
          </div>
          <div>
            <span className="stat-label">Status</span>
            <div className="row-title">{user?.status === 'active' ? 'Aktif' : 'Nonaktif'}</div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
