export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-title">{title}</div>
      <p className="muted">{description}</p>
    </div>
  );
}
