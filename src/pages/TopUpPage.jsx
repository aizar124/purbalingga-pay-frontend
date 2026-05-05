import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import { createTransactionApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { readTopupFlow, saveTopupFlow } from '../utils/topupFlow';

const NOMINAL_OPTIONS = [10000, 25000, 50000, 100000];

const METHOD_OPTIONS = [
  {
    id: 'transfer_bank',
    label: 'Transfer Bank',
    hint: 'Instruksi rekening dummy',
  },
  {
    id: 'virtual_account',
    label: 'Virtual Account',
    hint: 'Nomor VA simulasi',
  },
  {
    id: 'qris',
    label: 'QRIS Top Up',
    hint: 'Scan QR dummy',
  },
];

export default function TopUpPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const storedFlow = location.state ?? readTopupFlow();
  const [amount, setAmount] = useState(String(storedFlow?.amount ?? NOMINAL_OPTIONS[0]));
  const [method, setMethod] = useState(storedFlow?.method ?? METHOD_OPTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (storedFlow?.amount) {
      setAmount(String(storedFlow.amount));
    }

    if (storedFlow?.method) {
      setMethod(storedFlow.method);
    }
  }, [storedFlow?.amount, storedFlow?.method]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Nominal top up harus lebih besar dari 0.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createTransactionApi(token, {
        type: 'topup',
        amount: numericAmount,
        title: 'Top up saldo',
        description: `Metode simulasi: ${METHOD_OPTIONS.find((item) => item.id === method)?.label || 'Transfer Bank'}`,
      });

      const flowPayload = {
        method,
        amount: numericAmount,
        transaction: response.transaction,
        startedAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      saveTopupFlow(flowPayload);
      navigate('/topup/gateway', { state: flowPayload });
    } catch (submitError) {
      setError(submitError?.message || 'Gagal membuat top up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Top Up" subtitle="Pilih nominal lalu lanjut ke simulasi gateway.">
      <section className="card section-card page-banner">
        <div className="page-banner-copy">
          <p className="eyebrow">Top Up</p>
          <h2 className="page-banner-title">Isi saldo untuk testing gateway</h2>
          <p className="muted">Semua metode di sini hanya simulasi. Saldo baru bertambah setelah pembayaran berhasil disimulasikan.</p>
        </div>
        <div className="page-banner-meta">
          <span className="info-chip">Simulasi</span>
          <span className="info-chip">{formatCurrency(Number(amount) || 0)}</span>
        </div>
      </section>

      <section className="grid topup-grid">
        <article className="card section-card topup-panel">
          <div className="section-head">
            <h3>Nominal Top Up</h3>
            <span className="chip">Rp</span>
          </div>

          <div className="amount-presets">
            {NOMINAL_OPTIONS.map((value) => (
              <button
                key={value}
                className={`amount-chip ${String(value) === amount ? 'active' : ''}`}
                type="button"
                onClick={() => setAmount(String(value))}
              >
                {formatCurrency(value)}
              </button>
            ))}
          </div>

          <label className="manual-amount">
            Nominal manual
            <input
              type="number"
              min="1"
              step="1000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Contoh: 75000"
            />
          </label>

          <form className="form topup-form" onSubmit={handleSubmit}>
            <div className="section-head topup-method-head">
              <h3>Metode Simulasi</h3>
              <span className="chip">Dummy</span>
            </div>

            <div className="method-grid">
              {METHOD_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={`method-card ${method === option.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => setMethod(option.id)}
                >
                  <span className="method-title">{option.label}</span>
                  <span className="muted">{option.hint}</span>
                </button>
              ))}
            </div>

            {error ? <p className="negative">{error}</p> : null}

            <button className="primary-btn wide" type="submit" disabled={loading}>
              {loading ? 'Membuat Top Up...' : 'Lanjutkan'}
            </button>
          </form>
        </article>

        <article className="card section-card topup-summary-card">
          <div className="section-head">
            <h3>Ringkasan</h3>
            <span className="chip">Preview</span>
          </div>

          <div className="summary-stack">
            <div className="summary-row">
              <span>Nominal</span>
              <strong>{formatCurrency(Number(amount) || 0)}</strong>
            </div>
            <div className="summary-row">
              <span>Metode</span>
              <strong>{METHOD_OPTIONS.find((item) => item.id === method)?.label || 'Transfer Bank'}</strong>
            </div>
            <div className="summary-row">
              <span>Status</span>
              <strong>Pending</strong>
            </div>
          </div>

          <div className="topup-note">
            <p className="muted">Setelah kamu klik Lanjutkan, aplikasi akan membuat transaksi pending dan mengarah ke halaman gateway simulasi.</p>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
