import { useEffect, useMemo, useState } from 'react';
import AppShell from '../layouts/AppShell';
import { blockCardApi, cardsApi, createTransactionApi, unlockCardApi } from '../api/purbalinggaPay';
import { useAuth } from '../auth/AuthContext';
import CardList from '../components/CardList';

export default function PaymentPage() {
  const { token, updateUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [selectedCardCode, setSelectedCardCode] = useState('');
  const [amount, setAmount] = useState('50000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadCards = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await cardsApi(token);
      const nextCards = response.cards || [];
      setCards(nextCards);
      setSelectedCardCode((current) => current || nextCards.find((card) => card.rawStatus === 'active')?.id || nextCards[0]?.id || '');
    } catch (err) {
      setError(err?.message || 'Gagal memuat kartu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardCode) || cards[0] || null,
    [cards, selectedCardCode],
  );

  const handleTopUp = async (event) => {
    event.preventDefault();
    setNotice('');

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setNotice('Nominal top up tidak valid.');
      return;
    }

    if (!selectedCard) {
      setNotice('Pilih kartu terlebih dahulu.');
      return;
    }

    try {
      const response = await createTransactionApi(token, {
        type: 'topup',
        amount: numericAmount,
        title: `Top up ${selectedCard.label}`,
        card_code: selectedCard.id,
      });

      if (response.user) {
        updateUser(response.user);
      }

      await loadCards();
      setNotice('Top up berhasil.');
    } catch (err) {
      setNotice(err?.message || 'Top up gagal.');
    }
  };

  const handleCardToggle = async (card) => {
    try {
      if (card.rawStatus === 'locked') {
        await unlockCardApi(card.id, token);
      } else {
        await blockCardApi(card.id, token);
      }

      await loadCards();
      setNotice(card.rawStatus === 'locked' ? 'Kartu berhasil dibuka.' : 'Kartu berhasil diblokir.');
    } catch (err) {
      setNotice(err?.message || 'Gagal memperbarui kartu.');
    }
  };

  if (loading) {
    return (
      <AppShell title="Payment Card" subtitle="Kelola kartu, top up, blokir, dan PIN.">
        <section className="card section-card">
          <p className="eyebrow">Memuat kartu</p>
          <h2 className="page-banner-title">Menyiapkan data kartu</h2>
          <p className="muted">Sedang mengambil kartu dari backend.</p>
        </section>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Payment Card" subtitle="Kelola kartu, top up, blokir, dan PIN.">
        <section className="card section-card">
          <p className="negative">{error}</p>
          <button className="primary-btn" type="button" onClick={loadCards}>
            Coba lagi
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title="Payment Card" subtitle="Kelola kartu, top up, blokir, dan PIN.">
      <section className="card section-card page-banner">
        <div className="page-banner-copy">
          <p className="eyebrow">Payment Card</p>
          <h2 className="page-banner-title">Kelola kartu dengan cepat</h2>
          <p className="muted">Top up, blokir, dan pantau limit kartu dalam satu tempat.</p>
        </div>
        <div className="page-banner-meta">
          <span className="info-chip">Aktif: {cards.filter((card) => card.rawStatus === 'active').length}</span>
          <span className="info-chip">Terkunci: {cards.filter((card) => card.rawStatus === 'locked').length}</span>
        </div>
      </section>

      <section className="card section-card">
        <div className="section-head">
          <h3>Top Up Cepat</h3>
          <span className="chip">{selectedCard ? selectedCard.label : 'Pilih kartu'}</span>
        </div>
        <form className="form transaction-form" onSubmit={handleTopUp}>
          <label>
            Kartu
            <select value={selectedCardCode} onChange={(e) => setSelectedCardCode(e.target.value)}>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.label} - {card.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nominal
            <input
              type="number"
              min="1000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50000"
            />
          </label>
          <button className="primary-btn" type="submit">
            Top Up Sekarang
          </button>
        </form>
        {notice ? <p className="stat-hint">{notice}</p> : null}
      </section>

      <CardList
        items={cards}
        className="grid dashboard-split"
        itemClassName="card section-card card-stack"
        itemAs="article"
        renderItem={(card) => (
          <>
            <div className="section-head">
              <h3>{card.label}</h3>
              <span className="chip">{card.status}</span>
            </div>
            <p className="muted">{card.id}</p>
            <p className="big-number">{card.balance}</p>
            <p className="muted">Limit: {card.limit}</p>
            <div className="button-row">
              <button className="ghost-btn" type="button" onClick={() => handleCardToggle(card)}>
                {card.rawStatus === 'locked' ? 'Buka' : 'Blokir'}
              </button>
            </div>
          </>
        )}
        emptyTitle="Belum ada kartu"
        emptyDescription="Tambahkan kartu lewat backend nanti."
      />
    </AppShell>
  );
}
