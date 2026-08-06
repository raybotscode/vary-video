/**
 * V2 Selection Overlay — visual handles for selected elements.
 *
 * Renders on top of the stage as a separate layer. Shows:
 * - Dashed bounding box
 * - 8 resize handles (corners + midpoints)
 * - 1 rotation handle (above top-center)
 *
 * All positioned absolutely to match the element's transform.
 */

import type {V2Element} from '@vary/v2/schema/document';
import type {StageRect} from '../../utils/coordinates';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';

interface SelectionOverlayProps {
  element: V2Element | null;
  stageRect: StageRect;
}

export default function SelectionOverlay({element, stageRect}: SelectionOverlayProps) {
  const startDrag = useEditorStore((s) => s.startDrag);
  const startResize = useEditorStore((s) => s.startResize);
  const startRotate = useEditorStore((s) => s.startRotate);

  if (!element || element.locked) return null;

  const t = element.transform;

  // Use the EXACT same positioning as ElementRenderer so rotation aligns perfectly
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${t.x * 100}%`,
    top: `${t.y * 100}%`,
    width: t.width !== null ? `${t.width * 100}%` : undefined,
    height: t.height !== null ? `${t.height * 100}%` : undefined,
    transform: `translate(-${t.anchorX * 100}%, -${t.anchorY * 100}%) rotate(${t.rotation}deg)`,
    transformOrigin: `${t.anchorX * 100}% ${t.anchorY * 100}%`,
    zIndex: t.zIndex + 1000,
    pointerEvents: 'none',
  };

  const handleSize = 14; // Larger for touch targets

  const handleStyle = (corner: string): React.CSSProperties => ({
    position: 'absolute',
    width: handleSize,
    height: handleSize,
    background: '#3B82F6',
    border: '2px solid #fff',
    borderRadius: 2,
    pointerEvents: 'auto',
    ...(corner.includes('t') ? {top: -handleSize / 2} : {}),
    ...(corner.includes('b') ? {bottom: -handleSize / 2} : {}),
    ...(corner.includes('l') ? {left: -handleSize / 2} : {}),
    ...(corner.includes('r') ? {right: -handleSize / 2} : {}),
    ...(corner === 'tm' || corner === 'bm' ? {left: '50%', marginLeft: -handleSize / 2} : {}),
    ...(corner === 'ml' || corner === 'mr' ? {top: '50%', marginTop: -handleSize / 2} : {}),
    cursor: cursorForHandle(corner),
  });

  const onDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    startDrag(element.id, e.clientX, e.clientY, element.transform);
  };

  const resizeHandles = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'] as const;

  return (
    <div style={style}>
      {/* Dashed outline */}
      <div
        style={{
          position: 'absolute',
          inset: -1,
          border: '1px dashed #3B82F6',
          borderRadius: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Resize handles */}
      {resizeHandles.map((corner) => (
        <div
          key={corner}
          data-handle={`resize-${corner}`}
          style={handleStyle(corner)}
        />
      ))}

      {/* Rotation handle */}
      <div
        data-handle="rotate"
        style={{
          position: 'absolute',
          top: -22,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 12,
          height: 12,
          background: '#3B82F6',
          border: '2px solid #fff',
          borderRadius: '50%',
          cursor: 'grab',
          pointerEvents: 'auto',
        }}
      />
      {/* Connector line */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          width: 1,
          height: 10,
          background: '#3B82F6',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function cursorForHandle(handle: string): string {
  switch (handle) {
    case 'tl': return 'nwse-resize';
    case 'tr': return 'nesw-resize';
    case 'br': return 'nwse-resize';
    case 'bl': return 'nesw-resize';
    case 'tm': return 'ns-resize';
    case 'bm': return 'ns-resize';
    case 'ml': return 'ew-resize';
    case 'mr': return 'ew-resize';
    default: return 'move';
  }
}
