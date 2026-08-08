# Scene Management — Detailed Implementation Plan

> **Last updated:** 2026-08-08  
> **Scope:** Full scene CRUD, navigator UI, scene properties, multi-scene export, edge cases

---

## Table of Contents

1. [Scene CRUD Commands](#1-scene-crud-commands)
2. [Document Store Changes](#2-document-store-changes)
3. [Scene Navigator Component](#3-scene-navigator-component)
4. [Scene Properties Panel](#4-scene-properties-panel)
5. [Multi-Scene Export Pipeline](#5-multi-scene-export-pipeline)
6. [Editor Layout Integration](#6-editor-layout-integration)
7. [Mobile Behavior](#7-mobile-behavior)
8. [Edge Cases](#8-edge-cases)
9. [Implementation Order](#9-implementation-order)

---

## 1. Scene CRUD Commands

### 1.1 New Command Types (`web/src/v2/commands/types.ts`)

Add the following interfaces after the existing scene commands block (line ~113):

```typescript
// ─── Scene CRUD ────────────────────────────────────────────────────────

export interface AddSceneCommand {
  type: 'ADD_SCENE';
  /** Optional insertion index; defaults to after active scene */
  afterIndex?: number;
  /** Optional name for the new scene */
  name?: string;
}

export interface DeleteSceneCommand {
  type: 'DELETE_SCENE';
  /** Index of scene to delete */
  sceneIndex: number;
}

export interface DuplicateSceneCommand {
  type: 'DUPLICATE_SCENE';
  /** Index of scene to duplicate */
  sceneIndex: number;
}

export interface MoveSceneCommand {
  type: 'MOVE_SCENE';
  /** Current index of scene */
  sceneIndex: number;
  /** Target index after reorder */
  newIndex: number;
}

export interface SetSceneNameCommand {
  type: 'SET_SCENE_NAME';
  /** Index of scene to rename */
  sceneIndex: number;
  name: string;
}

export interface SetActiveSceneCommand {
  type: 'SET_ACTIVE_SCENE';
  sceneIndex: number;
}
```

Add these to the `BaseEditorCommand` union at line ~164:

```typescript
type BaseEditorCommand =
  | AddElementCommand
  // ... existing ...
  | SetSceneBackgroundCommand
  | SetSceneDurationCommand
  // ─── NEW ───
  | AddSceneCommand
  | DeleteSceneCommand
  | DuplicateSceneCommand
  | MoveSceneCommand
  | SetSceneNameCommand
  | SetActiveSceneCommand
  // ─── existing ───
  | AddMergeTagCommand
  // ... rest ...
```

### 1.2 Command Handlers (`web/src/v2/commands/commands.ts`)

Add after the existing scene block (~line 296), before the merge tags section:

```typescript
    // ─── Scene CRUD ─────────────────────────────────────────────

    case 'ADD_SCENE': {
      const insertAfter = command.afterIndex ?? activeSceneIndex;
      const sceneNumber = document.scenes.length + 1;
      const newScene: V2Scene = {
        id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: command.name ?? `Scene ${sceneNumber}`,
        durationFrames: 90, // default 3 seconds @ 30fps
        background: {type: 'gradient', color1: '#FFFFFF', color2: '#F7FAFC', angle: 135},
        elements: [],
      };
      const scenes = [...document.scenes];
      scenes.splice(insertAfter + 1, 0, newScene);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'DELETE_SCENE': {
      // Guard: must keep at least 1 scene
      if (document.scenes.length <= 1) return {document, shouldRecord: false};
      const scenes = document.scenes.filter((_, i) => i !== command.sceneIndex);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'DUPLICATE_SCENE': {
      const source = document.scenes[command.sceneIndex];
      if (!source) return {document, shouldRecord: false};
      const dupScene: V2Scene = {
        ...structuredClone(source),
        id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `${source.name} (copy)`,
      };
      const scenes = [...document.scenes];
      scenes.splice(command.sceneIndex + 1, 0, dupScene);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'MOVE_SCENE': {
      const scenes = [...document.scenes];
      const [moved] = scenes.splice(command.sceneIndex, 1);
      if (!moved) return {document, shouldRecord: false};
      scenes.splice(command.newIndex, 0, moved);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'SET_SCENE_NAME': {
      const trimmed = command.name.trim();
      if (!trimmed) return {document, shouldRecord: false};
      return {
        document: {
          ...document,
          scenes: document.scenes.map((s, i) =>
            i === command.sceneIndex ? {...s, name: trimmed} : s,
          ),
        },
        shouldRecord,
      };
    }

    case 'SET_ACTIVE_SCENE': {
      // Validate index
      if (command.sceneIndex < 0 || command.sceneIndex >= document.scenes.length) {
        return {document, shouldRecord: false};
      }
      // No document mutation - handled at store level for history management
      return {document, shouldRecord: false};
    }
```

**Key design decisions:**
- `DELETE_SCENE` has guard clause: `scenes.length <= 1` → no-op
- `DUPLICATE_SCENE` uses `structuredClone` for deep clone (same pattern as `DUPLICATE_ELEMENT`)
- `MOVE_SCENE` uses splice for reindex (same pattern as `MOVE_ELEMENT`)
- `SET_ACTIVE_SCENE` returns `shouldRecord: false` because switching scenes is a navigation action, not a document mutation — but the store handles history scope switching (see below)

> **NOTE:** `applyCommand()` currently takes `(document, activeSceneIndex, command)` and returns `DispatchResult`. The scene CRUD commands need `activeSceneIndex` only for `ADD_SCENE`'s default `afterIndex`. This is already passed. ✓

---

## 2. Document Store Changes

### 2.1 Per-Scene History (`web/src/v2/stores/documentStore.ts`)

**Current state (line 67-70):**
```typescript
const history = new HistoryManager();

const pushHistory = (doc: V2Document, description: string) => {
  history.push(doc, get().activeSceneIndex, description);
  set({document: doc, canUndo: history.canUndo(), canRedo: history.canRedo()});
};
```

**Problem:** A single `HistoryManager` instance means undo/redo across scene switches is confusing. When you switch from Scene 1 to Scene 2 and undo, you're undoing Scene 2's history — but the HistoryManager still has Scene 1's entries.

**New design:** Replace single `HistoryManager` with a `Map<string, HistoryManager>` keyed by scene ID.

```typescript
// Replace single history (line 67) with:
const sceneHistories = new Map<string, HistoryManager>();

function getHistory(sceneId: string): HistoryManager {
  let h = sceneHistories.get(sceneId);
  if (!h) {
    h = new HistoryManager();
    sceneHistories.set(sceneId, h);
  }
  return h;
}

function updateUndoRedoState() {
  const {document, activeSceneIndex} = get();
  const sceneId = document.scenes[activeSceneIndex]?.id;
  const h = sceneId ? sceneHistories.get(sceneId) : null;
  set({
    canUndo: h?.canUndo() ?? false,
    canRedo: h?.canRedo() ?? false,
  });
}
```

**Modify `pushHistory`:**
```typescript
const pushHistory = (doc: V2Document, description: string) => {
  const sceneId = doc.scenes[get().activeSceneIndex]?.id;
  if (sceneId) {
    const h = getHistory(sceneId);
    h.push(doc, get().activeSceneIndex, description);
  }
  set({document: doc});
  updateUndoRedoState();
};
```

**Modify undo/redo in dispatch (lines 86-112):**
```typescript
if (command.type === 'UNDO') {
  const {document, activeSceneIndex} = get();
  const sceneId = document.scenes[activeSceneIndex]?.id;
  const h = sceneId ? sceneHistories.get(sceneId) : null;
  if (!h) return;
  const prevScene = h.undo();
  if (prevScene) {
    const newDoc = {
      ...document,
      scenes: document.scenes.map((s, i) =>
        i === activeSceneIndex ? prevScene : s,
      ),
    };
    set({document: newDoc});
    updateUndoRedoState();
  }
  return;
}

if (command.type === 'REDO') {
  // ... same pattern, use h.redo() ...
}
```

### 2.2 Set Active Scene Action

Add a `setActiveSceneIndex` action for direct navigation (non-command):

```typescript
export interface DocumentState {
  // ... existing ...
  activeSceneIndex: number;
  setActiveSceneIndex: (index: number) => void;  // NEW
  // ...
}
```

Implementation in the store creator:
```typescript
setActiveSceneIndex: (index: number) => {
  const {document} = get();
  if (index < 0 || index >= document.scenes.length) return;
  set({activeSceneIndex: index});
  updateUndoRedoState();
},
```

### 2.3 Modifications to Existing Flow

**UNDO/REDO dispatch (lines 86-112):** Currently directly accesses `history`. Change to use `getHistory(sceneId)` as shown above.

**loadDocument (line 139-155):** Clear all scene histories:
```typescript
sceneHistories.clear();
// Initialize history for first scene
const firstSceneId = validated.scenes[0]?.id;
if (firstSceneId) {
  const h = getHistory(firstSceneId);
  h.push(validated, 0, 'Load document');
}
```

**reset (line 157-167):** Same — clear all and init first scene history.

---

## 3. Scene Navigator Component

### 3.1 New File: `web/src/v2/editor/scenes/SceneNavigator.tsx`

**Location:** New directory `web/src/v2/editor/scenes/` (parallel to `panels/`, `toolbar/`)

**Design spec:**

```
┌──────────────────────────────────────────────────────────────────┐
│ [+ Add] │ [Scene 1 █] │ [Scene 2  ] │ [Scene 3  ] │ ...         │
│         │   3s ×       │   2s ×      │   5s ×      │            │
└──────────────────────────────────────────────────────────────────┘
```

- **Height:** 48px
- **Background:** `#111827` (darker than toolbar `#1A202C`)
- **Horizontal scroll:** overflow-x: auto, no scrollbar (scrollbar-width: none)
- **[+ Add Scene] button:** Fixed at left, 44×44px, `#2D3748` bg, hover `#374151`, blue `#3B82F6` on hover
- **Scene cards:** 
  - Width: 120px, height: 36px
  - Border-radius: 8px
  - Active: blue border `2px solid #3B82F6`, bg `#1E3A5F`
  - Inactive: border `1px solid #374151`, bg `#1F2937`
  - Shows: scene name (editable on double-click), duration in seconds
  - Delete button (×): positioned top-right, visible on hover, hidden for last scene
- **Drag to reorder:** HTML5 drag-and-drop with `draggable`, `onDragStart`, `onDragOver`, `onDrop`
- **Click:** sets active scene via `setActiveSceneIndex`

```typescript
import {useState, useCallback, useRef} from 'react';
import {useDocumentStore} from '../../stores/documentStore';
import type {V2Scene} from '@vary/v2/schema/document';

export default function SceneNavigator() {
  const document = useDocumentStore((s) => s.document);
  const activeSceneIndex = useDocumentStore((s) => s.activeSceneIndex);
  const setActiveSceneIndex = useDocumentStore((s) => s.setActiveSceneIndex);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const scenes = document.scenes;
  const fps = document.fps;

  // Drag reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Inline rename state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleAddScene = () => {
    dispatch({type: 'ADD_SCENE'});
  };

  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) return; // guard
    const newActiveIndex = index >= activeSceneIndex
      ? Math.max(0, activeSceneIndex - (index <= activeSceneIndex ? 1 : 0))
      : activeSceneIndex;
    
    dispatch({type: 'DELETE_SCENE', sceneIndex: index});
    // If we deleted the active scene or a scene before it, adjust index
    if (index <= activeSceneIndex) {
      setActiveSceneIndex(newActiveIndex);
    } else {
      setActiveSceneIndex(activeSceneIndex);
    }
  };

  const handleDoubleClick = (index: number, name: string) => {
    setEditingIndex(index);
    setEditName(name);
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const commitRename = (index: number) => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== scenes[index]?.name) {
      dispatch({type: 'SET_SCENE_NAME', sceneIndex: index, name: trimmed});
    }
    setEditingIndex(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== targetIndex) {
      dispatch({type: 'MOVE_SCENE', sceneIndex: dragIndex, newIndex: targetIndex});
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const formatDuration = (frames: number): string => {
    const seconds = frames / fps;
    return seconds >= 1 ? `${seconds.toFixed(1)}s` : `${frames}f`;
  };

  return (
    <div style={{
      height: 48,
      background: '#111827',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      gap: 6,
      overflowX: 'auto',
      overflowY: 'hidden',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      flexShrink: 0,
      borderBottom: '1px solid #1F2937',
    }}>
      {/* Add Scene button */}
      <button
        onClick={handleAddScene}
        title="Add Scene"
        style={{
          width: 36, height: 36,
          borderRadius: 8,
          background: '#2D3748',
          border: '1px dashed #4B5563',
          color: '#9CA3AF',
          fontSize: 18,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#374151';
          e.currentTarget.style.color = '#3B82F6';
          e.currentTarget.style.borderColor = '#3B82F6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#2D3748';
          e.currentTarget.style.color = '#9CA3AF';
          e.currentTarget.style.borderColor = '#4B5563';
        }}
      >
        +
      </button>

      {/* Divider */}
      <div style={{width: 1, height: 24, background: '#374151', flexShrink: 0}} />

      {/* Scene cards */}
      {scenes.map((scene, index) => {
        const isActive = index === activeSceneIndex;
        const isDragging = index === dragIndex;
        const isDragOver = index === dragOverIndex && index !== dragIndex;
        const isEditing = index === editingIndex;

        return (
          <div
            key={scene.id}
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
            onClick={() => setActiveSceneIndex(index)}
            onDoubleClick={() => handleDoubleClick(index, scene.name)}
            title={`${scene.name} — ${formatDuration(scene.durationFrames)}`}
            style={{
              position: 'relative',
              flexShrink: 0,
              minWidth: 100,
              height: 36,
              borderRadius: 8,
              border: isActive
                ? '2px solid #3B82F6'
                : isDragOver
                  ? '2px dashed #6366F1'
                  : '1px solid #374151',
              background: isActive ? '#1E3A5F' : '#1F2937',
              cursor: isEditing ? 'text' : 'pointer',
              opacity: isDragging ? 0.5 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 8px',
              transition: 'border 0.15s, background 0.15s',
              userSelect: 'none',
            }}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => commitRename(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(index);
                  if (e.key === 'Escape') setEditingIndex(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #3B82F6',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  outline: 'none',
                  padding: 0,
                }}
              />
            ) : (
              <>
                <span style={{
                  color: isActive ? '#fff' : '#D1D5DB',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: 1.2,
                }}>
                  {scene.name}
                </span>
                <span style={{
                  color: isActive ? '#93C5FD' : '#9CA3AF',
                  fontSize: 10,
                  lineHeight: 1.2,
                }}>
                  {formatDuration(scene.durationFrames)}
                </span>
              </>
            )}

            {/* Delete button — hidden for last scene */}
            {scenes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteScene(index);
                }}
                title="Delete scene"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#374151',
                  border: '1px solid #4B5563',
                  color: '#9CA3AF',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.1s, background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EF4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#374151';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
                className="scene-delete-btn"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* CSS for showing delete button on card hover */}
      <style>{`
        .scene-delete-btn {
          opacity: 0;
        }
        [style*="position: relative"]:hover .scene-delete-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
```

**Note:** The CSS hover approach above is fragile. Better approach: track `hoveredSceneIndex` in a `useState` and conditionally set delete button opacity.

---

## 4. Scene Properties Panel

### 4.1 Modify `web/src/v2/editor/panels/PropertiesPanel.tsx`

**Current behavior (line 106-116):** When no element is selected, shows "Select an element to edit" placeholder.

**New behavior:** When no element is selected, show "Scene Properties" section with scene-level controls.

Replace lines 106-117:

```typescript
  if (!element || !def) {
    // ─── Scene Properties (no element selected) ──────────────────
    const activeScene = useDocumentStore((s) => s.getActiveScene())();
    const activeSceneIndex = useDocumentStore((s) => s.activeSceneIndex);
    const scenes = useDocumentStore((s) => s.document.scenes);
    const fps = useDocumentStore((s) => s.document.fps);
    
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={{fontSize: 13, fontWeight: 600, color: '#374151'}}>
            🎬 Scene Properties
          </span>
        </div>

        <div style={{padding: '12px 16px', borderBottom: '1px solid #E5E7EB'}}>
          <div style={{fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8}}>Scene</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {/* Scene Name */}
            <LabeledInput
              textInput
              label="Name"
              value={activeScene.name}
              onChange={(v) => dispatch({
                type: 'SET_SCENE_NAME',
                sceneIndex: activeSceneIndex,
                name: String(v),
              })}
            />

            {/* Duration */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
              <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF'}}>Duration (seconds)</label>
              <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                <input
                  type="number"
                  value={(activeScene.durationFrames / fps).toFixed(1)}
                  onChange={(e) => {
                    const seconds = parseFloat(e.target.value);
                    if (isNaN(seconds) || seconds <= 0) return;
                    const frames = Math.round(seconds * fps);
                    dispatch({
                      type: 'SET_SCENE_DURATION',
                      durationFrames: Math.max(1, Math.min(9000, frames)),
                    });
                  }}
                  min={1 / fps}
                  max={300}
                  step={0.1}
                  style={{
                    width: '100%', padding: '3px 6px', fontSize: 11,
                    border: '1px solid #E5E7EB', borderRadius: 4,
                    boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span style={{fontSize: 10, color: '#9CA3AF', minWidth: 16}}>s</span>
              </div>
              <span style={{fontSize: 9, color: '#9CA3AF'}}>
                = {activeScene.durationFrames} frames @ {fps}fps
              </span>
            </div>
          </div>
        </div>

        {/* Background Type Picker */}
        <div style={{padding: '12px 16px', borderBottom: '1px solid #E5E7EB'}}>
          <div style={{fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8}}>Background</div>
          <div style={{display: 'flex', gap: 4, marginBottom: 8}}>
            {(['solid', 'gradient', 'image'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  if (type === 'solid') {
                    dispatch({type: 'SET_SCENE_BACKGROUND', background: {
                      type: 'solid',
                      color: activeScene.background.type === 'solid'
                        ? activeScene.background.color : '#FFFFFF',
                    }});
                  } else if (type === 'gradient') {
                    dispatch({type: 'SET_SCENE_BACKGROUND', background: {
                      type: 'gradient',
                      color1: '#FFFFFF',
                      color2: '#F7FAFC',
                      angle: 135,
                    }});
                  } else {
                    dispatch({type: 'SET_SCENE_BACKGROUND', background: {
                      type: 'image',
                      src: '',
                      opacity: 0.16,
                    }});
                  }
                }}
                style={{
                  flex: 1, padding: '6px 8px',
                  background: activeScene.background.type === type ? '#1E3A5F' : '#F3F4F6',
                  border: activeScene.background.type === type
                    ? '1px solid #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: 6, cursor: 'pointer',
                  color: activeScene.background.type === type ? '#fff' : '#374151',
                  fontSize: 11, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {type === 'solid' ? '🎨 Solid' : type === 'gradient' ? '🌈 Gradient' : '🖼 Image'}
              </button>
            ))}
          </div>

          {/* Color/gradient pickers based on type */}
          {activeScene.background.type === 'solid' && (
            <div>
              <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 4}}>
                Color
              </label>
              <div style={{display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4}}>
                {COLOR_SWATCHES.map((color) => (
                  <button key={color} onClick={() => dispatch({
                    type: 'SET_SCENE_BACKGROUND',
                    background: {...activeScene.background, color},
                  })} style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: activeScene.background.color === color
                      ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    background: color, cursor: 'pointer', padding: 0,
                  }} />
                ))}
              </div>
              <input type="text" value={activeScene.background.color}
                onChange={(e) => dispatch({
                  type: 'SET_SCENE_BACKGROUND',
                  background: {...activeScene.background, color: e.target.value},
                })}
                style={{
                  width: '100%', padding: '3px 6px', fontSize: 11,
                  border: '1px solid #E5E7EB', borderRadius: 4,
                  fontFamily: 'monospace', boxSizing: 'border-box',
                }} />
            </div>
          )}

          {activeScene.background.type === 'gradient' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <div>
                <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 4}}>
                  Color 1
                </label>
                <input type="text" value={activeScene.background.color1}
                  onChange={(e) => dispatch({
                    type: 'SET_SCENE_BACKGROUND',
                    background: {...activeScene.background, color1: e.target.value},
                  })}
                  style={{
                    width: '100%', padding: '3px 6px', fontSize: 11,
                    border: '1px solid #E5E7EB', borderRadius: 4,
                    fontFamily: 'monospace', boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 4}}>
                  Color 2
                </label>
                <input type="text" value={activeScene.background.color2}
                  onChange={(e) => dispatch({
                    type: 'SET_SCENE_BACKGROUND',
                    background: {...activeScene.background, color2: e.target.value},
                  })}
                  style={{
                    width: '100%', padding: '3px 6px', fontSize: 11,
                    border: '1px solid #E5E7EB', borderRadius: 4,
                    fontFamily: 'monospace', boxSizing: 'border-box',
                  }} />
              </div>
              <div>
                <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF', display: 'block', marginBottom: 4}}>
                  Angle: {activeScene.background.angle}°
                </label>
                <input type="range" min={0} max={360} step={15}
                  value={activeScene.background.angle}
                  onChange={(e) => dispatch({
                    type: 'SET_SCENE_BACKGROUND',
                    background: {...activeScene.background, angle: Number(e.target.value)},
                  })}
                  style={{width: '100%', height: 4, cursor: 'pointer'}} />
              </div>
            </div>
          )}

          {activeScene.background.type === 'image' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <LabeledInput textInput label="Image URL"
                value={activeScene.background.src}
                onChange={(v) => dispatch({
                  type: 'SET_SCENE_BACKGROUND',
                  background: {...activeScene.background, src: String(v)},
                })} />
              <LabeledInput label="Opacity"
                value={Math.round(activeScene.background.opacity * 100)}
                onChange={(v) => dispatch({
                  type: 'SET_SCENE_BACKGROUND',
                  background: {...activeScene.background, opacity: Number(v) / 100},
                })} suffix="%" min={0} max={100} />
            </div>
          )}
        </div>

        {/* Scene Info */}
        <div style={{padding: '12px 16px', fontSize: 10, color: '#9CA3AF'}}>
          Scene {activeSceneIndex + 1} of {scenes.length} · ID: {activeScene.id}
        </div>
      </div>
    );
  }
```

**Important:** The `getActiveScene()` function at line 124-127 needs to be accessible. Currently it's used with `useDocumentStore((s) => s.getActiveScene)()`. We need to either call it inline or use `useDocumentStore((s) => s.document.scenes[s.activeSceneIndex])` directly.

Since we're already reading `activeSceneIndex` from the store, use:
```typescript
const activeScene = document.scenes[activeSceneIndex] ?? document.scenes[0];
```

---

## 5. Multi-Scene Export Pipeline

### 5.1 Current Single-Scene Render Flow

**`src/compositions/V2Native/V2Native.tsx` (lines 539-575):**

The `V2Native` composition already handles multi-scene rendering! It:
1. Builds `positionedScenes` array with `startFrame` computed from cumulative durations (line 551-555)
2. Finds the current scene by checking which frame range `currentFrame` falls into (lines 558-563)
3. Renders only the current scene via `SceneView` (line 573)

**This works correctly for multi-scene.** The single Remotion composition cycles through all scenes automatically when rendered with `renderMedia` because Remotion calls `useCurrentFrame()` from 0 to `durationInFrames - 1`.

### 5.2 Duration Calculation

**`src/compositions/V2Native/schema.ts` (lines 62-64):**

```typescript
export function getV2DocumentDuration(document: V2Document): number {
  return document.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
}
```

This already sums all scene durations. ✓

### 5.3 What Needs to Change for Export

The export pipeline is already multi-scene capable because:

1. `V2Native` iterates over positioned scenes based on `currentFrame`
2. `getV2DocumentDuration` computes total frames from all scenes
3. `renderMedia` receives total `durationInFrames` from `calculateMetadata`
4. The API's `renderBatch` → `renderVariant` → `renderMedia` uses `selectComposition` which gets the composition config

**The only thing needed:** Ensure that `calculateMetadata` is properly set up in `src/index.ts` to pass `durationInFrames` computed from `getV2DocumentDuration`.

Let's check if there's a `calculateMetadata` in the root composition:

### 5.4 Verify Render Entry Point

Check `src/index.ts` to ensure `calculateMetadata` passes total duration. If not, add:

```typescript
// In the Remotion Root or V2Native registration:
export const calculateMetadata: CalculateMetadataFunction<V2NativeProps> = ({props}) => {
  const duration = getV2DocumentDuration(props.document);
  const dimensions = ASPECT_DIMENSIONS[props.document.defaultAspectRatio];
  return {
    durationInFrames: duration,
    width: dimensions.width,
    height: dimensions.height,
    fps: props.fps || props.document.fps,
  };
};
```

### 5.5 What Does NOT Need Changing

- `api/src/routes/render.ts` — no changes needed. It sends templates through `renderBatch` which uses `renderMedia` on `V2Native`, which already handles multi-scene.
- `api/src/services/renderer.ts` — no changes needed. It uses `selectComposition` + `renderMedia`.
- `src/compositions/V2Native/V2Native.tsx` — no changes needed; already handles multi-scene.

**Summary:** The export pipeline natively supports multi-scene. The only gap is ensuring `calculateMetadata` passes total scene duration. This is already partially in place via `getV2DocumentDuration`.

---

## 6. Editor Layout Integration

### 6.1 Modify `web/src/v2/editor/Editor.tsx`

Insert `SceneNavigator` between the toolbar and the main content area (after line 170, before line 173):

```typescript
import SceneNavigator from './scenes/SceneNavigator';

// ... in the JSX, after the toolbar divs (lines 165-170), before the main content area:

      {/* ── Scene Navigator (desktop + mobile) ── */}
      <SceneNavigator />

      {/* ── Main content area ── */}
      <div style={{display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0}}>
```

### 6.2 Modify `web/src/v2/editor/Stage.tsx`

The Stage already reads `activeSceneIndex` (line 41) and uses it to get the current scene (line 61). No changes needed — it automatically reflects scene switches. ✓

### 6.3 Modify `web/src/v2/editor/toolbar/EditorToolbar.tsx`

Add scene navigation shortcuts to the toolbar:

```typescript
// After the zoom controls (line 77), before mobile divider:

<div style={{width: 1, height: 20, background: '#374151', margin: '0 8px'}} />

{/* Scene Navigation */}
<button onClick={() => setActiveSceneIndex(Math.max(0, activeSceneIndex - 1))}
  disabled={activeSceneIndex <= 0}
  style={{...btnStyle, opacity: activeSceneIndex <= 0 ? 0.3 : 1}} title="Previous Scene">
  ◀ Scene
</button>
<span style={{color: '#9CA3AF', fontSize: 11, minWidth: 60, textAlign: 'center'}}>
  {activeSceneIndex + 1}/{scenes.length}
</span>
<button onClick={() => setActiveSceneIndex(Math.min(scenes.length - 1, activeSceneIndex + 1))}
  disabled={activeSceneIndex >= scenes.length - 1}
  style={{...btnStyle, opacity: activeSceneIndex >= scenes.length - 1 ? 0.3 : 1}} title="Next Scene">
  Scene ▶
</button>
```

Need to add these selectors at the top of `EditorToolbar`:
```typescript
const activeSceneIndex = useDocumentStore((s) => s.activeSceneIndex);
const setActiveSceneIndex = useDocumentStore((s) => s.setActiveSceneIndex);
const scenes = useDocumentStore((s) => s.document.scenes);
```

### 6.4 Modify `web/src/v2/editor/panels/LayersPanel.tsx`

Already uses `getElements()` which reads from active scene. No changes needed. ✓

---

## 7. Mobile Behavior

### 7.1 Scene Navigator on Mobile

The `SceneNavigator` component is inherently responsive — it's a horizontal scroll strip. On mobile it should remain visible above the Stage but below the `MobileTopBar`.

Add CSS to hide on very small screens per Editor.tsx responsive rules (already hidden via CSS media queries for `.mobile-bottom-panel`). The SceneNavigator stays visible.

### 7.2 MobileBottomPanel "Scenes" Tab

In `MobileBottomPanel.tsx`, the "Scenes" button (line 225: `{icon: '🎞', label: 'Scenes'}`) currently does `openGallery('scenes')`. Instead, when on mobile, it should show scene management directly in the bottom panel.

Add a new tab `'scenes'` to the `Tab` type and add a `ScenesPanel` component:

```typescript
// In getTabs() (line 159), always include 'scenes' in the 'add' tab list
// (it's already in HOME_TOOLS, just handled via gallery currently)

function ScenesPanel() {
  const scenes = useDocumentStore((s) => s.document.scenes);
  const activeSceneIndex = useDocumentStore((s) => s.activeSceneIndex);
  const setActiveSceneIndex = useDocumentStore((s) => s.setActiveSceneIndex);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  return (
    <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{color: '#D1D5DB', fontSize: 14, fontWeight: 600}}>Scenes</span>
        <button onClick={() => dispatch({type: 'ADD_SCENE'})}
          style={{
            background: '#3B82F6', color: '#fff', border: 'none',
            borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>
          + Add Scene
        </button>
      </div>

      {scenes.map((scene, index) => (
        <div key={scene.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          background: index === activeSceneIndex ? '#1E3A5F' : '#2D3748',
          border: index === activeSceneIndex ? '1px solid #3B82F6' : '1px solid #374151',
        }}>
          <button onClick={() => setActiveSceneIndex(index)}
            style={{
              flex: 1, background: 'none', border: 'none', color: '#E2E8F0',
              textAlign: 'left', cursor: 'pointer', fontSize: 13,
            }}>
            {scene.name}
            <span style={{color: '#9CA3AF', fontSize: 11, marginLeft: 8}}>
              {(scene.durationFrames / 30).toFixed(1)}s
            </span>
          </button>
          <button onClick={() => {
            setEditingIndex(index);
            setEditName(scene.name);
          }} style={mobileIconBtn} title="Rename">✎</button>
          {scenes.length > 1 && (
            <button onClick={() => dispatch({type: 'DELETE_SCENE', sceneIndex: index})}
              style={{...mobileIconBtn, color: '#EF4444'}} title="Delete">×</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

Add to the tab rendering (after line 151):
```typescript
{tab === 'scenes' && <ScenesPanel />}
```

---

## 8. Edge Cases

### 8.1 Switching Scenes During a Drag Operation

**Problem:** User starts dragging an element in Scene 1, then clicks Scene 2 in the navigator (or uses keyboard shortcut).

**Solution:** In the `setActiveSceneIndex` action, check if there's an active interaction:

```typescript
setActiveSceneIndex: (index: number) => {
  const {document} = get();
  if (index < 0 || index >= document.scenes.length) return;
  
  // Cancel any active interaction in the editor store
  const editorState = useEditorStore.getState();
  if (editorState.interaction.type !== 'none') {
    editorState.endDrag();
    editorState.endResize();
    editorState.endRotate();
  }
  // Deselect element when switching scenes
  editorState.selectElement(null);
  
  set({activeSceneIndex: index});
  updateUndoRedoState();
},
```

### 8.2 Undo/Redo Across Scene Switches

**Problem:** User makes edits in Scene 1, switches to Scene 2, then presses Ctrl+Z. What happens?

**Solution:** Per-scene `HistoryManager` Map (Section 2.1). Each scene has its own undo stack. When you switch scenes:
- The `canUndo`/`canRedo` state updates to reflect the new active scene's history
- Ctrl+Z undoes the last action in the *current* scene, not the previous one
- This is the expected behavior (most video editors work this way)

**Cross-scene commands** (like DELETE_SCENE which affects the scenes array, not a specific scene's elements) still need history tracking. These affect the document structure, not scene-specific content. For simplicity, DELETE_SCENE/MOVE_SCENE/DUPLICATE_SCENE/ADD_SCENE push to the currently active scene's history but snapshot the full scenes array entry.

Actually, a cleaner approach: scene-structural commands should push to a separate "document-level" history. But that's a lot of complexity. Simpler approach:

**Simplified approach:** Keep the existing `HistoryManager` for document-level structural changes (add/delete/move/duplicate scenes), and add per-scene `HistoryManager` for element-level changes. But this is complex. 

**Even simpler approach:** Just use per-scene history and also record structural changes in the current scene's history. It works because:
- ADD_SCENE: records state in the scene that was active when add happened
- DELETE_SCENE: records state in the scene that was active when delete happened
- This may seem odd but it works fine in practice since structural changes are rare

### 8.3 Copy/Paste Elements Between Scenes

**Problem:** User copies an element in Scene 1 and wants to paste it in Scene 2.

**Solution:** 
1. Store a `clipboardElement: V2Element | null` in the `DocumentState` interface
2. On Ctrl+C: `set({clipboardElement: deepClone(selectedElement)})`
3. On Ctrl+V: if `clipboardElement` is set, dispatch `ADD_ELEMENT` but with custom creation logic that copies the clipboard element

```typescript
// In DocumentState interface:
clipboardElement: V2Element | null;
copyElement: (id: string) => void;
pasteElement: () => void;

// Implementation:
copyElement: (id) => {
  const el = get().getElement(id);
  if (el) set({clipboardElement: structuredClone(el)});
},
pasteElement: () => {
  const {clipboardElement, activeSceneIndex, document} = get();
  if (!clipboardElement) return;
  const newId = generateElementId(clipboardElement.type);
  const pasted = {
    ...structuredClone(clipboardElement),
    id: newId,
    name: `${clipboardElement.name} (pasted)`,
    transform: {
      ...clipboardElement.transform,
      x: clamp(clipboardElement.transform.x + 0.02, 0, 1),
      y: clamp(clipboardElement.transform.y + 0.02, 0, 1),
    },
  };
  const newDoc = {
    ...document,
    scenes: document.scenes.map((s, i) =>
      i === activeSceneIndex
        ? {...s, elements: [...s.elements, pasted]}
        : s,
    ),
  };
  pushHistory(newDoc, 'PASTE_ELEMENT');
  set({document: newDoc});
},
```

### 8.4 Playback Across Scenes

**Problem:** When playing back, the current frame advances past scene boundaries.

**Solution:** The `playbackKey`-based rendering in Stage.tsx (line 209: `key={`stage-${playbackKey}`}`) only remounts when playback starts. When `currentFrame` exceeds the active scene's duration, we need to auto-switch scenes.

Add to the playback ticker in Editor.tsx (lines 74-93):

```typescript
const tick = (now: number) => {
  const dt = now - lastTime;
  const frameAdvance = Math.floor((dt / 1000) * fps);
  if (frameAdvance > 0) {
    lastTime = now;
    const store = useEditorStore.getState();
    const docStore = useDocumentStore.getState();
    const newFrame = store.currentFrame + frameAdvance;
    
    // Check for scene boundary crossing
    const activeScene = docStore.document.scenes[docStore.activeSceneIndex];
    if (activeScene && newFrame >= activeScene.durationFrames) {
      // Advance to next scene
      const nextIndex = docStore.activeSceneIndex + 1;
      if (nextIndex < docStore.document.scenes.length) {
        docStore.setActiveSceneIndex(nextIndex);
        setCurrentFrame(0); // Reset to start of next scene
        return;
      } else {
        // End of video — stop playback
        const togglePlayback = useEditorStore.getState().togglePlayback;
        togglePlayback();
        return;
      }
    }
    
    setCurrentFrame(newFrame);
  }
  rafRef.current = requestAnimationFrame(tick);
};
```

**However**, this introduces complexity with frame tracking across scenes. A simpler initial approach:

- During playback, render all scenes sequentially in a single virtual timeline
- Track `globalFrame` instead of per-scene `currentFrame`
- In Stage.tsx, determine which scene to render based on `globalFrame`

But this conflicts with the current per-scene approach. **Recommendation:** Ship scene management with per-scene playback first (play button plays current scene only), add cross-scene playback in a follow-up PR.

### 8.5 Keyboard Shortcuts for Scene Navigation

Add to the keyboard handler in Editor.tsx (after line 155):

```typescript
} else if (e.key === '[' && mod && e.shiftKey) {
  // Ctrl+Shift+[ : Previous scene (Cmd+Shift+[ on Mac)
  e.preventDefault();
  const {activeSceneIndex, setActiveSceneIndex} = useDocumentStore.getState();
  setActiveSceneIndex(Math.max(0, activeSceneIndex - 1));
} else if (e.key === ']' && mod && e.shiftKey) {
  // Ctrl+Shift+] : Next scene
  e.preventDefault();
  const {activeSceneIndex, document, setActiveSceneIndex} = useDocumentStore.getState();
  setActiveSceneIndex(Math.min(document.scenes.length - 1, activeSceneIndex + 1));
}
```

---

## 9. Implementation Order

### Phase 1: Data Layer (1-2 hours)

1. **Command types** — Add 6 new command interfaces to `web/src/v2/commands/types.ts`
2. **Command handlers** — Add 6 new `case` blocks to `web/src/v2/commands/commands.ts`
3. **Per-scene history** — Refactor `web/src/v2/stores/documentStore.ts`:
   - Replace single `HistoryManager` with `Map<string, HistoryManager>`
   - Add `setActiveSceneIndex` action
   - Fix `UNDO`/`REDO` to use per-scene history
   - Update `loadDocument`/`reset` to clear history map

### Phase 2: Navigator UI (2-3 hours)

4. **Create directory** `web/src/v2/editor/scenes/`
5. **Create `SceneNavigator.tsx`** — Full component as specified in Section 3
6. **Integrate into `Editor.tsx`** — Add between toolbar and main content
7. **Add toolbar nav buttons** — Scene prev/next in `EditorToolbar.tsx`
8. **Add keyboard shortcuts** — Ctrl+Shift+[ / ] in Editor.tsx keyboard handler

### Phase 3: Scene Properties (1-2 hours)

9. **Modify `PropertiesPanel.tsx`** — Replace "Select an element" placeholder with Scene Properties section (Section 4)
10. **Background type picker** — Solid/Gradient/Image with color pickers

### Phase 4: Mobile (1-2 hours)

11. **Add `ScenesPanel`** to `MobileBottomPanel.tsx` — Scene list with add/delete/rename (Section 7.2)
12. **Wire "Scenes" button** in HOME_TOOLS to switch to scenes tab
13. **Test responsive** — Ensure SceneNavigator stays visible on mobile

### Phase 5: Export Verification (30 min)

14. **Verify `calculateMetadata`** in `src/index.ts` passes total duration
15. **Test multi-scene export** — Create 2 scenes, render, verify both appear

### Phase 6: Edge Cases (1 hour)

16. **Interaction cancel on scene switch** — Deselect + cancel drag in `setActiveSceneIndex`
17. **Copy/paste between scenes** — Add `clipboardElement` to document store
18. **Per-scene undo/redo** — Verify with test: edit Scene 1, switch to Scene 2, edit, undo — only Scene 2 changes undo

### Files Modified (Summary)

| File | Changes |
|------|---------|
| `web/src/v2/commands/types.ts` | +6 command interfaces |
| `web/src/v2/commands/commands.ts` | +6 case handlers, +import V2Scene |
| `web/src/v2/stores/documentStore.ts` | Map history, setActiveSceneIndex, clipboardElement |
| `web/src/v2/editor/Editor.tsx` | +SceneNavigator import/render, +keyboard shortcuts |
| `web/src/v2/editor/toolbar/EditorToolbar.tsx` | +scene nav buttons, selectors |
| `web/src/v2/editor/panels/PropertiesPanel.tsx` | Scene properties section |
| `web/src/v2/editor/panels/MobileBottomPanel.tsx` | +ScenesPanel, +scenes tab |
| `src/index.ts` | Verify/update calculateMetadata |
| **NEW** `web/src/v2/editor/scenes/SceneNavigator.tsx` | New component |

**No changes needed to:**
- `api/src/routes/render.ts` — already supports multi-scene via V2Native
- `api/src/services/renderer.ts` — unchanged
- `src/compositions/V2Native/V2Native.tsx` — already handles multi-scene natively
- `web/src/v2/editor/Stage.tsx` — already reads activeSceneIndex
- `web/src/v2/editor/panels/LayersPanel.tsx` — already uses getElements()
