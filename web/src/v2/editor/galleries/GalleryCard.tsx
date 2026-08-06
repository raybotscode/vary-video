/**
 * GalleryCard — single selectable card for gallery grids.
 *
 * Shows thumbnail image with label below.
 * 44px minimum touch target.
 */

interface GalleryCardProps {
  thumbnail?: string;       // image URL
  icon?: string;            // fallback emoji/icon
  label: string;
  onClick: () => void;
  selected?: boolean;
  badge?: string;           // optional badge text (e.g. "Premium")
}

export default function GalleryCard({
  thumbnail, icon, label, onClick, selected, badge,
}: GalleryCardProps) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column',
      background: selected ? '#1E3A5F' : '#1E293B',
      border: selected ? '2px solid #3B82F6' : '1px solid transparent',
      borderRadius: 10, overflow: 'hidden',
      cursor: 'pointer', padding: 0,
      minHeight: 44,
      textAlign: 'left',
      transition: 'transform 0.1s, border-color 0.15s',
    }}>
      {/* Thumbnail */}
      <div style={{
        aspectRatio: '1',
        background: thumbnail ? undefined : '#334155',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {thumbnail ? (
          <img src={thumbnail} alt={label} loading="lazy" style={{
            width: '100%', height: '100%', objectFit: 'cover',
          }} />
        ) : icon ? (
          <span style={{fontSize: 32}}>{icon}</span>
        ) : null}

        {/* Badge */}
        {badge && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            background: '#3B82F6', color: '#fff',
            fontSize: 9, fontWeight: 700, padding: '2px 6px',
            borderRadius: 4,
          }}>{badge}</span>
        )}
      </div>

      {/* Label */}
      <div style={{
        padding: '8px 10px',
        color: '#E2E8F0', fontSize: 12, fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textAlign: 'center',
      }}>{label}</div>
    </button>
  );
}
