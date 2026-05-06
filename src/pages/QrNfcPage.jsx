import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import { createTransactionApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import CameraBarcodeScanner from '../components/CameraBarcodeScanner';
import { parseQrPaymentPayload } from '../utils/qrPaymentPayload';

const TICKET_QRIS_MESSAGE_TYPE = 'PURBALINGGA_PAY_QRIS_SUCCESS';
const TICKET_APP_ORIGIN = import.meta.env.VITE_TICKET_APP_ORIGIN || 'https://smartpay.qode.my.id';

export default function QrNfcPage() {
  const { token, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'nfc' ? 'nfc' : 'qr';
  const simulatePayload = searchParams.get('simulate');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [scannedPayment, setScannedPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [submittingScan, setSubmittingScan] = useState(false);
  const lastProcessedScanRef = useRef('');

  const processPaymentPayload = async (parsed, sourceLabel = 'QR') => {
    if (!parsed?.valid) {
      setNotice('QR terbaca, tetapi format payment belum lengkap.');
      setScannedPayment(parsed);
      setPaymentStatus('error');
      return;
    }

    const scanKey = `${parsed.sessionId || parsed.cardId}|${parsed.nominal}|${parsed.merchantName}`.toUpperCase();

    if (lastProcessedScanRef.current === scanKey || submittingScan) {
      return;
    }

    lastProcessedScanRef.current = scanKey;
    setSubmittingScan(true);
    setScannerOpen(false);
    setScannedPayment(parsed);
    setPaymentStatus('processing');
    setNotice(`${sourceLabel}: memproses pembayaran ke ${parsed.merchantName}...`);

    try {
      const response = await createTransactionApi(token, {
        type: 'payment',
        amount: parsed.nominal,
        merchant_name: parsed.merchantName,
        title: `Bayar ${parsed.wisataName || parsed.merchantName}`,
        description: parsed.description || `Merchant: ${parsed.merchantName}`,
      });

      if (response.user) {
        updateUser(response.user);
      }

      setPaymentStatus('success');
      setNotice(
        `Pembayaran ${formatCurrency(parsed.nominal)} ke ${parsed.merchantName}` +
        (parsed.wisataName ? ` untuk ${parsed.wisataName}` : '') +
        ' berhasil.'
      );

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: TICKET_QRIS_MESSAGE_TYPE,
            rawValue: parsed.rawValue,
            cardId: parsed.cardId || '',
            sessionId: parsed.sessionId || '',
            paymentType: parsed.paymentType || '',
            merchantName: parsed.merchantName,
            nominal: parsed.nominal,
            wisataName: parsed.wisataName || '',
            description: parsed.description || '',
          },
          TICKET_APP_ORIGIN,
        );
      }
    } catch (scanError) {
      lastProcessedScanRef.current = '';
      setPaymentStatus('error');
      setNotice(scanError?.message || 'Pembayaran dari QR gagal.');
    } finally {
      setSubmittingScan(false);
    }
  };

  const handleDetectedCode = async ({ value, format }) => {
    const parsed = parseQrPaymentPayload(value);
    await processPaymentPayload(parsed, 'QR');
  };

  useEffect(() => {
    if (activeTab !== 'qr' || !simulatePayload) {
      return;
    }

    const parsed = parseQrPaymentPayload(simulatePayload);
    processPaymentPayload(parsed, 'SIMULATE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, simulatePayload]);

  return (
    <AppShell title="QR / NFC" subtitle="Siapkan pembayaran dengan QRIS atau pembaca NFC.">
      <section className="card section-card page-banner">
        <div className="page-banner-copy">
          <p className="eyebrow">QR / NFC</p>
          <h2 className="page-banner-title">Scan atau tap untuk bayar</h2>
          <p className="muted">Mode aktif menyesuaikan tab yang dipilih di bawah.</p>
        </div>
        <div className="page-banner-meta">
          <span className={`info-chip ${activeTab === 'qr' ? 'active' : ''}`}>QR</span>
          <span className={`info-chip ${activeTab === 'nfc' ? 'active' : ''}`}>NFC</span>
        </div>
      </section>

      <section className="grid qr-grid">
        <article className={`card section-card scan-card ${activeTab === 'qr' ? 'card-highlight' : ''}`}>
          <div className="section-head scanner-head">
            <h3>Scanner Kamera</h3>
            <span className="chip">{simulatePayload ? 'Simulasi' : activeTab === 'qr' ? 'QR aktif' : 'Siaga'}</span>
          </div>
          <p className="muted">
            Tekan tombol di bawah untuk membuka popup scan. Setelah QR terbaca, hasilnya langsung diproses.
          </p>
          <div className="button-row">
            <button
              className="primary-btn"
              type="button"
              onClick={() => {
                setNotice('');
                setPaymentStatus('idle');
                setScannedPayment(null);
                setScannerOpen(true);
              }}
              disabled={activeTab !== 'qr' || Boolean(simulatePayload)}
            >
              Scan QR Sekarang
            </button>
            {simulatePayload ? <span className="info-chip active">Simulasi aktif</span> : null}
          </div>
          <CameraBarcodeScanner
            open={scannerOpen && activeTab === 'qr' && !simulatePayload}
            onClose={() => setScannerOpen(false)}
            onDetected={handleDetectedCode}
          />
          {simulatePayload ? <p className="stat-hint center">Mode simulasi aktif dari URL.</p> : null}
          {scannedPayment?.valid ? (
            <div
              className={`scanner-payment-summary ${
                paymentStatus === 'success'
                  ? 'is-success'
                  : paymentStatus === 'error'
                    ? 'is-error'
                    : paymentStatus === 'processing'
                      ? 'is-processing'
                      : ''
              }`}
            >
              <div className="scanner-payment-top">
                <div className="scanner-payment-icon" aria-hidden="true">
                  {scannedPayment.merchantName?.[0]?.toUpperCase() || 'P'}
                </div>
                <div className="scanner-payment-head-copy">
                  <p className="scanner-payment-kicker">Konfirmasi Pembayaran</p>
                  <h4>{scannedPayment.merchantName || 'Merchant'}</h4>
                  <p className="scanner-payment-subtitle">
                    {scannedPayment.wisataName || scannedPayment.description || 'Pembayaran siap diproses.'}
                  </p>
                </div>
                <span
                  className={`scanner-payment-badge ${
                    paymentStatus === 'success'
                      ? 'status-success'
                      : paymentStatus === 'error'
                        ? 'status-error'
                        : paymentStatus === 'processing'
                          ? 'status-processing'
                          : ''
                  }`}
                >
                  {paymentStatus === 'processing' ? 'Memproses' : paymentStatus === 'success' ? 'Berhasil' : paymentStatus === 'error' ? 'Gagal' : 'Siap'}
                </span>
              </div>

              <div className="scanner-payment-amount">
                <span>Nominal</span>
                <strong>{formatCurrency(scannedPayment.nominal || 0)}</strong>
              </div>

              <div className="scanner-payment-grid">
                <div className="scanner-payment-row">
                  <span>Metode</span>
                  <strong>{scannedPayment.paymentType || 'QRIS'}</strong>
                </div>
                <div className="scanner-payment-row">
                  <span>Merchant</span>
                  <strong>{scannedPayment.merchantName || '-'}</strong>
                </div>
                <div className="scanner-payment-row">
                  <span>Referensi</span>
                  <strong>{scannedPayment.sessionId || scannedPayment.cardId || '-'}</strong>
                </div>
                <div className="scanner-payment-row">
                  <span>Tujuan</span>
                  <strong>{scannedPayment.wisataName || 'Pembayaran umum'}</strong>
                </div>
              </div>

              <div className="scanner-payment-footer">
                <p className="scanner-payment-line">
                  {submittingScan || paymentStatus === 'processing'
                    ? 'Pembayaran berjalan otomatis dari saldo Purbalingga Pay.'
                    : paymentStatus === 'success'
                      ? 'Pembayaran selesai dan popup scan sudah ditutup.'
                      : paymentStatus === 'error'
                        ? 'Periksa QR atau saldo lalu scan ulang.'
                        : 'Pembayaran otomatis siap dijalankan.'}
                </p>
              </div>
            </div>
          ) : null}
        </article>

        <article className={`card section-card scan-card ${activeTab === 'nfc' ? 'card-highlight' : ''}`}>
          <div className="section-head">
            <h3>NFC Reader</h3>
            <span className="chip">Ready</span>
          </div>
          <div className="nfc-ring">Tap NFC</div>
          <p className="muted center">
            Frontend ini menyiapkan UI. Integrasi perangkat tinggal disambungkan ke API.
            {activeTab === 'nfc' ? ' NFC sedang aktif.' : ''}
          </p>
        </article>
      </section>

      <section className="card section-card">
        <div className="section-head">
          <h3>Bayar Otomatis</h3>
          <span className="chip">Saldo Purbalingga Pay</span>
        </div>
        <p className="muted">
          Begitu QR terbaca, pembayaran langsung diproses memakai saldo Purbalingga Pay tanpa pilih kartu manual.
        </p>
        {notice ? <p className="stat-hint">{notice}</p> : null}
      </section>
    </AppShell>
  );
}
