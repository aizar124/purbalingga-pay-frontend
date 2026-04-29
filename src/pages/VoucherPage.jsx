import { useEffect, useState } from 'react';
import AppShell from '../layouts/AppShell';
import { redeemVoucherApi, vouchersApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';
import CardList from '../components/CardList';

export default function VoucherPage() {
  const { token, updateUser } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [redeemingId, setRedeemingId] = useState('');

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await vouchersApi(token);
      setVouchers(response.vouchers || []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat voucher.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRedeem = async (voucher) => {
    setRedeemingId(voucher.id);
    setNotice('');
    try {
      const response = await redeemVoucherApi(voucher.id, token);
      if (response.user) {
        updateUser(response.user);
      }

      await loadVouchers();
      setNotice('Voucher berhasil diredeem.');
    } catch (err) {
      setNotice(err?.message || 'Redeem voucher gagal.');
    } finally {
      setRedeemingId('');
    }
  };

  if (loading) {
    return (
      <AppShell title="Voucher" subtitle="Promo, voucher NFC, dan kode redeem.">
        <section className="card section-card">
          <p className="muted">Memuat voucher...</p>
        </section>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Voucher" subtitle="Promo, voucher NFC, dan kode redeem.">
        <section className="card section-card">
          <p className="negative">{error}</p>
          <button className="primary-btn" type="button" onClick={loadVouchers}>
            Coba lagi
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Voucher" subtitle="Promo, voucher NFC, dan kode redeem.">
      <section className="card section-card page-banner">
        <div className="page-banner-copy">
          <p className="eyebrow">Voucher</p>
          <h2 className="page-banner-title">Promo yang siap dipakai</h2>
          <p className="muted">Lihat voucher aktif dan redeem dengan satu tombol.</p>
        </div>
        <div className="page-banner-meta">
          <span className="info-chip">Aktif: {vouchers.length}</span>
          <span className="info-chip">Redeem cepat</span>
        </div>
      </section>

      {notice ? (
        <section className="card section-card">
          <p className="stat-hint">{notice}</p>
        </section>
      ) : null}

      <CardList
        items={vouchers}
        className="grid dashboard-split"
        itemClassName="card section-card card-stack"
        itemAs="article"
        renderItem={(voucher) => (
          <>
            <div className="section-head">
              <h3>{voucher.title}</h3>
              <span className="chip">{voucher.status}</span>
            </div>
            <p className="muted">{voucher.desc}</p>
            <button
              className="primary-btn"
              type="button"
              onClick={() => handleRedeem(voucher)}
              disabled={redeemingId === voucher.id}
            >
              {redeemingId === voucher.id ? 'Memproses...' : 'Redeem'}
            </button>
          </>
        )}
        emptyTitle="Belum ada voucher"
        emptyDescription="Promo akan dimuat setelah integrasi backend aktif."
      />
    </AppShell>
  );
}
