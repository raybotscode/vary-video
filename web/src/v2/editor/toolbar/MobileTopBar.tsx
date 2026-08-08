/**
 * V2 Mobile Top Bar — compact toolbar for mobile (replaces desktop EditorToolbar).
 *
 * Layout: [✕ back] Untitled [↩] [↪] [⚙ tools]  …spacer…  [16:9] [⬇ export] [▶ play] [☰ layers]
 *
 * The ⚙ button toggles the MobileToolsStrip (zoom/grid/snap/delete/duplicate)
 * which replaces the SceneNavigator in the strip below. Tapping ⚙ again brings
 * the SceneNavigator back.
 */

import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';
import EditableTitle from '../panels/EditableTitle';
import type {AspectRatio} from '@vary/v2/schema/document';
import {ASPECT_RATIOS} from '@vary/v2/schema/document';

export default function MobileTopBar({onBack}: {onBack?: () => void}) {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const playing = useEditorStore((s) => s.playing);
  const togglePlayback = useEditorStore((s) => s.togglePlayback);
  const openMobileLayers = useEditorStore((s) => s.openMobileLayers);
  const openExportPanel = useEditorStore((s) => s.openExportPanel);
  const toolsPanelOpen = useEditorStore((s) => s.toolsPanelOpen);
  const toggleToolsPanel = useEditorStore((s) => s.toggleToolsPanel);

  const handleBack = () => {
    selectElement(null);
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div style={{
      height: 48,
      background: '#1A202C',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2px',
      flexShrink: 0,
      gap: 0,
    }}>
      {/* Back */}
      <TopBtn onClick={handleBack} title="Back to projects">←</TopBtn>

      {/* Project name */}
      <EditableTitle />

      {/* Undo / Redo */}
      <TopBtn onClick={() => dispatch({type: 'UNDO'})} disabled={!canUndo} title="Undo">↩</TopBtn>
      <TopBtn onClick={() => dispatch({type: 'REDO'})} disabled={!canRedo} title="Redo">↪</TopBtn>

      {/* ⚙ Tools toggle — blue when tools panel is open */}
      <TopBtn onClick={toggleToolsPanel} title={toolsPanelOpen ? 'Show scenes' : 'Show tools'}
        style={{color: toolsPanelOpen ? '#60A5FA' : '#9CA3AF', fontSize: 18}}>⚙</TopBtn>

      <div style={{flex: 1}} />

      {/* Aspect ratio */}
      <CyclingAspectRatioBtn />

      {/* Export */}
      <TopBtn onClick={openExportPanel} title="Export"
        style={{color: '#34D399', fontWeight: 700}}>⬇</TopBtn>

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
      fontSize: 16, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.3 : 1,
      padding: '6px 6px', borderRadius: 6,
      minWidth: 34, minHeight: 34,
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
      color: '#93C5FD', fontSize: 10, fontWeight: 600, cursor: 'pointer',
      padding: '3px 6px', borderRadius: 6,
      minWidth: 38, minHeight: 28,
      whiteSpace: 'nowrap',
      display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <span style={{fontSize: 8, color: '#9CA3AF'}}>⇄</span>
      {aspectRatio}
    </button>
  );
}
