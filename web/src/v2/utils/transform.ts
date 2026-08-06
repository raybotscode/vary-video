/**
 * V2 CSS Transform Builder.
 *
 * Builds CSS style objects from V2Element transform and props.
 * All coordinates are normalized (0-1), rendered as percentages.
 */

import type {V2Element} from '@vary/v2/schema/document';
import type React from 'react';

/**
 * Build CSS properties for positioning an element on the stage.
 * Uses percentage-based positioning with transform for anchor offset.
 */
export function buildElementStyle(element: V2Element): React.CSSProperties {
  const t = element.transform;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${t.x * 100}%`,
    top: `${t.y * 100}%`,
    width: t.width !== null ? `${t.width * 100}%` : undefined,
    height: t.height !== null ? `${t.height * 100}%` : undefined,
    transform: `translate(-${t.anchorX * 100}%, -${t.anchorY * 100}%) rotate(${t.rotation}deg)`,
    transformOrigin: `${t.anchorX * 100}% ${t.anchorY * 100}%`,
    opacity: t.opacity,
    zIndex: t.zIndex,
    pointerEvents: element.locked ? 'none' : 'auto',
  };

  return style;
}

/**
 * Build CSS for the selection overlay to match the element's bounding box.
 * This sits on top of the element in a separate layer.
 */
export function buildSelectionOverlayStyle(element: V2Element): React.CSSProperties {
  const t = element.transform;

  // For the overlay, we position at top-left and use width/height.
  // The element's anchor is handled by negating the offset.
  return {
    position: 'absolute',
    left: `${(t.x - t.anchorX * (t.width ?? 0.3)) * 100}%`,
    top: `${(t.y - t.anchorY * (t.height ?? 0.15)) * 100}%`,
    width: t.width !== null ? `${t.width * 100}%` : 'auto',
    height: t.height !== null ? `${t.height * 100}%` : 'auto',
    transform: `rotate(${t.rotation}deg)`,
    transformOrigin: `${t.anchorX * 100}% ${t.anchorY * 100}%`,
    zIndex: t.zIndex + 1000, // Always on top
    pointerEvents: 'none',   // Don't intercept clicks — handles are interactive
  };
}
