/**
 * Mobile Tools Strip — replaces the Scene Navigator when ⚙ is toggled.
 *
 * Provides quick-access controls in the same strip space:
 *   [− 100% +]  [⊞ Grid]  [⦿ Snap]  [🗑 Delete]  [⊕ Duplicate]
 *
 * All controls use existing store actions — no new dispatch logic.
 */

import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';

export default function MobileToolsStrip() {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const stageScale = useEditorStore((s) => s.stageScale);
  const setStageScale = useEditorStore((s) => s.setStageScale);
  const showGrid = useEditorStore((s) => s.showGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleShowGrid = useEditorStore((s) => s.toggleShowGrid);
  const toggleSnapToGrid = useEditorStore((s) => s.toggleSnapToGrid);

  const handleDelete = () => {
    if (selectedElementId) {
      dispatch({type: 'DELETE_ELEMENT', elementId: selectedElementId});
      selectElement(null);
    }
  };

  const handleDuplicate = () => {
    if (selectedElementId) {
      dispatch({type: 'DUPLICATE_ELEMENT', elementId: selectedElementId});
    }
  };

  return (
    <div style={{
      height: 46,
      background: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '0 12px',
      flexShrink: 0,
      borderBottom: '1px solid #1F2937',
    }}>
      {/* Zoom out */}
      <button onClick={() => setStageScale(stageScale - 0.25)}
        style={toolBtnStyle} title="Zoom out">−</button>

      {/* Zoom percentage */}
      <span style={{color: '#9CA3AF', fontSize: 12, minWidth: 36, textAlign: 'center'}}>
        {Math.round(stageScale * 100)}%
      </span>

      {/* Zoom in */}
      <button onClick={() => setStageScale(stageScale + 0.25)}
        style={toolBtnStyle} title="Zoom in">+</button>

      <Divider />

      {/* Grid toggle */}
      <button onClick={toggleShowGrid} style={{
        ...toolBtnStyle,
        color: showGrid ? '#60A5FA' : '#6B7280',
        background: showGrid ? '#1E3A5F' : '#1F2937',
        border: showGrid ? '1px solid #3B82F6' : '1px solid #374151',
        fontSize: 12,
        fontWeight: 600,
        gap: 4,
        display: 'flex',
        alignItems: 'center',
      }} title={showGrid ? 'Grid: ON' : 'Grid: OFF'}>
        <span style={{fontSize: 14}}>⊞</span> Grid
      </button>

      {/* Snap toggle */}
      <button onClick={toggleSnapToGrid} style={{
        ...toolBtnStyle,
        color: snapToGrid ? '#60A5FA' : '#6B7280',
        background: snapToGrid ? '#1E3A5F' : '#1F2937',
        border: snapToGrid ? '1px solid #3B82F6' : '1px solid #374151',
        fontSize: 12,
        fontWeight: 600,
        gap: 4,
        display: 'flex',
        alignItems: 'center',
      }} title={snapToGrid ? 'Snap: ON' : 'Snap: OFF'}>
        <span style={{fontSize: 14}}>⦿</span> Snap
      </button>

      <Divider />

      {/* Delete */}
      <button onClick={handleDelete} disabled={!selectedElementId}
        style={{
          ...toolBtnStyle,
          color: selectedElementId ? '#EF4444' : '#4B5563',
          opacity: selectedElementId ? 1 : 0.4,
        }} title="Delete element">🗑</button>

      {/* Duplicate */}
      <button onClick={handleDuplicate} disabled={!selectedElementId}
        style={{
          ...toolBtnStyle,
          opacity: selectedElementId ? 1 : 0.4,
        }} title="Duplicate element">⊕</button>
    </div>
  );
}

function Divider() {
  return <div style={{width: 1, height: 20, background: '#374151'}} />;
}

const toolBtnStyle: React.CSSProperties = {
  background: '#1F2937',
  border: '1px solid #374151',
  color: '#D1D5DB',
  fontSize: 15,
  cursor: 'pointer',
  padding: '5px 10px',
  borderRadius: 6,
  lineHeight: 1,
  minWidth: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
