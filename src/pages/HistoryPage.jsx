import { useEffect, useState } from 'react';
import AppShell from '../layouts/AppShell';
import StatusList from '../components/StatusList';
import { transactionsApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';

export default function HistoryPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      try {
        setLoading(true);
        setError('');
        const response = await transactionsApi(token);

        if (!cancelled) {
          setTransactions(response.transactions || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Gagal memuat transaksi.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AppShell title="Riwayat Transaksi" subtitle="Daftar mutasi dan detail transaksi.">
      <article className="card section-card">
        {loading ? <p className="muted">Memuat transaksi...</p> : null}
        {error ? <p className="negative">{error}</p> : null}
        {!loading && !error ? <StatusList items={transactions} /> : null}
      </article>
    </AppShell>
  );
}
