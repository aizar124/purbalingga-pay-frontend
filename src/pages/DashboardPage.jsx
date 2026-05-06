import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import { dashboardApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import StatCard from '../components/StatCard';
import StatusList from '../components/StatusList';
import CardList from '../components/CardList';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuth();
  const [dashboard, setDashboard] = useState({
    user: { name: 'Pengguna Purbalingga', role: 'Warga', balance: 0 },
    cards: [],
    transactions: [],
    vouchers: [],
    stats: {
      cards_active: 0,
      transactions_today: 0,
      vouchers_available: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await dashboardApi(token);
      setDashboard(response);
      if (response.user) {
        updateUser(response.user);
      }
    } catch (err) {
      setError(err?.message || 'Gagal memuat dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setDashboard((current) => ({
      ...current,
      user: {
        ...current.user,
        name: user.name ?? current.user.name,
        role: user.role ?? current.user.role,
        balance: user.balance ?? current.user.balance,
        status: user.status ?? current.user.status,
        email: user.email ?? current.user.email,
        phone: user.phone ?? current.user.phone,
        avatarUrl: user.avatarUrl ?? current.user.avatarUrl,
      },
    }));
  }, [user]);

  if (loading) {
    return (
      <AppShell title="Dashboard" subtitle="Ringkasan saldo, kartu, dan aktivitas terbaru." showPageHead={false}>
        <section className="card section-card">
          <p className="eyebrow">Memuat dashboard</p>
          <h1 className="dashboard-title">Menyiapkan data akun</h1>
          <p className="muted">Sedang mengambil data terbaru dari backend.</p>
        </section>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard" subtitle="Ringkasan saldo, kartu, dan aktivitas terbaru." showPageHead={false}>
        <section className="card section-card">
          <p className="negative">{error}</p>
          <button className="primary-btn" type="button" onClick={loadDashboard}>
            Coba lagi
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Ringkasan saldo, kartu, dan aktivitas terbaru."
      showPageHead={false}
    >
      <section className="card section-card dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Dashboard</p>
          <h1 className="dashboard-title">Saldo Utama</h1>
          <h2 className="dashboard-balance">{formatCurrency(dashboard.user.balance ?? 0)}</h2>
          <p className="muted">Akses cepat untuk pembayaran daerah, QRIS, dan NFC.</p>
          <div className="info-chips">
            <span className="info-chip">Akun aktif</span>
            <span className="info-chip">{dashboard.cards.length} kartu</span>
            <span className="info-chip">{dashboard.transactions.length} transaksi</span>
          </div>
        </div>

        <div className="dashboard-hero-side">
          <div className="balance-visual">
            <div className="balance-ring" />
            <div className="balance-meta">
              <span className="balance-label">Status akun</span>
              <strong>{dashboard.user.status === 'active' ? 'Aktif' : 'Nonaktif'}</strong>
            </div>
          </div>
          <div className="hero-actions hero-actions-stack">
            <button className="primary-btn" type="button" onClick={() => navigate('/topup')}>
              Top Up
            </button>
            <button className="secondary-btn" type="button" onClick={() => navigate('/qr')}>
              Bayar
            </button>
          </div>
        </div>

        <div className="dashboard-actions-block">
          <div className="section-head">
            <h3>Aksi Cepat</h3>
            <span className="chip">1 tap</span>
          </div>
          <div className="quick-actions">
            <button className="quick-action primary" type="button" onClick={() => navigate('/topup')}>
              <span className="quick-icon">⬆️</span>
              <span>Top Up</span>
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/qr')}>
              <span className="quick-icon">💳</span>
              <span>Bayar</span>
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/qr')}>
              <span className="quick-icon">📱</span>
              <span>QR</span>
            </button>
            <button className="quick-action" type="button" onClick={() => navigate('/voucher')}>
              <span className="quick-icon">🏷️</span>
              <span>Voucher</span>
            </button>
          </div>
        </div>
      </section>

      <section className="grid stats-grid dashboard-stats">
        <StatCard
          label="Kartu aktif"
          value={dashboard.stats.cards_active}
          hint={`${dashboard.cards.filter((card) => card.rawStatus === 'locked').length} terkunci`}
        />
          <StatCard
            label="Transaksi hari ini"
            value={dashboard.stats.transactions_today}
            hint="Data terbaru dari backend"
          />
        <StatCard
          label="Voucher"
          value={dashboard.stats.vouchers_available}
          hint={`${dashboard.vouchers.length} promo tersedia`}
        />
      </section>

      <section className="card section-card topup-cta-card">
        <div>
          <p className="eyebrow">Top Up Saldo</p>
          <h3 className="cta-title">Isi saldo lewat simulasi gateway</h3>
          <p className="muted">Pilih nominal, lanjut ke instruksi pembayaran palsu, lalu uji status sukses atau gagal.</p>
        </div>
        <button className="primary-btn" type="button" onClick={() => navigate('/topup')}>
          Buka Top Up
        </button>
      </section>

      <section className="grid dashboard-split">
        <article className="card section-card">
          <div className="section-head">
            <h3>Kartu</h3>
            <span className="chip">Realtime</span>
          </div>
          <CardList
            items={dashboard.cards}
            className="list"
            itemClassName="list-row"
            itemAs="div"
            renderItem={(card) => (
              <>
                <div>
                  <div className="row-title">{card.label}</div>
                  <div className="muted">
                    {card.id} · {card.status}
                  </div>
                </div>
                <div className="row-meta">{card.balance}</div>
              </>
            )}
            emptyTitle="Belum ada kartu"
            emptyDescription="Daftar kartu akan tampil setelah akun terhubung."
          />
        </article>

        <article className="card section-card">
          <div className="section-head">
            <h3>Aktivitas Terbaru</h3>
            <span className="chip">Terbaru</span>
          </div>
          <StatusList items={dashboard.transactions} />
        </article>
      </section>
    </AppShell>
  );
}
