/**
 * V2 Layers Panel — element list with visibility, lock, reorder.
 */

import type {V2Element} from '../schema/document';

type LayersPanelProps = {
  elements: V2Element[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

export default function LayersPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: LayersPanelProps) {
  const sortedElements = [...elements]
    .filter((e) => e.visible)
    .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{fontSize: 13, fontWeight: 600, color: '#374151'}}>Layers</span>
        <span style={{fontSize: 11, color: '#9CA3AF'}}>{elements.length}</span>
      </div>

      {sortedElements.length === 0 ? (
        <div style={{padding: 16, textAlign: 'center', color: '#6B7280', fontSize: 13}}>
          No elements yet
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {sortedElements.map((element) => (
            <LayerItem
              key={element.id}
              element={element}
              isSelected={element.id === selectedElementId}
              onSelect={() => onSelectElement(element.id)}
              onToggleVisibility={() => onToggleVisibility(element.id)}
              onToggleLock={() => onToggleLock(element.id)}
              onDelete={() => onDelete(element.id)}
              onDuplicate={() => onDuplicate(element.id)}
              onMoveUp={() => onMoveUp(element.id)}
              onMoveDown={() => onMoveDown(element.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Layer Item ────────────────────────────────────────────────────

function LayerItem({
  element,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  element: V2Element;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const icon = element.type === 'text' ? 'T' : element.type === 'image' ? '🖼' : '◻';

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        cursor: 'pointer',
        background: isSelected ? '#EFF6FF' : 'transparent',
        borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
        transition: 'all 0.1s',
      }}
    >
      {/* Visibility toggle */}
      <button
        onClick={(e) => {e.stopPropagation(); onToggleVisibility();}}
        style={{...iconBtnStyle, opacity: element.visible ? 1 : 0.4}}
        title={element.visible ? 'Hide' : 'Show'}
      >
        {element.visible ? '👁' : '—'}
      </button>

      {/* Lock toggle */}
      <button
        onClick={(e) => {e.stopPropagation(); onToggleLock();}}
        style={{...iconBtnStyle, color: element.locked ? '#E53E3E' : '#D1D5DB'}}
        title={element.locked ? 'Unlock' : 'Lock'}
      >
        {element.locked ? '🔒' : '🔓'}
      </button>

      {/* Name */}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 12, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
          <span style={{marginRight: 4}}>{icon}</span>
          {element.name}
        </div>
        <div style={{fontSize: 10, color: '#9CA3AF'}}>
          {element.type} · z{element.transform.zIndex}
        </div>
      </div>

      {/* Actions */}
      <div style={{display: 'flex', gap: 2}}>
        <button onClick={(e) => {e.stopPropagation(); onMoveUp();}} style={iconBtnStyle} title="Move up">↑</button>
        <button onClick={(e) => {e.stopPropagation(); onMoveDown();}} style={iconBtnStyle} title="Move down">↓</button>
        <button onClick={(e) => {e.stopPropagation(); onDuplicate();}} style={iconBtnStyle} title="Duplicate">⊕</button>
        <button onClick={(e) => {e.stopPropagation(); onDelete();}} style={{...iconBtnStyle, color: '#E53E3E'}} title="Delete">×</button>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 220,
  background: '#fff',
  borderRight: '1px solid #E5E7EB',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  flexShrink: 0,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid #E5E7EB',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  padding: '2px 4px',
  borderRadius: 3,
  color: '#6B7280',
};
