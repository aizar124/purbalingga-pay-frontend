import { useMemo } from 'react';

const CODE39_PATTERNS = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '*': 'nwnnwnwnn',
  $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
};

export function normalizeCode39Value(value) {
  const normalized = String(value ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z .\-$\/+%]/g, '')
    .trim();

  return normalized || 'TEST-2026';
}

function buildBarcodeModules(value) {
  const normalized = normalizeCode39Value(value);
  const code = `*${normalized}*`;
  const modules = [{ color: 'white', width: 10 }];

  Array.from(code).forEach((character, charIndex) => {
    const pattern = CODE39_PATTERNS[character];

    if (!pattern) {
      return;
    }

    Array.from(pattern).forEach((element, elementIndex) => {
      modules.push({
        color: elementIndex % 2 === 0 ? 'black' : 'white',
        width: element === 'w' ? 3 : 1,
      });
    });

    if (charIndex < code.length - 1) {
      modules.push({ color: 'white', width: 1 });
    }
  });

  modules.push({ color: 'white', width: 10 });

  return modules;
}

export default function VisualBarcode({ value, className = '' }) {
  const normalized = normalizeCode39Value(value);
  const modules = useMemo(() => buildBarcodeModules(normalized), [normalized]);

  const unitWidth = 4;
  const height = 124;
  const totalWidth = modules.reduce((sum, module) => sum + module.width * unitWidth, 0);

  let offset = 0;

  const bars = modules.map((module, index) => {
    const width = module.width * unitWidth;
    const node = (
      <rect
        key={`bar-${index}`}
        x={offset}
        y={0}
        width={width}
        height={height}
        rx="1.5"
        fill={module.color === 'black' ? 'currentColor' : 'white'}
      />
    );

    offset += width;

    return node;
  });

  return (
    <figure className={`barcode-figure ${className}`.trim()}>
      <svg
        className="barcode-svg"
        viewBox={`0 0 ${totalWidth} ${height}`}
        role="img"
        aria-label={`Barcode testing untuk ${normalized}`}
        preserveAspectRatio="none"
      >
        <rect width={totalWidth} height={height} rx="18" fill="white" />
        <g className="barcode-bars">{bars}</g>
      </svg>
      <figcaption className="barcode-caption">
        <span className="barcode-value">{normalized}</span>
        <span className="barcode-note">Barcode visual untuk testing.</span>
      </figcaption>
    </figure>
  );
}
