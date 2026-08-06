/**
 * GalleryGrid — responsive card grid for mobile galleries.
 *
 * Props:
 * - items: array of data items
 * - renderItem: function that returns a React node for each item
 * - columns: 2 or 3 column grid
 * - loading: show loading skeleton
 * - emptyLabel: text when no items
 */

interface GalleryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: 2 | 3;
  loading?: boolean;
  emptyLabel?: string;
}

export default function GalleryGrid<T>({
  items, renderItem, columns = 2, loading, emptyLabel = 'Nothing here yet',
}: GalleryGridProps<T>) {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 8, padding: 12,
      }}>
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} style={{
            aspectRatio: '1', borderRadius: 10,
            background: '#1E293B',
            animation: 'gallery-pulse 1.5s infinite',
          }} />
        ))}
        <style>{`
          @keyframes gallery-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        padding: 40, textAlign: 'center',
        color: '#64748B', fontSize: 14,
      }}>{emptyLabel}</div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 8, padding: 12,
    }}>
      {items.map((item, i) => renderItem(item, i))}
    </div>
  );
}
