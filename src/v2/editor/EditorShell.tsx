/**
 * V2 Editor Shell — the full editor layout.
 *
 * Layout (desktop):
 * ┌──────┬──────────────┬──────────┐
 * │Layers│   Stage      │Properties│
 * │Panel │   Viewport   │  Panel   │
 * │      │              │          │
 * └──────┴──────────────┴──────────┘
 *
 * Uses the useEditorState hook for all state management.
 */

import {useEffect, useCallback} from 'react';
import {useEditorState} from './state';
import StageViewport from './StageViewport';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import type {V2Document, V2Element, AspectRatio} from '../schema/document';

type EditorShellProps = {
  document: V2Document;
  aspectRatio?: AspectRatio;
  onDocumentChange?: (doc: V2Document) => void;
};

export default function EditorShell({
  document: initialDocument,
  aspectRatio = '16:9',
  onDocumentChange,
}: EditorShellProps) {
  const editor = useEditorState(initialDocument);

  // Notify parent of document changes
  useEffect(() => {
    onDocumentChange?.(editor.document);
  }, [editor.document, onDocumentChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.selection.elementId) {
          e.preventDefault();
          editor.removeElement(editor.selection.elementId);
        }
      } else if (e.key === 'd' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        if (editor.selection.elementId) {
          editor.duplicateElement(editor.selection.elementId);
        }
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        editor.redo();
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        editor.undo();
      } else if (e.key === 'Escape') {
        editor.selectElement(null);
      } else if (editor.selectedElement && !editor.selectedElement.locked) {
        // Nudge with arrow keys
        const delta = e.shiftKey ? 0.05 : 0.01;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          editor.updateElementTransform(editor.selectedElement.id, {
            y: Math.max(0, editor.selectedElement.transform.y - delta),
          });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          editor.updateElementTransform(editor.selectedElement.id, {
            y: Math.min(1, editor.selectedElement.transform.y + delta),
          });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          editor.updateElementTransform(editor.selectedElement.id, {
            x: Math.max(0, editor.selectedElement.transform.x - delta),
          });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          editor.updateElementTransform(editor.selectedElement.id, {
            x: Math.min(1, editor.selectedElement.transform.x + delta),
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      if (editor.selectedElement) {
        editor.updateElementProps(editor.selectedElement.id, {[key]: value});
      }
    },
    [editor],
  );

  const handleTransformChange = useCallback(
    (field: string, value: number) => {
      if (editor.selectedElement) {
        editor.updateElementTransform(editor.selectedElement.id, {[field]: value});
      }
    },
    [editor],
  );

  // Add a new text element
  const handleAddText = useCallback(() => {
    const newElement: V2Element = {
      id: `text-${Date.now()}`,
      type: 'text' as const,
      name: 'Text',
      visible: true,
      locked: false,
      timing: {startFrame: 0, endFrame: null},
      transform: {
        x: 0.5, y: 0.5, width: 0.6, height: null,
        rotation: 0, anchorX: 0.5, anchorY: 0.5,
        zIndex: editor.activeScene.elements.length + 1,
        opacity: 1,
      },
      responsiveOverrides: {},
      props: {
        content: 'Hello',
        fontFamily: 'Inter',
        fontSize: 72,
        fontWeight: 700,
        fontStyle: 'normal',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#FFFFFF',
        textAlign: 'center',
        verticalAlign: 'middle',
        textTransform: 'none',
        maxLines: null,
        backgroundColor: null,
        padding: 0,
        borderRadius: 0,
      },
      animation: {},
    };
    editor.addElement(newElement);
  }, [editor]);

  const handleAddShape = useCallback(() => {
    const newElement: V2Element = {
      id: `shape-${Date.now()}`,
      type: 'shape' as const,
      name: 'Shape',
      visible: true,
      locked: false,
      timing: {startFrame: 0, endFrame: null},
      transform: {
        x: 0.5, y: 0.5, width: 0.3, height: 0.15,
        rotation: 0, anchorX: 0.5, anchorY: 0.5,
        zIndex: editor.activeScene.elements.length + 1,
        opacity: 1,
      },
      responsiveOverrides: {},
      props: {
        shapeType: 'rectangle',
        fill: '#3182CE',
        stroke: null,
        strokeWidth: 0,
        borderRadius: 0,
      },
      animation: {},
    };
    editor.addElement(newElement);
  }, [editor]);

  return (
    <div style={{display: 'flex', height: '100vh', background: '#F3F4F6'}}>
      {/* Toolbar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 44,
        background: '#1A202C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 100,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{color: '#fff', fontSize: 14, fontWeight: 600}}>Vary.video</span>
          <span style={{color: '#6B7280', fontSize: 11}}>v2 Editor</span>
        </div>
        <div style={{display: 'flex', gap: 6}}>
          <button
            disabled={!editor.canUndo}
            onClick={editor.undo}
            style={toolbarBtnStyle}
            title="Undo (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            disabled={!editor.canRedo}
            onClick={editor.redo}
            style={toolbarBtnStyle}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↪
          </button>
          <div style={{width: 1, height: 20, background: '#374151', margin: '0 8px'}} />
          <button onClick={handleAddText} style={{...toolbarBtnStyle, background: editor.activeTool === 'text' ? '#3B82F6' : 'transparent'}} title="Add Text">
            T
          </button>
          <button onClick={handleAddShape} style={{...toolbarBtnStyle, background: editor.activeTool === 'shape' ? '#3B82F6' : 'transparent'}} title="Add Shape">
            ◻
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{display: 'flex', flex: 1, marginTop: 44}}>
        {/* Layers Panel (left) */}
        <LayersPanel
          elements={editor.activeScene.elements}
          selectedElementId={editor.selection.elementId}
          onSelectElement={editor.selectElement}
          onToggleVisibility={editor.toggleElementVisibility}
          onToggleLock={editor.toggleElementLock}
          onDelete={editor.removeElement}
          onDuplicate={editor.duplicateElement}
          onMoveUp={editor.moveElementUp}
          onMoveDown={editor.moveElementDown}
        />

        {/* Stage (center) */}
        <div style={{flex: 1, background: '#1e1e1e'}}>
          <StageViewport
            scene={editor.activeScene}
            aspectRatio={aspectRatio}
            selectedElementId={editor.selection.elementId}
            onSelectElement={editor.selectElement}
            onElementMove={(id, x, y) => {
              editor.updateElementTransform(id, {x, y});
            }}
            onStageClick={() => editor.selectElement(null)}
          />
        </div>

        {/* Properties Panel (right) */}
        <PropertiesPanel
          element={editor.selectedElement}
          onChangeProp={handlePropChange}
          onChangeTransform={handleTransformChange}
          onClose={() => editor.selectElement(null)}
        />
      </div>
    </div>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#D1D5DB',
  fontSize: 16,
  cursor: 'pointer',
  padding: '4px 10px',
  borderRadius: 4,
};
