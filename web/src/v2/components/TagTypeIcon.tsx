/**
 * TagTypeIcon — visual icon representing a merge tag type.
 *
 * Displays a small icon based on the merge tag's type for use in
 * lists, dropdowns, and property panels.
 */

import React from 'react';

interface TagTypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

/** Returns an emoji/icon glyph for a merge tag type. */
export function getTagTypeIcon(type: string): string {
  switch (type) {
    case 'text': return 'Aa';
    case 'number': return '#';
    case 'currency': return '$';
    case 'color': return '🎨';
    case 'image': return '🖼';
    case 'boolean': return '✓';
    case 'url': return '🔗';
    case 'date': return '📅';
    default: return '?';
  }
}

/** Returns a CSS color for a merge tag type. */
export function getTagTypeColor(type: string): string {
  switch (type) {
    case 'text': return '#3B82F6';
    case 'number': return '#10B981';
    case 'currency': return '#F59E0B';
    case 'color': return '#8B5CF6';
    case 'image': return '#EC4899';
    case 'boolean': return '#6366F1';
    case 'url': return '#06B6D4';
    case 'date': return '#F97316';
    default: return '#6B7280';
  }
}

export default function TagTypeIcon({type, size = 16, className}: TagTypeIconProps) {
  const icon = getTagTypeIcon(type);
  const color = getTagTypeColor(type);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        fontSize: size > 20 ? size * 0.5 : 10,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
      title={type}
    >
      {icon}
    </span>
  );
}
