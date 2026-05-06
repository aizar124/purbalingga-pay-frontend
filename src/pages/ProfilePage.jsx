import AppShell from '../layouts/AppShell';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function ProfilePage() {
  const { user } = useAuth();
  const displayName = user?.name ?? 'Pengguna Purbalingga';
  const initials = displayName?.[0]?.toUpperCase() ?? 'U';

  return (
    <AppShell title="Profil" subtitle="Informasi akun dan pengaturan pribadi.">
      <article className="card section-card profile-card">
        <div className="profile-header">
          <div className="avatar large profile-avatar-large">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} /> : initials}
          </div>
          <div className="profile-copy">
            <p className="eyebrow">Akun saya</p>
            <h3>{displayName}</h3>
            <p className="muted">{user?.role ?? 'Warga'}</p>
          </div>
        </div>
        <div className="profile-grid profile-metrics">
          <div className="profile-metric">
            <span className="stat-label">Saldo</span>
            <div className="row-title">{formatCurrency(user?.balance ?? 0)}</div>
          </div>
          <div className="profile-metric">
            <span className="stat-label">Status</span>
            <div className="row-title">{user?.status === 'active' ? 'Aktif' : 'Nonaktif'}</div>
          </div>
          <div className="profile-metric">
            <span className="stat-label">Email</span>
            <div className="row-title">{user?.email ?? '-'}</div>
          </div>
          <div className="profile-metric">
            <span className="stat-label">Telepon</span>
            <div className="row-title">{user?.phone ?? '-'}</div>
          </div>
        </div>
      </article>
    </AppShell>
  );
}
