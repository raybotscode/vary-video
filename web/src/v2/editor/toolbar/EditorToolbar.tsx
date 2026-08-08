/**
 * V2 Editor Toolbar — top bar with full action set.
 *
 * Layout (compact, one row):
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │ [←] Vary  │ ↩ ↪ │ T □ 🖼 │ × ⊕ │ ▶ ⬇ ☰ │ − 100% + │ ⊞ ⦿            │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';

export default function EditorToolbar({onBack}: {onBack?: () => void}) {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const playing = useEditorStore((s) => s.playing);
  const togglePlayback = useEditorStore((s) => s.togglePlayback);
  const openExportPanel = useEditorStore((s) => s.openExportPanel);
  const openMobileLayers = useEditorStore((s) => s.openMobileLayers);
  const stageScale = useEditorStore((s) => s.stageScale);
  const setStageScale = useEditorStore((s) => s.setStageScale);
  const openMobileSheet = useEditorStore((s) => s.openMobileSheet);
  const showGrid = useEditorStore((s) => s.showGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleShowGrid = useEditorStore((s) => s.toggleShowGrid);
  const toggleSnapToGrid = useEditorStore((s) => s.toggleSnapToGrid);

  return (
    <div style={{
      height: 44,
      background: '#1A202C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      zIndex: 100,
      flexShrink: 0,
    }}>
      {/* ── LEFT ── */}
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        {onBack && (
          <button onClick={onBack} style={{...btnStyle, fontSize: 15, padding: '2px 6px'}} title="Back to projects">←</button>
        )}
        <span style={{color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap'}}>Vary.video</span>
        <span style={{color: '#6B7280', fontSize: 10}}>v2</span>
      </div>

      {/* ── CENTER/RIGHT ── */}
      <div style={{display: 'flex', gap: 2, alignItems: 'center'}}>
        {/* Undo/Redo */}
        <button disabled={!canUndo} onClick={() => dispatch({type: 'UNDO'})}
          style={{...btnStyle, opacity: canUndo ? 1 : 0.35}} title="Undo (Ctrl+Z)">↩</button>
        <button disabled={!canRedo} onClick={() => dispatch({type: 'REDO'})}
          style={{...btnStyle, opacity: canRedo ? 1 : 0.35}} title="Redo (Ctrl+Shift+Z)">↪</button>

        <Divider />

        {/* Add elements */}
        <button onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'text'})}
          style={btnStyle} title="Add Text">T</button>
        <button onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'shape'})}
          style={btnStyle} title="Add Shape">◻</button>
        <button onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'image'})}
          style={btnStyle} title="Add Image">🖼</button>

        <Divider />

        {/* Delete / Duplicate */}
        <button
          disabled={!selectedElementId}
          onClick={() => {
            if (selectedElementId) {
              dispatch({type: 'DELETE_ELEMENT', elementId: selectedElementId});
              selectElement(null);
            }
          }}
          style={{...btnStyle, color: selectedElementId ? '#EF4444' : '#4B5563'}}
          title="Delete (Del)"
        >×</button>
        <button
          disabled={!selectedElementId}
          onClick={() => selectedElementId && dispatch({type: 'DUPLICATE_ELEMENT', elementId: selectedElementId})}
          style={{...btnStyle, opacity: selectedElementId ? 1 : 0.35}}
          title="Duplicate (Ctrl+D)"
        >⊕</button>

        <Divider />

        {/* Play */}
        <button onClick={togglePlayback} title={playing ? 'Pause' : 'Play'}
          style={{...btnStyle, color: playing ? '#60A5FA' : '#D1D5DB'}}>
          {playing ? '⏸' : '▶'}
        </button>

        {/* Export */}
        <button onClick={openExportPanel} title="Export"
          style={{...btnStyle, color: '#34D399', fontSize: 15}}>⬇</button>

        {/* Layers */}
        <button onClick={openMobileLayers} title="Layers"
          style={{...btnStyle}}>☰</button>

        <Divider />

        {/* Zoom */}
        <button onClick={() => setStageScale(stageScale - 0.25)} style={btnStyle} title="Zoom out">−</button>
        <span style={{color: '#9CA3AF', fontSize: 10, minWidth: 32, textAlign: 'center'}}>
          {Math.round(stageScale * 100)}%
        </span>
        <button onClick={() => setStageScale(stageScale + 0.25)} style={btnStyle} title="Zoom in">+</button>

        <Divider />

        {/* Grid & Snap toggles */}
        <button onClick={toggleShowGrid} style={{
          ...btnStyle,
          color: showGrid ? '#60A5FA' : '#4B5563',
          fontSize: 13,
        }} title={showGrid ? 'Grid: ON (click to hide)' : 'Grid: OFF (click to show)'}>⊞</button>
        <button onClick={toggleSnapToGrid} style={{
          ...btnStyle,
          color: snapToGrid ? '#60A5FA' : '#4B5563',
          fontSize: 13,
        }} title={snapToGrid ? 'Snap: ON' : 'Snap: OFF'}>⦿</button>

        <div style={{width: 1, height: 20, background: '#374151', margin: '0 4px'}}
          className="toolbar-mobile-divider" />

        {/* Mobile: layers & properties sheet toggle */}
        <button onClick={openMobileSheet} style={btnStyle}
          className="toolbar-mobile-btn" title="Layers & Properties">☰</button>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{width: 1, height: 20, background: '#374151', margin: '0 4px'}} />;
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#D1D5DB',
  fontSize: 15,
  cursor: 'pointer',
  padding: '3px 7px',
  borderRadius: 4,
  lineHeight: 1,
};
