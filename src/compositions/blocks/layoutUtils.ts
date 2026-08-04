/**
 * Layout utilities for per-element positioning and animation.
 *
 * Provides helpers for block renderers to resolve element layout overrides
 * with sensible fallbacks to hardcoded defaults.
 */
import type {ElementLayout, ElementAnimationConfig} from '../../shared/capabilities/types';
import {getAnimationStyle, type AnimationStyle} from '../animations';

/**
 * Resolved element layout with all fields populated (no optionals).
 */
export type ResolvedElementLayout = {
  x: number;          // 0–100, percentage of canvas width
  y: number;          // 0–100, percentage of canvas height
  fontSize: number;   // px
  color: string;      // hex color
  animation?: {
    entry?: ElementAnimationConfig;
    exit?: ElementAnimationConfig;
  };
};

/**
 * Get the resolved layout for an element, falling back to defaults.
 *
 * @param layout - The block's layout map (may be undefined)
 * @param fieldKey - The content field key (e.g. 'headline')
 * @param defaults - Default values when no layout override exists
 */
export function getElementLayout(
  layout: Record<string, ElementLayout> | undefined,
  fieldKey: string,
  defaults: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
  },
): ResolvedElementLayout {
  const override = layout?.[fieldKey];
  if (!override) {
    return {
      x: defaults.x,
      y: defaults.y,
      fontSize: defaults.fontSize,
      color: defaults.color,
    };
  }

  return {
    x: override.x ?? defaults.x,
    y: override.y ?? defaults.y,
    fontSize: override.fontSize ?? defaults.fontSize,
    color: override.color ?? defaults.color,
    animation: override.animation,
  };
}

/**
 * Convert a percentage (0–100) to pixels for a given dimension.
 */
export function percentToPixels(pct: number, dimension: number): number {
  return (pct / 100) * dimension;
}

/**
 * Compute animation style for a per-element animation.
 * Returns an empty object if no animation is configured.
 */
export function getElementAnimationStyle(
  animation: ElementLayout['animation'] | undefined,
  frame: number,
  fps: number,
  width: number,
  height: number,
  durationFrames?: number,
): AnimationStyle {
  if (!animation?.entry) return {};

  return getAnimationStyle({
    presetId: animation.entry.presetId,
    frame,
    fps,
    width,
    height,
    durationFrames: durationFrames ?? animation.entry.durationFrames,
  });
}

/**
 * Position style for an element using percentage-based layout.
 * Returns CSS properties for absolute positioning within the canvas.
 */
export function getElementPositionStyle(
  layout: ResolvedElementLayout,
  canvasWidth: number,
  canvasHeight: number,
): React.CSSProperties {
  return {
    position: 'absolute' as const,
    left: `${layout.x}%`,
    top: `${layout.y}%`,
  };
}
