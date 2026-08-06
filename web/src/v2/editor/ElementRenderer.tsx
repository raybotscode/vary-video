/**
 * V2 Element Renderer — dispatches to type-specific renderers.
 *
 * Each element type gets its own DOM renderer. This component handles
 * the common wrapper (CSS positioning, selection, pointer events) and
 * delegates the inner content to the type-specific component.
 */

import type React from 'react';
import type {V2Element} from '@vary/v2/schema/document';
import {buildElementStyle} from '../utils/transform';
import {useEditorStore} from '../stores/editorStore';
import {useDocumentStore} from '../stores/documentStore';
import TextRenderer from './renderers/TextRenderer';
import ImageRenderer from './renderers/ImageRenderer';
import ShapeRenderer from './renderers/ShapeRenderer';
import {useMergePreview} from '../hooks/useMergePreview';

// ─── Animation Presets ───────────────────────────────────────────

const ANIMATION_KEYFRAMES: Record<string, string> = {
  'fade-in': `@keyframes anim-fade-in { from { opacity: 0; } to { opacity: 1; } }`,
  'slide-up': `@keyframes anim-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`,
  'zoom-in': `@keyframes anim-zoom-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }`,
  'bounce-in': `@keyframes anim-bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }`,
};

function getAnimationStyle(element: V2Element): React.CSSProperties {
  const anim = (element as any).animation;
  if (!anim?.in?.preset || anim.in.preset === 'none') return {};
  const preset = anim.in.preset as string;
  const duration = ((anim.in.durationFrames ?? 15) / 30); // frames → seconds
  const easing = anim.in.easing ?? 'ease-out';
  const animName = `anim-${preset}`;
  return {
    animation: `${animName} ${duration}s ${easing} forwards`,
    // Ensure the element renders at the final state after animation
    animationFillMode: 'forwards',
  };
}

interface ElementRendererProps {
  element: V2Element;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ElementRenderer({
  element,
  scale,
  isSelected,
  onSelect,
}: ElementRendererProps) {
  if (!element.visible) return null;

  const inlineEditId = useEditorStore((s) => s.inlineEditElementId);
  const startInlineEdit = useEditorStore((s) => s.startInlineEdit);
  const endInlineEdit = useEditorStore((s) => s.endInlineEdit);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const {resolvedProps, showTagHighlights} = useMergePreview(element);

  const style = buildElementStyle(element);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Let event bubble to Stage.tsx which handles all interactions
    // (select, drag, resize, rotate via data-handle / data-element-id)
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (element.type === 'text' && !element.locked) {
      e.stopPropagation();
      startInlineEdit(element.id);
    }
  };

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <TextRenderer
            element={{...element, props: resolvedProps} as typeof element}
            scale={scale}
            isEditing={inlineEditId === element.id}
            onCommitText={(content) => {
              dispatch({type: 'SET_ELEMENT_PROP', elementId: element.id, key: 'content', value: content});
              endInlineEdit();
            }}
            onCancelEdit={() => endInlineEdit()}
          />
        );
      case 'image':
        return <ImageRenderer element={{...element, props: resolvedProps} as typeof element} />;
      case 'shape':
        return <ShapeRenderer element={{...element, props: resolvedProps} as typeof element} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Inject animation keyframes if needed */}
      <style>{Object.values(ANIMATION_KEYFRAMES).join(' ')}</style>
      <div
        data-element-id={element.id}
        data-element-type={element.type}
        data-selected={isSelected ? 'true' : 'false'}
        style={{
          ...style,
          cursor: element.locked ? 'not-allowed' : element.type === 'text' ? 'text' : 'move',
          outline: isSelected ? '2px solid #3B82F6' : 'none',
          outlineOffset: 2,
          transition: 'outline 0.1s',
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        title={element.name}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            ...getAnimationStyle(element),
          }}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
}
