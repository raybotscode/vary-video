/**
 * V2 Editor Stage Viewport — the main canvas area.
 *
 * Renders a scaled DOM element at the correct aspect ratio.
 * Handles coordinate conversion for mouse events.
 * Renders element layers on top of the scene background.
 */

import {useRef, useEffect, useState, useCallback} from 'react';
import {calculateStageRect, screenToNormalized, type StageRect} from './coordinates';
import type {V2Scene, V2Element, AspectRatio} from '../schema/document';
import {ASPECT_DIMENSIONS} from '../schema/document';
import {getElement} from '../registry/elements';

type StageViewportProps = {
  scene: V2Scene;
  aspectRatio: AspectRatio;
  selectedElementId: string | null;
  onSelectElement: (elementId: string | null) => void;
  onElementMove: (elementId: string, x: number, y: number) => void;
  onStageClick: () => void;
};

export default function StageViewport({
  scene,
  aspectRatio,
  selectedElementId,
  onSelectElement,
  onElementMove,
  onStageClick,
}: StageViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageRect, setStageRect] = useState<StageRect | null>(null);

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

  // Background color from scene
  const bgColor = scene.background.type === 'solid'
    ? scene.background.color
    : scene.background.type === 'gradient'
      ? scene.background.color1
      : '#0F172A';

  // Sort elements by zIndex
  const sortedElements = [...scene.elements].sort(
    (a, b) => a.transform.zIndex - b.transform.zIndex,
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#1e1e1e', // Editor chrome background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          onStageClick();
        }
      }}
    >
      {/* Stage surface */}
      {stageRect && (
        <div
          style={{
            position: 'absolute',
            left: stageRect.stageLeft,
            top: stageRect.stageTop,
            width: stageRect.stageWidth,
            height: stageRect.stageHeight,
            background: bgColor,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 4px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          {/* Gradient background if applicable */}
          {scene.background.type === 'gradient' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(${scene.background.angle}deg, ${scene.background.color1}, ${scene.background.color2})`,
              }}
            />
          )}

          {/* Elements */}
          {sortedElements.map((element) => {
            if (!element.visible) return null;
            return (
              <ElementRenderer
                key={element.id}
                element={element}
                scale={stageRect.scale}
                isSelected={element.id === selectedElementId}
                onSelect={() => onSelectElement(element.id)}
                onMove={(x, y) => onElementMove(element.id, x, y)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Element Renderer ─────────────────────────────────────────────

type ElementRendererProps = {
  element: V2Element;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
};

function ElementRenderer({
  element,
  scale,
  isSelected,
  onSelect,
  onMove,
}: ElementRendererProps) {
  const def = getElement(element.type);
  const {transform} = element;
  const {props} = element as any;

  // Convert normalized coords to CSS
  const left = `${transform.x * 100}%`;
  const top = `${transform.y * 100}%`;
  const width = transform.width !== null ? `${transform.width * 100}%` : 'auto';
  const height = transform.height !== null ? `${transform.height * 100}%` : 'auto';

  // Scale font size from 1920-based to display size
  const displayFontSize = props.fontSize
    ? Math.max(10, Math.round((props.fontSize as number) * scale))
    : undefined;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (element.locked) return;
      e.stopPropagation();
      onSelect();
    },
    [element.locked, onSelect],
  );

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
        opacity: element.type === 'shape' ? ((props as any).opacity ?? 1) : 1,
        zIndex: transform.zIndex,
        cursor: element.locked ? 'not-allowed' : 'move',
        // Selection border
        outline: isSelected ? '2px solid #3B82F6' : 'none',
        outlineOffset: 2,
        // Hover indication
        transition: 'outline 0.1s',
        fontFamily: 'Inter, sans-serif',
      }}
      onMouseDown={handleMouseDown}
      title={element.name}
    >
      {/* Text element */}
      {element.type === 'text' && (
        <div
          style={{
            fontSize: displayFontSize,
            fontWeight: (props as any).fontWeight ?? 400,
            fontStyle: (props as any).fontStyle ?? 'normal',
            lineHeight: (props as any).lineHeight ?? 1.2,
            letterSpacing: (props as any).letterSpacing ?? 0,
            color: (props as any).color ?? '#FFFFFF',
            textAlign: (props as any).textAlign ?? 'center',
            textTransform: (props as any).textTransform ?? 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {(props as any).content ?? ''}
        </div>
      )}

      {/* Image element */}
      {element.type === 'image' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            minWidth: 40,
            minHeight: 40,
            background: '#2D3748',
            borderRadius: (props as any).borderRadius ?? 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: 12,
          }}
        >
          🖼 {(props as any).src?.substring(0, 30) ?? 'Image'}
        </div>
      )}

      {/* Shape element */}
      {element.type === 'shape' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            minWidth: 20,
            minHeight: 20,
            background: (props as any).fill ?? '#3182CE',
            border: (props as any).stroke
              ? `${(props as any).strokeWidth ?? 1}px solid ${(props as any).stroke}`
              : 'none',
            borderRadius: (props as any).shapeType === 'circle'
              ? '50%'
              : (props as any).borderRadius ?? 0,
          }}
        />
      )}

      {/* Selection handles */}
      {isSelected && (
        <>
          {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <div
              key={corner}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                background: '#3B82F6',
                border: '1px solid #fff',
                borderRadius: 1,
                ...(corner.includes('n') ? {top: -4} : {bottom: -4}),
                ...(corner.includes('w') ? {left: -4} : {right: -4}),
                cursor: `${corner}-resize`,
              }}
            />
          ))}
          {/* Rotation handle (top center) */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12,
              height: 12,
              background: '#3B82F6',
              border: '2px solid #fff',
              borderRadius: '50%',
              cursor: 'grab',
            }}
          />
        </>
      )}
    </div>
  );
}
