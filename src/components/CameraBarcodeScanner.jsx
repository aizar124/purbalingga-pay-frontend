import { useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';

export default function CameraBarcodeScanner({
  open = false,
  onClose,
  onDetected,
  className = '',
  title = 'Scanner QR',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const [status, setStatus] = useState('Klik tombol scan untuk mulai.');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('idle');
  const [lastValue, setLastValue] = useState('');

  const supported = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return Boolean(navigator.mediaDevices?.getUserMedia);
  }, []);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let cancelled = false;

    async function stopScanner() {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    async function startScanner() {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!open) {
        setPhase('idle');
        setStatus('Klik tombol scan untuk mulai.');
        setError('');
        await stopScanner();
        return;
      }

      if (!supported) {
        setPhase('error');
        setError('Kamera tidak tersedia di browser ini.');
        setStatus('Coba browser yang punya akses kamera.');
        return;
      }

      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setPhase('error');
        setError('Akses kamera butuh HTTPS.');
        setStatus('Buka halaman ini lewat HTTPS.');
        return;
      }

      try {
        setError('');
        setPhase('opening');
        setStatus('Membuka kamera...');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }

        setPhase('scanning');
        setStatus('Arahkan QR ke kotak scan.');

        const scanFrame = () => {
          if (cancelled || !open || !video || !canvas) {
            return;
          }

          if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            rafRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          const width = video.videoWidth;
          const height = video.videoHeight;

          if (!width || !height) {
            rafRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) {
            rafRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          context.drawImage(video, 0, 0, width, height);
          const imageData = context.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code?.data) {
            const value = code.data.trim();

            if (value && value !== lastValue) {
              setLastValue(value);
              setPhase('success');
              setStatus('QR berhasil terbaca.');
              onDetectedRef.current?.({ value, format: 'qr' });
            }

            rafRef.current = window.requestAnimationFrame(scanFrame);
            return;
          }

          rafRef.current = window.requestAnimationFrame(scanFrame);
        };

        rafRef.current = window.requestAnimationFrame(scanFrame);
      } catch (startError) {
        if (!cancelled) {
          setPhase('error');
          setError(startError?.message || 'Gagal membuka kamera.');
          setStatus('Tidak bisa memulai scan.');
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open, supported]);

  useEffect(() => {
    if (!open) {
      setLastValue('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={`qr-scanner-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}>
      <div className="qr-scanner-backdrop" onClick={onClose} aria-hidden="true" />
      <section className="qr-scanner-panel card">
        <div className="qr-scanner-topbar">
          <div>
            <p className="eyebrow">Live Scan</p>
            <h3>{title}</h3>
          </div>
          <button className="ghost-btn" type="button" onClick={onClose}>
            Tutup
          </button>
        </div>

        <div className={`qr-scanner-stage phase-${phase}`}>
          <video ref={videoRef} className="qr-scanner-video" autoPlay muted playsInline />
          <canvas ref={canvasRef} className="qr-scanner-canvas" aria-hidden="true" />
          <div className="qr-scanner-frame">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="qr-scanner-sweep" />
          <div className="qr-scanner-hud">
            <span className={`chip ${error ? 'scanner-chip-error' : ''}`}>{phase === 'scanning' ? 'Scanning' : phase === 'success' ? 'QR found' : 'Live'}</span>
            <p>{error || status}</p>
            {!supported ? <p className="muted">Browser ini butuh akses kamera via `getUserMedia`.</p> : null}
          </div>
          {lastValue ? <div className="qr-scanner-toast">Terdeteksi: {lastValue}</div> : null}
        </div>
      </section>
    </div>
  );
}
