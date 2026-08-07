/**
 * V2 Editor Toolbar — top bar with undo/redo, add element, zoom.
 */

import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';

export default function EditorToolbar({onBack}: {onBack?: () => void}) {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const stageScale = useEditorStore((s) => s.stageScale);
  const setStageScale = useEditorStore((s) => s.setStageScale);
  const openMobileSheet = useEditorStore((s) => s.openMobileSheet);

  return (
    <div style={{
      height: 44,
      background: '#1A202C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 100,
      flexShrink: 0,
    }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        {onBack && (
          <button onClick={onBack} style={{...btnStyle, fontSize: 16, padding: '4px 8px'}} title="Back to projects">←</button>
        )}
        <span style={{color: '#fff', fontSize: 14, fontWeight: 600}}>Vary.video</span>
        <span style={{color: '#6B7280', fontSize: 11}}>v2 Editor</span>
      </div>

      <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
        {/* Undo/Redo */}
        <button disabled={!canUndo} onClick={() => dispatch({type: 'UNDO'})}
          style={{...btnStyle, opacity: canUndo ? 1 : 0.4}} title="Undo (Ctrl+Z)">↩</button>
        <button disabled={!canRedo} onClick={() => dispatch({type: 'REDO'})}
          style={{...btnStyle, opacity: canRedo ? 1 : 0.4}} title="Redo (Ctrl+Shift+Z)">↪</button>

        <div style={{width: 1, height: 20, background: '#374151', margin: '0 8px'}} />

        {/* Add elements */}
        <button onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'text'})}
          style={btnStyle} title="Add Text">T</button>
        <button onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'shape'})}
          style={btnStyle} title="Add Shape">◻</button>
        <button onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'image'})}
          style={btnStyle} title="Add Image">🖼</button>

        <div style={{width: 1, height: 20, background: '#374151', margin: '0 8px'}} />

        {/* Delete / Duplicate */}
        <button
          disabled={!selectedElementId}
          onClick={() => selectedElementId && dispatch({type: 'DELETE_ELEMENT', elementId: selectedElementId})}
          style={{...btnStyle, color: selectedElementId ? '#E53E3E' : '#4B5563'}}
          title="Delete (Del)"
        >×</button>
        <button
          disabled={!selectedElementId}
          onClick={() => selectedElementId && dispatch({type: 'DUPLICATE_ELEMENT', elementId: selectedElementId})}
          style={{...btnStyle, opacity: selectedElementId ? 1 : 0.4}}
          title="Duplicate (Ctrl+D)"
        >⊕</button>

        <div style={{width: 1, height: 20, background: '#374151', margin: '0 8px'}} />

        {/* Zoom */}
        <button onClick={() => setStageScale(stageScale - 0.25)} style={btnStyle} title="Zoom out">−</button>
        <span style={{color: '#9CA3AF', fontSize: 11, minWidth: 36, textAlign: 'center'}}>
          {Math.round(stageScale * 100)}%
        </span>
        <button onClick={() => setStageScale(stageScale + 0.25)} style={btnStyle} title="Zoom in">+</button>

        <div style={{width: 1, height: 20, background: '#374151', margin: '0 8px'}}
          className="toolbar-mobile-divider" />

        {/* Mobile: layers & properties sheet toggle */}
        <button onClick={openMobileSheet} style={btnStyle}
          className="toolbar-mobile-btn" title="Layers & Properties">☰</button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#D1D5DB',
  fontSize: 16,
  cursor: 'pointer',
  padding: '4px 10px',
  borderRadius: 4,
};
