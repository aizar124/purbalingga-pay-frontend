import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function normalizeQrValue(value) {
  return String(value ?? '').trim() || 'PBG-001/18500/WARUNG KOPI';
}

export default function VisualQrCode({ value, className = '' }) {
  const normalized = normalizeQrValue(value);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function buildQr() {
      try {
        setError('');
        const nextSvg = await QRCode.toString(normalized, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320,
          color: {
            dark: '#102b43',
            light: '#ffffff',
          },
        });

        if (!cancelled) {
          setSvg(nextSvg);
        }
      } catch (buildError) {
        if (!cancelled) {
          setError(buildError?.message || 'Gagal membuat QR code.');
        }
      }
    }

    buildQr();

    return () => {
      cancelled = true;
    };
  }, [normalized]);

  return (
    <figure className={`barcode-figure ${className}`.trim()}>
      <div className="qr-code-frame" aria-label={`QR code testing untuk ${normalized}`}>
        {svg ? <div className="qr-code-svg" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
        {!svg && !error ? <p className="muted center">Membuat QR code...</p> : null}
        {error ? <p className="negative center">{error}</p> : null}
      </div>
      <figcaption className="barcode-caption">
        <span className="barcode-value">{normalized}</span>
        <span className="barcode-note">QR code untuk testing scanner.</span>
      </figcaption>
    </figure>
  );
}
