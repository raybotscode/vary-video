/**
 * V2 Mobile Top Bar — compact toolbar for mobile (replaces desktop EditorToolbar).
 *
 * Layout: [✕ back] [↩ undo] [↪ redo] [🗑 del] [▶ play] [☰ layers]
 *
 * Always visible at the top of the mobile editor.
 */

import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';
import EditableTitle from '../panels/EditableTitle';
import type {AspectRatio} from '@vary/v2/schema/document';
import {ASPECT_RATIOS} from '@vary/v2/schema/document';

export default function MobileTopBar() {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const playing = useEditorStore((s) => s.playing);
  const togglePlayback = useEditorStore((s) => s.togglePlayback);
  const openMobileSheet = useEditorStore((s) => s.openMobileSheet);
  const openMobileLayers = useEditorStore((s) => s.openMobileLayers);

  const handleBack = () => {
    selectElement(null);
    window.history.back();
  };

  return (
    <div style={{
      height: 48,
      background: '#1A202C',
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px',
      flexShrink: 0,
      gap: 2,
    }}>
      {/* Back */}
      <TopBtn onClick={handleBack} title="Back" style={{color: '#F87171'}}>✕</TopBtn>

      {/* Project name */}
      <EditableTitle />

      {/* Undo / Redo */}
      <TopBtn onClick={() => dispatch({type: 'UNDO'})} disabled={!canUndo} title="Undo">↩</TopBtn>
      <TopBtn onClick={() => dispatch({type: 'REDO'})} disabled={!canRedo} title="Redo">↪</TopBtn>

      {/* Delete */}
      <TopBtn
        onClick={() => {
          if (selectedElementId) {
            dispatch({type: 'DELETE_ELEMENT', elementId: selectedElementId});
            selectElement(null);
          }
        }}
        disabled={!selectedElementId}
        title="Delete"
      >🗑</TopBtn>

      {/* Duplicate */}
      <TopBtn
        onClick={() => selectedElementId && dispatch({type: 'DUPLICATE_ELEMENT', elementId: selectedElementId})}
        disabled={!selectedElementId}
        title="Duplicate"
      >⊕</TopBtn>

      <div style={{flex: 1}} />

      {/* Aspect ratio — single cycling button */}
      <CyclingAspectRatioBtn />

      {/* Export */}
      <ExportBtn />

      {/* Play */}
      <TopBtn onClick={togglePlayback} title={playing ? 'Pause' : 'Play'}
        style={{color: playing ? '#60A5FA' : '#D1D5DB'}}>
        {playing ? '⏸' : '▶'}
      </TopBtn>

      {/* Layers */}
      <TopBtn onClick={openMobileLayers} title="Layers">☰</TopBtn>
    </div>
  );
}

function TopBtn({onClick, disabled, children, title, style}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} style={{
      background: 'transparent', border: 'none',
      color: disabled ? '#4B5563' : '#D1D5DB',
      fontSize: 18, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.3 : 1,
      padding: '6px 10px', borderRadius: 6,
      minWidth: 40, minHeight: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>{children}</button>
  );
}

function CyclingAspectRatioBtn() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const currentIdx = ASPECT_RATIOS.indexOf(aspectRatio);
  const next = ASPECT_RATIOS[(currentIdx + 1) % ASPECT_RATIOS.length];
  return (
    <button onClick={() => setAspectRatio(next)} title={`${aspectRatio} — tap for ${next}`} style={{
      background: '#1E3A5F', border: '1px solid #374151',
      color: '#93C5FD', fontSize: 11, fontWeight: 600, cursor: 'pointer',
      padding: '4px 10px', borderRadius: 6,
      minWidth: 44, minHeight: 32,
      whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{fontSize: 10, color: '#9CA3AF'}}>⇄</span>
      {aspectRatio}
    </button>
  );
}

function ExportBtn() {
  const openExportPanel = useEditorStore((s) => s.openExportPanel);
  return (
    <TopBtn onClick={openExportPanel} title="Export"
      style={{color: '#34D399', fontWeight: 700}}>
      ⬇
    </TopBtn>
  );
}
