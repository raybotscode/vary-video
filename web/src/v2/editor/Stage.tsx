/**
 * V2 Stage Viewport — the main editor canvas.
 *
 * Routes pointer interactions in one place:
 * - Click empty → deselect
 * - Click element → select + start drag
 * - Click resize handle → start resize
 * - Click rotation handle → start rotate
 *
 * Dedicated interaction hooks own pointer capture, live ephemeral updates,
 * and pointerup history commits.
 */

import {useRef, useEffect, useState, useCallback} from 'react';
import type React from 'react';
import {calculateStageRect, type StageRect} from '../utils/coordinates';
import type {AspectRatio} from '@vary/v2/schema/document';
import {useDocumentStore} from '../stores/documentStore';
import {useEditorStore} from '../stores/editorStore';
import type {ResizeHandle} from '../stores/editorStore';
import ElementRenderer from './ElementRenderer';
import SelectionOverlay from './selection/SelectionOverlay';
import {useDrag} from './hooks/useDrag';
import {useResize} from './hooks/useResize';
import {useRotate} from './hooks/useRotate';

interface StageViewportProps {
  aspectRatio: AspectRatio;
  /** Forcing remount of animated elements when playback starts */
  playbackKey: number;
  /** Whether playback is currently active */
  playing: boolean;
}

export default function StageViewport({aspectRatio, playbackKey, playing}: StageViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageRect, setStageRect] = useState<StageRect | null>(null);

  const document = useDocumentStore((s) => s.document);
  const activeSceneIndex = useDocumentStore((s) => s.activeSceneIndex);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const getElement = useDocumentStore((s) => s.getElement);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const stageScale = useEditorStore((s) => s.stageScale);
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const startDrag = useEditorStore((s) => s.startDrag);
  const updateDrag = useEditorStore((s) => s.updateDrag);
  const endDrag = useEditorStore((s) => s.endDrag);
  const startResize = useEditorStore((s) => s.startResize);
  const updateResize = useEditorStore((s) => s.updateResize);
  const endResize = useEditorStore((s) => s.endResize);
  const startRotate = useEditorStore((s) => s.startRotate);
  const updateRotate = useEditorStore((s) => s.updateRotate);
  const endRotate = useEditorStore((s) => s.endRotate);
  const startInlineEdit = useEditorStore((s) => s.startInlineEdit);
  const interaction = useEditorStore((s) => s.interaction);

  const lastClickRef = useRef<{ time: number; elementId: string } | null>(null);

  const scene = document.scenes[activeSceneIndex] ?? document.scenes[0];

  // Calculate stage rect on resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateRect = () => {
      const rect = el.getBoundingClientRect();
      setStageRect(calculateStageRect(rect.width, rect.height, aspectRatio));
    };
    updateRect();
    const ro = new ResizeObserver(updateRect);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspectRatio]);

  const bgColor = scene.background.type === 'solid'
    ? scene.background.color
    : scene.background.type === 'gradient'
      ? scene.background.color1
      : '#0F172A';

  const sortedElements = [...scene.elements].sort(
    (a, b) => a.transform.zIndex - b.transform.zIndex,
  );

  const dragHandlers = useDrag({
    elementId: selectedElementId,
    interaction,
    stageRect,
    startDrag,
    updateDrag,
    endDrag,
    dispatch,
    getElement,
    snapToGrid,
    gridSize,
  });

  const resizeHandlers = useResize({
    elementId: selectedElementId,
    interaction,
    stageRect,
    startResize,
    updateResize,
    endResize,
    dispatch,
    getElement,
    snapToGrid,
    gridSize,
  });

  const rotateHandlers = useRotate({
    elementId: selectedElementId,
    interaction,
    stageRect,
    startRotate,
    updateRotate,
    endRotate,
    dispatch,
    getElement,
  });

  // ─── Unified Pointer Down ────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const handleType = target.dataset.handle; // 'resize-tl', 'rotate', undefined

    // 1. Rotation handle clicked
    if (handleType === 'rotate' && selectedElementId) {
      const el = scene.elements.find(x => x.id === selectedElementId);
      if (el && !el.locked) {
        rotateHandlers.handleRotateStart(e, selectedElementId);
      }
      return;
    }

    // 2. Resize handle clicked
    if (handleType?.startsWith('resize-') && selectedElementId) {
      const corner = handleType.replace('resize-', '') as ResizeHandle;
      const el = scene.elements.find(x => x.id === selectedElementId);
      if (el && !el.locked) {
        resizeHandlers.handleResizeStart(e, selectedElementId, corner);
      }
      return;
    }

    // 3. Element clicked — select + prepare drag (or double-click to edit)
    const elementEl = target.closest('[data-element-id]') as HTMLElement | null;
    if (elementEl) {
      const elementId = elementEl.dataset.elementId;
      if (!elementId) return;
      const el = scene.elements.find(x => x.id === elementId);
      if (!el || el.locked) return;

      // Double-click detection for inline text editing
      const now = Date.now();
      const prev = lastClickRef.current;
      if (
        prev &&
        prev.elementId === elementId &&
        now - prev.time < 350 &&
        el.type === 'text' &&
        !el.locked
      ) {
        e.preventDefault();
        lastClickRef.current = null;
        selectElement(elementId);
        startInlineEdit(elementId);
        return;
      }
      lastClickRef.current = { time: now, elementId };

      e.preventDefault();
      selectElement(elementId);
      dragHandlers.handleDragStart(e, elementId);
      return;
    }

    // 4. Empty canvas — deselect
    selectElement(null);
  }, [dragHandlers, resizeHandlers, rotateHandlers, scene.elements, selectedElementId, selectElement, startInlineEdit]);

  // ─── Unified Pointer Move ────────────────────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (interaction.type === 'dragging') dragHandlers.handleDragMove(e);
    if (interaction.type === 'resizing') resizeHandlers.handleResizeMove(e);
    if (interaction.type === 'rotating') rotateHandlers.handleRotateMove(e);
  }, [dragHandlers, interaction.type, resizeHandlers, rotateHandlers]);

  // ─── Unified Pointer Up ──────────────────────────────────────────

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (interaction.type === 'dragging') dragHandlers.handleDragEnd(e);
    if (interaction.type === 'resizing') resizeHandlers.handleResizeEnd(e);
    if (interaction.type === 'rotating') rotateHandlers.handleRotateEnd(e);
  }, [dragHandlers, interaction.type, resizeHandlers, rotateHandlers]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
        background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', // Prevent browser scroll/zoom on touch
      }}
    >
      {stageRect && (
        <div
          ref={stageRef}
          key={`stage-${playbackKey}`}
          style={{
            position: 'absolute',
            left: stageRect.stageLeft, top: stageRect.stageTop,
            width: stageRect.stageWidth, height: stageRect.stageHeight,
            background: bgColor,
            boxShadow: playing
              ? '0 0 0 1px rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(239,68,68,0.4), 0 0 16px rgba(239,68,68,0.25)'
              : '0 0 0 1px rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            transform: `scale(${stageScale})`,
            transformOrigin: 'center center',
            touchAction: 'none', // Prevent browser scroll on touch drag
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {scene.background.type === 'gradient' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(${scene.background.angle}deg, ${scene.background.color1}, ${scene.background.color2})`,
            }} />
          )}

          {/* Grid overlay */}
          {showGrid && (
            <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0}}>
              <defs>
                <pattern id="v2-grid" width={`${gridSize * 100}%`} height={`${gridSize * 100}%`} patternUnits="userSpaceOnUse">
                  <path d={`M ${gridSize * 100} 0 L 0 0 0 ${gridSize * 100}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#v2-grid)" />
            </svg>
          )}

          {sortedElements.map((element) => (
            <ElementRenderer
              key={element.id}
              element={element}
              scale={stageRect.scale}
              isSelected={element.id === selectedElementId}
              onSelect={() => selectElement(element.id)}
            />
          ))}

          {selectedElementId && (
            <SelectionOverlay
              element={scene.elements.find((el) => el.id === selectedElementId) ?? null}
              stageRect={stageRect}
            />
          )}
        </div>
      )}
    </div>
  );
}
