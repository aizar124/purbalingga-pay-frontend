import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { readTopupFlow, clearTopupFlow } from '../utils/topupFlow';

export default function TopUpSuccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const storedFlow = location.state ?? readTopupFlow();
  const [flow, setFlow] = useState(storedFlow);

  useEffect(() => {
    if (!flow?.transaction || flow.transaction.status !== 'success') {
      navigate('/topup', { replace: true });
      return;
    }

    setFlow(flow);
  }, [flow, navigate]);

  const nominal = Number(flow?.transaction?.nominal ?? flow?.amount ?? 0);
  const latestBalance = useMemo(() => {
    if (Number.isFinite(flow?.latestBalance)) {
      return flow.latestBalance;
    }

    return user?.balance ?? 0;
  }, [flow?.latestBalance, user?.balance]);

  useEffect(() => {
    return () => {
      clearTopupFlow();
    };
  }, []);

  if (!flow?.transaction || flow.transaction.status !== 'success') {
    return (
      <AppShell title="Top Up Sukses" subtitle="Memastikan data top up.">
        <section className="card section-card">
          <p className="muted">Menyiapkan halaman sukses...</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Top Up Sukses" subtitle="Saldo telah bertambah melalui simulasi gateway.">
      <section className="card section-card success-card">
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>
        <div className="success-copy">
          <p className="eyebrow">Berhasil</p>
          <h2 className="page-banner-title">Top up selesai</h2>
          <p className="muted">{formatCurrency(nominal)} berhasil ditambahkan ke saldo akun kamu.</p>
        </div>

        <div className="summary-stack success-summary">
          <div className="summary-row">
            <span>Nominal</span>
            <strong>{formatCurrency(nominal)}</strong>
          </div>
          <div className="summary-row">
            <span>Saldo terbaru</span>
            <strong>{formatCurrency(latestBalance)}</strong>
          </div>
          <div className="summary-row">
            <span>Reference Code</span>
            <strong>{flow.transaction.reference_code || flow.transaction.referenceCode || '-'}</strong>
          </div>
        </div>

        <div className="button-row">
          <button
            className="primary-btn"
            type="button"
            onClick={() => {
              clearTopupFlow();
              navigate('/dashboard');
            }}
          >
            Kembali ke Dashboard
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => navigate('/history')}
          >
            Lihat Riwayat
          </button>
        </div>
      </section>
    </AppShell>
  );
}
