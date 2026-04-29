import { useLocation, useNavigate } from 'react-router-dom';

const bottomItems = [
  { to: '/payment', label: 'Card', icon: '💳', match: ['/payment'] },
  { to: '/qr?tab=qr', label: 'QR', icon: '📱', match: ['/qr?tab=qr', '/qr'] },
  { to: '/qr?tab=nfc', label: 'NFC', icon: '📶', match: ['/qr?tab=nfc'] },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = `${location.pathname}${location.search}`;

  return (
    <nav className="bottom-nav" aria-label="Navigasi bawah">
      {bottomItems.map((item) => {
        const active = item.match.includes(currentPath) || (item.to === '/qr?tab=qr' && location.pathname === '/qr' && !location.search);

        return (
          <button
            key={item.to}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.to)}
            type="button"
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
