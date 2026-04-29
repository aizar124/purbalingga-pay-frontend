export default function CardList({
  items,
  renderItem,
  emptyTitle = 'Belum ada data',
  emptyDescription = 'Daftar masih kosong.',
  className = '',
  itemClassName = '',
  itemAs: Item = 'div',
}) {
  if (!items?.length) {
    return (
      <div className={`card-list ${className}`.trim()}>
        <div className="empty-title">{emptyTitle}</div>
        <p className="muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className={`card-list ${className}`.trim()}>
      {items.map((item, index) => (
        <Item key={item.id ?? index} className={`card-list-item ${itemClassName}`.trim()}>
          {renderItem(item)}
        </Item>
      ))}
    </div>
  );
}
