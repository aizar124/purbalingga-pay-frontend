import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import VisualQrCode from '../components/VisualQrCode';
import { simulateTopupPaymentApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { readTopupFlow, saveTopupFlow } from '../utils/topupFlow';

const METHOD_META = {
  transfer_bank: {
    label: 'Transfer Bank',
    bankName: 'Bank Jateng',
    accountName: 'Purbalingga Pay Demo',
  },
  virtual_account: {
    label: 'Virtual Account',
  },
  qris: {
    label: 'QRIS Top Up',
  },
};

function formatCountdown(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
  const seconds = String(safeSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function buildVirtualAccountNumber(transactionId = 0) {
  const digits = String(transactionId).padStart(8, '0');

  return `8877-${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
}

function buildBankAccountNumber(referenceCode = '', transactionId = 0) {
  const source = `${referenceCode}${transactionId}`.replace(/[^0-9]/g, '').padEnd(10, '0');

  return source.slice(0, 10);
}

export default function SimulasiGatewayPage() {
  const { token, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialFlow = location.state ?? readTopupFlow();
  const [flow, setFlow] = useState(initialFlow);
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!flow) {
      navigate('/topup', { replace: true });
      return;
    }

    saveTopupFlow(flow);
  }, [flow, navigate]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!flow?.expiresAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((flow.expiresAt - now) / 1000));
  }, [flow?.expiresAt, now]);

  const methodMeta = METHOD_META[flow?.method] ?? METHOD_META.transfer_bank;
  const transaction = flow?.transaction ?? {};
  const nominal = Number(flow?.amount ?? transaction.nominal ?? 0);
  const isExpired = remainingSeconds <= 0;
  const retryTopup = () => {
    navigate('/topup');
  };

  const handleSimulate = async (action) => {
    if (!flow?.transaction?.id || isExpired) {
      return;
    }

    setStatus(action === 'success' ? 'processing-success' : 'processing-failed');
    setMessage('');

    try {
      const response = await simulateTopupPaymentApi(flow.transaction.id, token, action);

      if (response.user) {
        updateUser(response.user);
      }

      const nextFlow = {
        ...flow,
        transaction: response.transaction,
        latestBalance: response.balance,
      };

      saveTopupFlow(nextFlow);
      setFlow(nextFlow);

      if (action === 'success') {
        navigate('/topup/success', {
          state: nextFlow,
        });
      } else {
        setStatus('failed');
        setMessage('Pembayaran disimulasikan gagal. Kamu bisa kembali dan mencoba lagi.');
        saveTopupFlow(nextFlow);
      }
    } catch (simulateError) {
      setStatus('failed');
      setMessage(simulateError?.message || 'Gagal memproses simulasi pembayaran.');
    }
  };

  if (!flow) {
    return (
      <AppShell title="Simulasi Gateway" subtitle="Menyiapkan instruksi pembayaran palsu.">
        <section className="card section-card">
          <p className="muted">Menyiapkan data top up...</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Simulasi Gateway" subtitle="Instruksi pembayaran dummy untuk testing top up.">
      <section className="card section-card page-banner">
        <div className="page-banner-copy">
          <p className="eyebrow">Gateway Simulasi</p>
          <h2 className="page-banner-title">Selesaikan pembayaran palsu</h2>
          <p className="muted">Gunakan tombol simulasi untuk menandai transaksi sukses atau gagal.</p>
        </div>
        <div className="page-banner-meta">
          <span className="info-chip">{methodMeta.label}</span>
          <span className={`info-chip ${isExpired ? 'expired' : ''}`}>Batas waktu {formatCountdown(remainingSeconds)}</span>
        </div>
      </section>

      <section className="grid gateway-grid">
        <article className="card section-card gateway-receipt">
          <div className="section-head">
            <h3>Rincian Pembayaran</h3>
            <span className={`chip ${isExpired ? 'status-error' : ''}`}>{isExpired ? 'Kedaluwarsa' : 'Aktif'}</span>
          </div>

          <div className="gateway-summary">
            <div className="gateway-row">
              <span>Nominal</span>
              <strong>{formatCurrency(nominal)}</strong>
            </div>
            <div className="gateway-row">
              <span>Reference Code</span>
              <strong>{transaction.reference_code || transaction.referenceCode || '-'}</strong>
            </div>
            <div className="gateway-row">
              <span>Status</span>
              <strong>{transaction.status || 'pending'}</strong>
            </div>
          </div>

          {methodMeta.label === 'Transfer Bank' ? (
            <div className="gateway-instruction">
              <p className="gateway-instruction-title">{methodMeta.bankName}</p>
              <p className="muted">Nama rekening: {methodMeta.accountName}</p>
              <div className="gateway-account-box">{buildBankAccountNumber(transaction.reference_code || transaction.referenceCode || '', transaction.id)}</div>
            </div>
          ) : null}

          {methodMeta.label === 'Virtual Account' ? (
            <div className="gateway-instruction">
              <p className="gateway-instruction-title">Nomor Virtual Account</p>
              <div className="gateway-account-box">{buildVirtualAccountNumber(transaction.id)}</div>
              <p className="muted">Format dummy: 8877-XXXX-XXXX</p>
            </div>
          ) : null}

          {methodMeta.label === 'QRIS Top Up' ? (
            <div className="gateway-qr-wrap">
              <VisualQrCode value={`TOPUP:${transaction.reference_code || transaction.referenceCode || 'DUMMY'}:${nominal}`} />
            </div>
          ) : null}

          <div className="gateway-actions">
            <button
              className="primary-btn"
              type="button"
              onClick={() => handleSimulate('success')}
              disabled={isExpired || status === 'processing-success' || status === 'processing-failed'}
            >
              Simulasi Bayar Berhasil
            </button>
            <button
              className="ghost-btn"
              type="button"
              onClick={() => handleSimulate('failed')}
              disabled={isExpired || status === 'processing-success' || status === 'processing-failed'}
            >
              Simulasi Pembayaran Gagal
            </button>
          </div>

          {isExpired ? <p className="negative">Waktu pembayaran simulasi habis. Silakan buat top up baru.</p> : null}
          {message ? <p className={status === 'failed' ? 'negative' : 'stat-hint'}>{message}</p> : null}
          {status === 'failed' ? (
            <button className="secondary-btn" type="button" onClick={retryTopup}>
              Coba Lagi
            </button>
          ) : null}
        </article>

        <aside className="card section-card gateway-side">
          <div className="section-head">
            <h3>Langkah Singkat</h3>
            <span className="chip">5 menit</span>
          </div>
          <ol className="gateway-steps">
            <li>Buka instruksi pembayaran sesuai metode yang dipilih.</li>
            <li>Gunakan tombol simulasi untuk menandai pembayaran sukses atau gagal.</li>
            <li>Setelah sukses, saldo user ditambah dan diarahkan ke halaman sukses.</li>
          </ol>
          <div className="summary-stack">
            <div className="summary-row">
              <span>Metode</span>
              <strong>{methodMeta.label}</strong>
            </div>
            <div className="summary-row">
              <span>Sisa waktu</span>
              <strong>{formatCountdown(remainingSeconds)}</strong>
            </div>
          </div>
          <button
            className="secondary-btn wide"
            type="button"
            onClick={retryTopup}
          >
            Kembali ke Top Up
          </button>
        </aside>
      </section>
    </AppShell>
  );
}
