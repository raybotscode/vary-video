/**
 * Scene Navigator — horizontal strip for scene CRUD and navigation.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ [+ Add] │ [Scene 1 █] [Scene 2  ] [Scene 3  ]               │
 * │         │   3.0s ×      2.0s ×      5.0s ×                  │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Features:
 * - Click to switch active scene
 * - Double-click to rename inline
 * - Drag to reorder
 * - (+) button to add a scene after the active one
 * - × button (hover) to delete a scene (min 1 guard)
 * - Shows scene name + duration in seconds
 */

import {useState, useCallback, useRef} from 'react';
import {useDocumentStore} from '../../stores/documentStore';

export default function SceneNavigator() {
  const document = useDocumentStore((s) => s.document);
  const activeSceneIndex = useDocumentStore((s) => s.activeSceneIndex);
  const setActiveSceneIndex = useDocumentStore((s) => s.setActiveSceneIndex);
  const dispatch = useDocumentStore((s) => s.dispatch);

  const scenes = document.scenes;
  const fps = document.fps;

  // Drag reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Hover (for per-card delete button visibility)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Inline rename
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleAddScene = useCallback(() => {
    dispatch({type: 'ADD_SCENE'});
  }, [dispatch]);

  const handleDeleteScene = useCallback(
    (index: number) => {
      if (scenes.length <= 1) return;
      // Compute new active index BEFORE dispatching deletion
      let newActive = activeSceneIndex;
      if (index < activeSceneIndex) {
        newActive = activeSceneIndex - 1;
      } else if (index === activeSceneIndex) {
        newActive = Math.min(activeSceneIndex, scenes.length - 2);
      }
      // else index > activeSceneIndex → active stays the same

      dispatch({type: 'DELETE_SCENE', sceneIndex: index});
      setActiveSceneIndex(newActive);
    },
    [dispatch, setActiveSceneIndex, activeSceneIndex, scenes.length],
  );

  const handleDoubleClick = useCallback(
    (index: number, name: string) => {
      setEditingIndex(index);
      setEditName(name);
      // Select all text after render
      requestAnimationFrame(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      });
    },
    [],
  );

  const commitRename = useCallback(
    (index: number) => {
      const trimmed = editName.trim();
      if (trimmed && trimmed !== scenes[index]?.name) {
        dispatch({type: 'SET_SCENE_NAME', sceneIndex: index, name: trimmed});
      }
      setEditingIndex(null);
    },
    [dispatch, editName, scenes],
  );

  // ─── Drag handlers ─────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Ghost image: hide default
    const el = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(el, 0, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== targetIndex) {
        dispatch({type: 'MOVE_SCENE', sceneIndex: dragIndex, newIndex: targetIndex});
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dispatch, dragIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────

  const formatDuration = (frames: number): string => {
    const seconds = frames / fps;
    return seconds >= 1 ? `${seconds.toFixed(1)}s` : `${frames}f`;
  };

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div
      style={{
        height: 46,
        background: '#111827',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 6,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        flexShrink: 0,
        borderBottom: '1px solid #1F2937',
      } as React.CSSProperties}
    >
      {/* + Add Scene button */}
      <button
        onClick={handleAddScene}
        title="Add Scene"
        style={addBtnStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#374151';
          (e.currentTarget as HTMLElement).style.color = '#3B82F6';
          (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#2D3748';
          (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
          (e.currentTarget as HTMLElement).style.borderColor = '#4B5563';
        }}
      >
        +
      </button>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 24,
          background: '#374151',
          flexShrink: 0,
        }}
      />

      {/* Scene cards */}
      {scenes.map((scene, index) => {
        const isActive = index === activeSceneIndex;
        const isDragging = index === dragIndex;
        const isDragOver = index === dragOverIndex && index !== dragIndex;
        const isEditing = index === editingIndex;
        const isHovered = index === hoveredIndex;
        const cardWidth = Math.max(100, Math.min(140, scene.name.length * 9 + 40));

        return (
          <div
            key={scene.id}
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => setActiveSceneIndex(index)}
            onDoubleClick={() => handleDoubleClick(index, scene.name)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            title={isEditing ? undefined : `${scene.name} — ${formatDuration(scene.durationFrames)}`}
            style={{
              position: 'relative',
              flexShrink: 0,
              minWidth: cardWidth,
              height: 34,
              borderRadius: 8,
              border: isActive
                ? '2px solid #3B82F6'
                : isDragOver
                  ? '2px dashed #6366F1'
                  : '1px solid #374151',
              background: isActive ? '#1E3A5F' : isDragOver ? '#1E293B' : '#1F2937',
              cursor: isEditing ? 'text' : 'pointer',
              opacity: isDragging ? 0.4 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 10px',
              transition: 'border-color 0.15s, background 0.15s',
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
                <span
                  style={{
                    color: isActive ? '#fff' : '#D1D5DB',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: cardWidth - 20,
                  }}
                >
                  {scene.name}
                </span>
                <span
                  style={{
                    color: isActive ? '#93C5FD' : '#9CA3AF',
                    fontSize: 10,
                    lineHeight: 1.2,
                  }}
                >
                  {formatDuration(scene.durationFrames)}
                </span>
              </>
            )}

            {/* Reorder arrows — visible on hover */}
            {!isEditing && scenes.length > 1 && (
              <div style={{
                position: 'absolute',
                left: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.1s',
                pointerEvents: isHovered ? 'auto' : 'none',
              }}>
                {index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({type: 'MOVE_SCENE', sceneIndex: index, newIndex: index - 1});
                      if (activeSceneIndex === index) setActiveSceneIndex(index - 1);
                      else if (activeSceneIndex === index - 1) setActiveSceneIndex(index);
                    }}
                    title="Move left"
                    style={arrowBtnStyle}
                  >◀</button>
                )}
                {index < scenes.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({type: 'MOVE_SCENE', sceneIndex: index, newIndex: index + 1});
                      if (activeSceneIndex === index) setActiveSceneIndex(index + 1);
                      else if (activeSceneIndex === index + 1) setActiveSceneIndex(index);
                    }}
                    title="Move right"
                    style={arrowBtnStyle}
                  >▶</button>
                )}
              </div>
            )}

            {/* Delete × button — visible on hover, hidden for sole scene */}
            {scenes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteScene(index);
                }}
                title="Delete scene"
                style={{
                  position: 'absolute',
                  top: -7,
                  right: -7,
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
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.1s',
                  lineHeight: 1,
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#EF4444';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#374151';
                  e.currentTarget.style.color = '#9CA3AF';
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const addBtnStyle: React.CSSProperties = {
  width: 34,
  height: 34,
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
  lineHeight: 1,
  padding: 0,
};

const arrowBtnStyle: React.CSSProperties = {
  width: 18,
  height: 14,
  borderRadius: 3,
  background: '#374151',
  border: '1px solid #4B5563',
  color: '#9CA3AF',
  fontSize: 8,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
};
