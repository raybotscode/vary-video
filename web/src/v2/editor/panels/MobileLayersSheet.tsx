/**
 * V2 Mobile Layers Sheet — drag-to-reorder layer list.
 *
 * Slides up from the bottom when the layers button (☰) is tapped.
 * Each layer shows a drag handle (=), visibility toggle, and name.
 * Drag up/down changes zIndex.
 */

import {useRef, useState, useCallback} from 'react';
import {createPortal} from 'react-dom';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import type {V2Element} from '@vary/v2/schema/document';

interface DragState {
  elementId: string;
  startY: number;
  startIndex: number;
}

export default function MobileLayersSheet() {
  const open = useEditorStore((s) => s.mobileLayersOpen);
  const close = useEditorStore((s) => s.closeMobileLayers);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const elements = useDocumentStore((s) => s.getElements());
  const dispatch = useDocumentStore((s) => s.dispatch);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);

  const sorted = [...elements].sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  const handleDragStart = useCallback((e: React.PointerEvent, element: V2Element, index: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({elementId: element.id, startY: e.clientY, startIndex: index});
  }, []);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const itemHeight = 56;
    const offset = Math.round(dy / itemHeight);
    const newZIndex = Math.max(0, Math.min(sorted.length - 1, drag.startIndex + offset));
    const el = elements.find(x => x.id === drag.elementId);
    if (!el || el.transform.zIndex === newZIndex) return;

    // Reassign zIndex: swap with element at target position
    const target = sorted[newZIndex];
    if (target && target.id !== el.id) {
      dispatch({
        type: 'SET_ELEMENT_PROP', elementId: el.id,
        key: 'zIndex', value: target.transform.zIndex,
      });
    }
  }, [drag, sorted, elements, dispatch]);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDrag(null);
  }, []);

  if (!open) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{
        position: 'fixed', inset: 0, zIndex: 10998,
        background: 'rgba(0,0,0,0.4)',
      }} />

      {/* Sheet */}
      <div ref={sheetRef} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 10999,
        maxHeight: '60vh',
        background: '#1A202C',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        display: 'flex', flexDirection: 'column',
        animation: 'layersheet-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #2D3748',
          flexShrink: 0,
        }}>
          <span style={{color: '#fff', fontSize: 17, fontWeight: 600}}>Layers</span>
          <span style={{color: '#6B7280', fontSize: 13, marginLeft: 8}}>
            {elements.length} {elements.length === 1 ? 'layer' : 'layers'}
          </span>
          <button onClick={close} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            fontSize: 22, color: '#9CA3AF', cursor: 'pointer', padding: '4px 8px',
          }}>×</button>
        </div>

        {/* Layer list */}
        <div style={{
          flex: 1, overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 24,
        }}>
          {sorted.length === 0 ? (
            <div style={{padding: 32, textAlign: 'center', color: '#6B7280', fontSize: 14}}>
              No layers. Add an element to get started.
            </div>
          ) : (
            sorted.map((el, index) => {
              const icon = el.type === 'text' ? 'T' : el.type === 'image' ? '🖼' : '◻';
              const isSelected = el.id === selectedElementId;
              const isDragging = drag?.elementId === el.id;

              return (
                <div
                  key={el.id}
                  onClick={() => {selectElement(el.id); close();}}
                  onPointerDown={(e) => handleDragStart(e, el, index)}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', cursor: 'pointer',
                    background: isSelected ? '#1E3A5F' : isDragging ? '#2D3748' : 'transparent',
                    opacity: el.visible ? 1 : 0.35,
                    borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
                    borderBottom: '1px solid #2D3748',
                    transform: isDragging ? 'scale(1.02)' : undefined,
                    transition: isDragging ? 'none' : 'all 0.15s',
                    touchAction: 'none',
                    userSelect: 'none',
                  }}
                >
                  {/* Drag handle */}
                  <div style={{
                    color: '#4B5563', fontSize: 16, cursor: 'grab',
                    padding: '4px 2px', letterSpacing: 2, lineHeight: 1,
                  }}>⋮⋮</div>

                  {/* Type icon */}
                  <span style={{fontWeight: 700, fontSize: 14, color: '#D1D5DB', width: 22, textAlign: 'center'}}>
                    {icon}
                  </span>

                  {/* Name */}
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: '#E2E8F0',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{el.name}</div>
                    <div style={{fontSize: 10, color: '#6B7280'}}>{el.type}</div>
                  </div>

                  {/* Visibility */}
                  <button onClick={(e) => {
                    e.stopPropagation();
                    dispatch({type: 'SET_VISIBLE', elementId: el.id, visible: !el.visible});
                  }} style={iconBtnStyle}>
                    {el.visible ? '👁' : '—'}
                  </button>

                  {/* Lock */}
                  <button onClick={(e) => {
                    e.stopPropagation();
                    dispatch({type: 'SET_LOCKED', elementId: el.id, locked: !el.locked});
                  }} style={{...iconBtnStyle, color: el.locked ? '#F87171' : '#6B7280'}}>
                    {el.locked ? '🔒' : '🔓'}
                  </button>

                  {/* Delete */}
                  <button onClick={(e) => {
                    e.stopPropagation();
                    dispatch({type: 'DELETE_ELEMENT', elementId: el.id});
                  }} style={{...iconBtnStyle, color: '#F87171'}}>🗑</button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes layersheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, padding: '6px 8px', borderRadius: 6, color: '#6B7280',
  minWidth: 36, minHeight: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
