/**
 * V2 Mobile Bottom Bar — always-visible action bar (mobile only).
 *
 * Provides quick access to undo/redo, playback, add elements, and layers.
 */

import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';

export default function MobileBottomBar() {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const openMobileSheet = useEditorStore((s) => s.openMobileSheet);
  const playing = useEditorStore((s) => s.playing);
  const togglePlayback = useEditorStore((s) => s.togglePlayback);

  return (
    <div style={{
      height: 56,
      background: '#1A202C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 8px',
      flexShrink: 0,
    }}>
      {/* Left group: undo/redo */}
      <div style={{display: 'flex', gap: 2}}>
        <BarBtn disabled={!canUndo} onClick={() => dispatch({type: 'UNDO'})} title="Undo">
          ↩
        </BarBtn>
        <BarBtn disabled={!canRedo} onClick={() => dispatch({type: 'REDO'})} title="Redo">
          ↪
        </BarBtn>
        <BarBtn
          disabled={!selectedElementId}
          onClick={() => selectedElementId && dispatch({type: 'DELETE_ELEMENT', elementId: selectedElementId})}
          title="Delete"
          style={{color: selectedElementId ? '#F87171' : '#4B5563'}}
        >
          🗑
        </BarBtn>
      </div>

      {/* Center: playback */}
      <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
        <BarBtn onClick={togglePlayback} title={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </BarBtn>
        <span style={{
          color: '#9CA3AF', fontSize: 12, fontFamily: 'monospace',
          minWidth: 36, textAlign: 'center',
        }}>
          <PlaybackFrame />
        </span>
      </div>

      {/* Right group: add + layers */}
      <div style={{display: 'flex', gap: 2}}>
        <BarBtn onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'text'})} title="Add Text">
          T
        </BarBtn>
        <BarBtn onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'shape'})} title="Add Shape">
          ◻
        </BarBtn>
        <BarBtn onClick={() => dispatch({type: 'ADD_ELEMENT', elementType: 'image'})} title="Add Image">
          🖼
        </BarBtn>
        <BarBtn onClick={openMobileSheet} title="Layers & Properties"
          style={{fontSize: 20}}>
          ☰
        </BarBtn>
      </div>
    </div>
  );
}

/** Shows current playback frame or empty when stopped */
function PlaybackFrame() {
  const playing = useEditorStore((s) => s.playing);
  const currentFrame = useEditorStore((s) => s.currentFrame);
  if (!playing) return <span>⏹</span>;
  return <span>{currentFrame}</span>;
}

// ─── Button ──────────────────────────────────────────────────────

function BarBtn({onClick, disabled, children, title, style}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#D1D5DB',
        fontSize: 18,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        padding: '8px 12px',
        borderRadius: 8,
        minWidth: 44,
        minHeight: 44, // Touch target
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
        ...style,
      }}
    />
  );
}
