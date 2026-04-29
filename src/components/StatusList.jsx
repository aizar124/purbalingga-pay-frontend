import CardList from './CardList';

export default function StatusList({ items }) {
  return (
    <CardList
      items={items}
      className="list"
      itemClassName="list-row"
      itemAs="div"
      renderItem={(item) => (
        <>
          <div>
            <div className="row-title">{item.title}</div>
            <div className="muted">{item.meta}</div>
          </div>
          <div className={item.tone === 'positive' ? 'positive' : 'negative'}>{item.amount}</div>
        </>
      )}
      emptyTitle="Belum ada transaksi"
      emptyDescription="Transaksi akan muncul setelah akun digunakan."
    />
  );
}
