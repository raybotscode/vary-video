type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

/** Friendly empty state for lists and results. */
export default function EmptyState({title, description, action}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
