import React from 'react';
import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {v2NativeSchema, type V2NativeProps} from './schema';
import type {V2Element, V2Scene, Background} from '../../v2/schema/document';
import {getAnimationStyle, mergeMotionStyles} from '../animations';
import type {AnimationStyle} from '../animations/types';

// ─── Font Loading ──────────────────────────────────────────────────

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

// ─── Animation Preset Mapping (V2 → Remotion) ──────────────────────
//
// The V2 schema uses preset IDs like 'slide-left', 'slide-right' etc.
// The existing Remotion animation system uses 'slide-in-left', etc.
// We map V2 presets to the Remotion equivalents.
//
// Direction depends on whether this is an 'in' or 'out' animation:
//   - 'in':  entry animation (e.g. slide-left → slide-in-right)
//   - 'out': exit animation  (e.g. slide-left → slide-out-right)

const V2_TO_REMOTION_IN: Record<string, string> = {
  none: 'none',
  'fade-in': 'fade-in',
  'fade-out': 'fade-in', // 'fade-out' as entry = start invisible, fade in
  'slide-left': 'slide-in-right',  // V2 slide-left = slide in from right
  'slide-right': 'slide-in-left',  // V2 slide-right = slide in from left
  'slide-up': 'slide-in-up',
  'slide-down': 'slide-in-down',
  'scale-in': 'zoom-in',   // closest match: zoom from small to 1
  'scale-out': 'zoom-in',  // scale-out as entry = start small → full size
  'zoom-in': 'zoom-in',
  'zoom-out': 'zoom-in',   // zoom-out as entry = start zoomed out → full
  'bounce-in': 'bounce-in',
  'rotate-in': 'zoom-in',  // fallback: zoom-in is closest available
};

const V2_TO_REMOTION_OUT: Record<string, string> = {
  none: 'none',
  'fade-in': 'fade-out',    // fade-in as exit = fade out
  'fade-out': 'fade-out',
  'slide-left': 'slide-out-right',
  'slide-right': 'slide-out-left',
  'slide-up': 'slide-out-up',
  'slide-down': 'slide-out-down',
  'scale-in': 'zoom-out',   // scale-in as exit = zoom out
  'scale-out': 'zoom-out',
  'zoom-in': 'zoom-out',
  'zoom-out': 'zoom-out',
  'bounce-in': 'zoom-out',  // fallback
  'rotate-in': 'zoom-out',  // fallback
};

function mapV2PresetToRemotion(preset: string, direction: 'in' | 'out'): string {
  const map = direction === 'in' ? V2_TO_REMOTION_IN : V2_TO_REMOTION_OUT;
  return map[preset] ?? 'none';
}

// ─── Merge Tag Resolution ──────────────────────────────────────────

/**
 * Resolve element content to a display string.
 * Handles both plain strings and BindableText token arrays.
 * Merge tags {{key}} in plain strings are resolved against data.
 */
function resolveContent(content: unknown, data: Record<string, string>): string {
  if (typeof content === 'string') {
    return content.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
  }
  // BindableText
  if (typeof content === 'object' && content !== null && '_type' in content) {
    const bt = content as {_type: string; tokens: Array<{_type: string; text?: string; raw?: string; tagId?: string}>};
    if (bt._type === 'bindableText' && Array.isArray(bt.tokens)) {
      return bt.tokens
        .map((t) => {
          if (t._type === 'literal') return t.text ?? '';
          // tag token: resolve via tagId → key lookup (data keys are tag keys)
          if (t._type === 'tag' && t.tagId) {
            // Find the key from tagId → try matching in data
            const tagKey = t.raw?.replace(/^\{\{|\}\}$/g, '') ?? t.tagId;
            return data[tagKey] ?? data[t.tagId] ?? t.raw ?? '';
          }
          return '';
        })
        .join('');
    }
    // Fallback for unknown object types
    return String(content);
  }
  return String(content ?? '');
}

/** Resolve a BindableValue or plain string to a resolved string. */
function resolveValue(value: unknown, data: Record<string, string>): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_type' in value) {
    const bv = value as {_type: string; value?: unknown; tagId?: string; fallback?: unknown};
    if (bv._type === 'literal') return String(bv.value ?? '');
    if (bv._type === 'tag' && bv.tagId) {
      return data[bv.tagId] ?? String(bv.fallback ?? '');
    }
  }
  return String(value ?? '');
}

// ─── Background Rendering ──────────────────────────────────────────

function sceneBackgroundCss(bg: Background): React.CSSProperties {
  switch (bg.type) {
    case 'solid':
      return {backgroundColor: bg.color};
    case 'gradient':
      return {
        background: `linear-gradient(${bg.angle}deg, ${bg.color1}, ${bg.color2})`,
      };
    case 'image':
      return {backgroundColor: '#000'};
    default:
      return {backgroundColor: '#FFFFFF'};
  }
}

// ─── Shape Clip Paths ──────────────────────────────────────────────

function getClipPath(shapeType: string): string | undefined {
  switch (shapeType) {
    case 'circle':
      return 'circle(50% at 50% 50%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    default:
      return undefined;
  }
}

// ─── Element Transform (normalized → CSS) ──────────────────────────

function buildElementCss(
  element: V2Element,
  animStyle: AnimationStyle,
): React.CSSProperties {
  const t = element.transform;

  // Base positioning: normalized (0-1) → percentages
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${t.x * 100}%`,
    top: `${t.y * 100}%`,
    width: t.width !== null ? `${t.width * 100}%` : undefined,
    height: t.height !== null ? `${t.height * 100}%` : undefined,
    transform: `translate(-${t.anchorX * 100}%, -${t.anchorY * 100}%) rotate(${t.rotation}deg)`,
    transformOrigin: `${t.anchorX * 100}% ${t.anchorY * 100}%`,
    opacity: t.opacity,
    zIndex: t.zIndex,
    overflow: 'hidden',
  };

  // If there's an animation transform, compose it with the base transform
  if (animStyle.transform) {
    baseStyle.transform = `${baseStyle.transform} ${animStyle.transform}`;
  }
  // Compose animation opacity with base opacity
  const animOp = animStyle.opacity;
  const baseOp = baseStyle.opacity;
  if (typeof animOp === 'number') {
    const current: number = typeof baseOp === 'number' ? baseOp : 1;
    baseStyle.opacity = current * animOp;
  }

  return baseStyle;
}

// ─── Text Renderer ─────────────────────────────────────────────────

const TextElementView: React.FC<{element: V2Element; data: Record<string, string>}> = ({
  element,
  data,
}) => {
  const p = element.props as Record<string, unknown>;
  const content = resolveContent(p['content'], data);
  const fontFamily = String(p['fontFamily'] ?? 'Inter');
  const fontSize = Number(p['fontSize'] ?? 72);
  const fontWeight = Number(p['fontWeight'] ?? 700);
  const fontStyle = p['fontStyle'] === 'italic' ? 'italic' : 'normal';
  const lineHeight = Number(p['lineHeight'] ?? 1.2);
  const letterSpacing = `${Number(p['letterSpacing'] ?? 0)}px`;
  const color = String(p['color'] ?? '#1A365D');
  const textAlign = (p['textAlign'] ?? 'center') as React.CSSProperties['textAlign'];
  const verticalAlign = String(p['verticalAlign'] ?? 'middle');
  const textTransform = p['textTransform'] === 'none' ? undefined : String(p['textTransform']);
  const bgColor = p['backgroundColor'] as string | null;
  const padding = Number(p['padding'] ?? 0);
  const borderRadius = Number(p['borderRadius'] ?? 0);

  const hasHeight = element.transform.height !== null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        lineHeight,
        letterSpacing,
        color,
        textAlign,
        textTransform: textTransform as React.CSSProperties['textTransform'],
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: bgColor ?? undefined,
        padding: padding > 0 ? padding : undefined,
        borderRadius: borderRadius > 0 ? borderRadius : undefined,
        display: hasHeight ? 'flex' : undefined,
        alignItems: hasHeight ? flexAlign(verticalAlign) : undefined,
        justifyContent: hasHeight ? flexJustify(textAlign ?? 'center') : undefined,
      }}
    >
      {content}
    </div>
  );
};

function flexAlign(va: string): React.CSSProperties['alignItems'] {
  switch (va) {
    case 'top': return 'flex-start';
    case 'bottom': return 'flex-end';
    default: return 'center';
  }
}

function flexJustify(ta: string): React.CSSProperties['justifyContent'] {
  switch (ta) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    default: return 'center';
  }
}

// ─── Image Renderer ────────────────────────────────────────────────

const ImageElementView: React.FC<{element: V2Element; data: Record<string, string>}> = ({
  element,
  data,
}) => {
  const p = element.props as Record<string, unknown>;
  const src = resolveValue(p['src'], data);
  const fit = String(p['fit'] ?? 'cover') as 'cover' | 'contain' | 'fill';
  const objX = Number(p['objectPositionX'] ?? 0.5);
  const objY = Number(p['objectPositionY'] ?? 0.5);
  const borderRadius = Number(p['borderRadius'] ?? 0);
  const overlayColor = p['overlayColor'] as string | null;
  const overlayOpacity = Number(p['overlayOpacity'] ?? 0);
  const blur = Number(p['blur'] ?? 0);
  const shadow = Boolean(p['shadow']);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius,
        overflow: 'hidden',
        boxShadow: shadow ? '0 4px 20px rgba(0,0,0,0.25)' : undefined,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      {src ? (
        <>
          <Img
            src={src}
            style={{
              width: '100%',
              height: '100%',
              objectFit: fit,
              objectPosition: `${objX * 100}% ${objY * 100}%`,
            }}
          />
          {overlayColor && overlayOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: overlayColor,
                opacity: overlayOpacity,
              }}
            />
          )}
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#2D3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: 12,
          }}
        >
          🖼 Image
        </div>
      )}
    </div>
  );
};

// ─── Shape Renderer ────────────────────────────────────────────────

const ShapeElementView: React.FC<{element: V2Element}> = ({element}) => {
  const p = element.props as Record<string, unknown>;
  const shapeType = String(p['shapeType'] ?? 'rectangle');
  const fill = String(p['fill'] ?? '#3182CE');
  const stroke = p['stroke'] as string | null;
  const strokeWidth = Number(p['strokeWidth'] ?? 0);
  const borderRadius = Number(p['borderRadius'] ?? 0);

  const isLine = shapeType === 'line';
  const isCircle = shapeType === 'circle';
  const hasClip = !['rectangle', 'rounded-rect', 'line'].includes(shapeType);

  const br: React.CSSProperties['borderRadius'] =
    shapeType === 'rounded-rect' ? (borderRadius || 12) :
    isCircle ? '50%' :
    borderRadius;

  const clipPath = hasClip ? getClipPath(shapeType) : undefined;
  const bgColor = isLine ? (stroke ?? fill) : fill;

  return (
    <div
      style={{
        width: '100%',
        height: isLine ? `${Math.max(2, strokeWidth || 2)}px` : '100%',
        minWidth: 20,
        minHeight: isLine ? 2 : 20,
        borderRadius: br,
        clipPath,
        backgroundColor: bgColor,
        border: stroke && !isLine ? `${strokeWidth}px solid ${stroke}` : 'none',
      }}
    />
  );
};

// ─── Element Animation Wrapper ─────────────────────────────────────

const ElementWithAnimation: React.FC<{
  element: V2Element;
  localFrame: number;
  durationFrames: number;
  fps: number;
  width: number;
  height: number;
  data: Record<string, string>;
}> = ({element, localFrame, durationFrames, fps, width, height, data}) => {
  // Entry animation
  const animIn = element.animation?.in;
  const inDuration = animIn?.durationFrames ?? 15;
  const inDelay = animIn?.delayFrames ?? 0;

  let entryStyle: AnimationStyle = {};
  if (animIn && animIn.preset !== 'none') {
    const effectiveFrame = localFrame - inDelay;
    if (effectiveFrame >= 0 && effectiveFrame <= inDuration) {
      entryStyle = getAnimationStyle({
        presetId: mapV2PresetToRemotion(animIn.preset, 'in'),
        frame: effectiveFrame,
        fps,
        width,
        height,
        durationFrames: inDuration,
        intensity: animIn.intensity ?? 0.35,
        easing: mapEasing(animIn.easing),
      });
    }
  }

  // Exit animation
  const animOut = element.animation?.out;
  const outDuration = animOut?.durationFrames ?? 15;
  const framesRemaining = durationFrames - localFrame;

  let exitStyle: AnimationStyle = {};
  if (animOut && animOut.preset !== 'none' && framesRemaining <= outDuration && framesRemaining >= 0) {
    exitStyle = getAnimationStyle({
      presetId: mapV2PresetToRemotion(animOut.preset, 'out'),
      frame: outDuration - framesRemaining,
      fps,
      width,
      height,
      durationFrames: outDuration,
      intensity: animOut.intensity ?? 0.35,
      easing: mapEasing(animOut.easing),
    });
  }

  const animStyle = mergeMotionStyles(entryStyle, exitStyle);

  const renderElement = () => {
    switch (element.type) {
      case 'text':
        return <TextElementView element={element} data={data} />;
      case 'image':
        return <ImageElementView element={element} data={data} />;
      case 'shape':
        return <ShapeElementView element={element} />;
      default:
        return null;
    }
  };

  return (
    <div style={buildElementCss(element, animStyle)}>
      {renderElement()}
    </div>
  );
};

// ─── Easing Mapping (V2 Easing → AnimationEasing) ──────────────────

function mapEasing(easing?: string): 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | undefined {
  if (!easing) return undefined;
  const valid = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring'];
  if (valid.includes(easing)) {
    return easing as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  }
  // V2 has additional easings: 'ease-in-back', 'ease-out-back', 'ease-in-elastic', 'ease-out-elastic', 'bounce'
  // Map to closest supported easing
  if (easing.includes('back') || easing.includes('elastic') || easing === 'bounce') {
    return 'ease-out';
  }
  return undefined;
}

// ─── Scene Renderer ────────────────────────────────────────────────

const SceneView: React.FC<{
  scene: V2Scene;
  localFrame: number;
  props: V2NativeProps;
}> = ({scene, localFrame, props}) => {
  const {fps, width, height, data} = props;

  // Sort elements by zIndex (descending — highest on top, last rendered)
  const sortedElements = [...scene.elements].sort(
    (a, b) => a.transform.zIndex - b.transform.zIndex,
  );

  return (
    <AbsoluteFill style={sceneBackgroundCss(scene.background)}>
      {/* Background image layer */}
      {scene.background.type === 'image' && (
        <Img
          src={scene.background.src}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: scene.background.opacity,
          }}
        />
      )}

      {/* Elements */}
      {sortedElements.map((element) => {
        // Skip invisible elements
        if (!element.visible) return null;

        // Check timing — only render if current frame is within element's lifespan
        const elStart = element.timing.startFrame;
        const elEnd = element.timing.endFrame ?? scene.durationFrames;

        if (localFrame < elStart || localFrame >= elEnd) return null;

        const elLocalFrame = localFrame - elStart;
        const elDuration = elEnd - elStart;

        return (
          <ElementWithAnimation
            key={element.id}
            element={element}
            localFrame={elLocalFrame}
            durationFrames={elDuration}
            fps={fps}
            width={width}
            height={height}
            data={data}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Main Composition ──────────────────────────────────────────────

export const V2Native: React.FC<V2NativeProps> = (rawProps) => {
  const props = v2NativeSchema.parse(rawProps);
  const currentFrame = useCurrentFrame();
  const config = useVideoConfig();

  // Use dynamic values from video config (set by calculateMetadata)
  const width = config.width;
  const height = config.height;
  const fps = config.fps;

  // Build positioned scenes
  let accumulated = 0;
  const positionedScenes = props.document.scenes.map((scene) => {
    const positioned = {scene, startFrame: accumulated};
    accumulated += scene.durationFrames;
    return positioned;
  });

  // Find current scene
  const current = positionedScenes.find(
    ({startFrame}, i) => {
      const endFrame = startFrame + props.document.scenes[i].durationFrames;
      return currentFrame >= startFrame && currentFrame < endFrame;
    },
  );

  if (!current) {
    // No scene at this frame — show blank
    return <AbsoluteFill style={{backgroundColor: '#000'}} />;
  }

  const localFrame = currentFrame - current.startFrame;

  return (
    <SceneView scene={current.scene} localFrame={localFrame} props={props} />
  );
};
