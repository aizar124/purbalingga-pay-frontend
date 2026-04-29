import Topbar from '../components/Topbar';
import BottomNav from '../components/BottomNav';

export default function AppShell({ children, title, subtitle, showPageHead = true }) {
  return (
    <div className="app-shell">
      <Topbar />
      <main className="main">
        {showPageHead ? (
          <section className="page-head card">
            <p className="eyebrow">Purbalingga Payment Experience</p>
            <h1 className="page-title">{title}</h1>
            <p className="muted">{subtitle}</p>
          </section>
        ) : null}
        <div className="page-content">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
