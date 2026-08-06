/**
 * V2 Shape Renderer — renders a ShapeElement as a DOM node.
 *
 * Supports rectangle, rounded-rect, circle, line, star, triangle,
 * diamond, and hexagon using CSS clip-path.
 */

import {useMemo} from 'react';
import type {ShapeElement} from '@vary/v2/schema/document';

interface ShapeRendererProps {
  element: ShapeElement;
}

/** Get clip-path for each shape type (relative to element bounds) */
function getClipPath(shapeType: string): string {
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
    case 'line':
      return 'none';
    case 'rounded-rect':
      return 'none';
    case 'rectangle':
    default:
      return 'none';
  }
}

export default function ShapeRenderer({element}: ShapeRendererProps) {
  // Props are resolved by ElementRenderer's useMergePreview, so they're
  // plain strings/numbers at render time. Handle any lingering complex types.
  const rawProps = element.props as Record<string, unknown>;
  const shapeType = String(rawProps.shapeType ?? 'rectangle');
  const fill = String(rawProps.fill ?? '#3182CE');
  const stroke: string | null = rawProps.stroke != null ? String(rawProps.stroke) : null;
  const strokeWidth = Number(rawProps.strokeWidth ?? 0);
  const borderRadius = Number(rawProps.borderRadius ?? 0);

  const isLine = shapeType === 'line';
  const isCircle = shapeType === 'circle';
  const hasClip = !['rectangle', 'rounded-rect', 'line'].includes(shapeType);

  const br = useMemo(() => {
    if (shapeType === 'rounded-rect') return borderRadius || 12;
    if (isCircle) return '50%';
    return borderRadius;
  }, [shapeType, borderRadius, isCircle]);

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
      } as React.CSSProperties}
    />
  );
}
