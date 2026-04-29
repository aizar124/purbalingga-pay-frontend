import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../layouts/AppShell';
import VisualQrCode, { normalizeQrValue } from '../components/VisualQrCode';

const DEFAULT_VALUE = 'PBG-001/18500/WARUNG KOPI';

export default function BarcodeTestPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialValue = searchParams.get('value') || DEFAULT_VALUE;
  const [draftValue, setDraftValue] = useState(initialValue);

  useEffect(() => {
    setDraftValue(initialValue);
  }, [initialValue]);

  const qrValue = useMemo(() => normalizeQrValue(draftValue), [draftValue]);

  const applyValue = (event) => {
    event.preventDefault();

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('value', qrValue);
    setSearchParams(nextParams, { replace: true });
  };

  const simulateScan = () => {
    navigate(`/qr?tab=qr&simulate=${encodeURIComponent(qrValue)}`);
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?value=${encodeURIComponent(qrValue)}`
      : '';

  return (
    <AppShell title="QR Code Test" subtitle="Halaman testing yang hanya bisa dibuka lewat URL langsung.">
      <section className="card section-card page-banner barcode-hero">
        <div className="page-banner-copy">
          <p className="eyebrow">Testing Zone</p>
          <h2 className="page-banner-title">Buat QR code dengan value custom</h2>
          <p className="muted">
            Ubah value lewat form, atau tambahkan `?value=isi_anda` di URL untuk membuka hasil tertentu.
            Format yang paling gampang untuk testing scanner adalah `card_id/nominal/merchant_name`.
          </p>
        </div>
        <div className="page-banner-meta">
          <span className="info-chip">Route tersembunyi</span>
          <span className="info-chip">Value editable</span>
        </div>
      </section>

      <section className="grid barcode-layout">
        <article className="card section-card barcode-panel">
          <div className="section-head">
            <h3>Custom Value</h3>
            <span className="chip">URL driven</span>
          </div>

          <form className="form barcode-form" onSubmit={applyValue}>
            <label>
              Isi QR code
              <input
                type="text"
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                placeholder="Contoh: PBG-001/18500/WARUNG KOPI"
              />
            </label>
            <div className="button-row">
              <button className="primary-btn" type="submit">
                Update QR code
              </button>
              <button className="secondary-btn" type="button" onClick={simulateScan}>
                Simulate scan
              </button>
            </div>
          </form>

          <div className="barcode-meta">
            <span className="stat-hint">Share URL:</span>
            <code className="barcode-code">{shareUrl}</code>
            {draftValue !== qrValue ? (
              <span className="stat-hint">Input disesuaikan menjadi: {qrValue}</span>
            ) : null}
          </div>
        </article>

        <article className="card section-card barcode-preview-card">
          <div className="section-head">
            <h3>Preview</h3>
            <span className="chip">QR code</span>
          </div>
          <VisualQrCode value={qrValue} />
        </article>
      </section>
    </AppShell>
  );
}
