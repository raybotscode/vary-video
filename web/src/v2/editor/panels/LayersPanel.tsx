/**
 * V2 Layers Panel — element list with visibility, lock, reorder.
 *
 * Drag to reorder: tap and hold the 6-dot grip on the left of a layer,
 * then drag up/down. Uses MOVE_ELEMENT command for undoable reorder.
 */

import {useState, useRef, useCallback} from 'react';
import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';
import type {V2Element} from '@vary/v2/schema/document';

export default function LayersPanel() {
  const elements = useDocumentStore((s) => s.getElements());
  const dispatch = useDocumentStore((s) => s.dispatch);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);

  const sorted = [...elements]
    .sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  // ─── Drag state ──────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<{ startY: number; startIndex: number } | null>(null);

  const handleDragStart = useCallback((index: number, clientY: number) => {
    setDragIndex(index);
    setDragOverIndex(index);
    dragRef.current = { startY: clientY, startIndex: index };
  }, []);

  const handleDragMove = useCallback((clientY: number, items: typeof sorted) => {
    if (dragIndex === null || dragRef.current === null) return;
    // Determine which index the pointer is over based on position
    const rowHeight = 42; // approximate row height in px
    const delta = clientY - dragRef.current.startY;
    const offset = Math.round(delta / rowHeight);
    const targetIndex = Math.max(0, Math.min(items.length - 1, dragRef.current.startIndex + offset));
    setDragOverIndex(targetIndex);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const el = sorted[dragIndex];
      if (el) {
        dispatch({ type: 'MOVE_ELEMENT', elementId: el.id, newIndex: dragOverIndex } as any);
      }
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragRef.current = null;
  }, [dragIndex, dragOverIndex, sorted, dispatch]);

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{fontSize: 13, fontWeight: 600, color: '#374151'}}>Layers</span>
        <span style={{fontSize: 11, color: '#9CA3AF'}}>{elements.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div style={{padding: 16, textAlign: 'center', color: '#6B7280', fontSize: 13}}>
          No elements yet
        </div>
      ) : (
        <div
          style={{display: 'flex', flexDirection: 'column'}}
          onPointerUp={handleDragEnd}
          onPointerLeave={handleDragEnd}
        >
          {sorted.map((element, i) => (
            <LayerItem
              key={element.id}
              element={element}
              index={i}
              isSelected={element.id === selectedElementId}
              isDragging={dragIndex === i}
              isDragOver={dragOverIndex === i && dragIndex !== i}
              onSelect={() => selectElement(element.id)}
              onToggleVisibility={() =>
                dispatch({type: 'SET_VISIBLE', elementId: element.id, visible: !element.visible})
              }
              onToggleLock={() =>
                dispatch({type: 'SET_LOCKED', elementId: element.id, locked: !element.locked})
              }
              onDelete={() => dispatch({type: 'DELETE_ELEMENT', elementId: element.id})}
              onDuplicate={() => dispatch({type: 'DUPLICATE_ELEMENT', elementId: element.id})}
              onDragStart={(clientY) => handleDragStart(i, clientY)}
              onDragMove={(clientY) => handleDragMove(clientY, sorted)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Layer Item ────────────────────────────────────────────────────

function LayerItem({
  element, index, isSelected, isDragging, isDragOver,
  onSelect, onToggleVisibility, onToggleLock,
  onDelete, onDuplicate, onDragStart, onDragMove,
}: {
  element: V2Element;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (clientY: number) => void;
  onDragMove: (clientY: number) => void;
}) {
  const icon = element.type === 'text' ? 'T' : element.type === 'image' ? '🖼' : '◻';

  const handleGripPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    onDragStart(e.clientY);

    const handleMove = (ev: PointerEvent) => onDragMove(ev.clientY);
    const handleUp = () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerup', handleUp);
      el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerup', handleUp);
  };

  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', cursor: 'pointer',
      background: isDragging ? '#DBEAFE' : isDragOver ? '#F0F9FF' : isSelected ? '#EFF6FF' : 'transparent',
      opacity: element.visible ? (isDragging ? 0.5 : 1) : 0.45,
      borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
      borderTop: isDragOver ? '2px solid #3B82F6' : '2px solid transparent',
      transition: 'background 0.15s, opacity 0.15s',
      transform: isDragging ? 'scale(1.02)' : undefined,
    }}>
      {/* 6-dot grip handle */}
      <div
        onPointerDown={handleGripPointerDown}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 3,
          width: 14, height: 18, flexShrink: 0,
          cursor: 'grab',
          padding: 2,
          touchAction: 'none',
          userSelect: 'none',
        }}
        title="Drag to reorder"
      >
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} style={{
            width: 3, height: 3, borderRadius: '50%',
            background: isDragging ? '#3B82F6' : '#CBD5E1',
          }} />
        ))}
      </div>

      <button onClick={(e) => {e.stopPropagation(); onToggleVisibility();}}
        style={{...iconBtn, opacity: element.visible ? 1 : 0.5, color: element.visible ? '#6B7280' : '#9CA3AF'}} title={element.visible ? 'Hide' : 'Show'}>
        {element.visible ? '👁' : '👁‍🗨'}
      </button>
      <button onClick={(e) => {e.stopPropagation(); onToggleLock();}}
        style={{...iconBtn, color: element.locked ? '#E53E3E' : '#D1D5DB'}} title={element.locked ? 'Unlock' : 'Lock'}>
        {element.locked ? '🔒' : '🔓'}
      </button>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 12, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
          <span style={{marginRight: 4}}>{icon}</span>{element.name}
        </div>
        <div style={{fontSize: 10, color: '#9CA3AF'}}>{element.type} · z{element.transform.zIndex}</div>
      </div>
      <div style={{display: 'flex', gap: 2}}>
        <button onClick={(e) => {e.stopPropagation(); onDuplicate();}} style={iconBtn} title="Duplicate">⊕</button>
        <button onClick={(e) => {e.stopPropagation(); onDelete();}} style={{...iconBtn, color: '#E53E3E'}} title="Delete">×</button>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  width: 240, background: '#fff', borderRight: '1px solid #E5E7EB',
  display: 'flex', flexDirection: 'column', overflow: 'auto', flexShrink: 0,
};
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
};
const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, padding: '2px 4px', borderRadius: 3, color: '#6B7280',
};
