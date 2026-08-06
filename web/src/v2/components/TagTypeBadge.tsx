/**
 * TagTypeBadge — small colored badge showing merge tag type.
 *
 * Used in tag lists and property panels to display the tag type
 * as a compact colored pill with an icon.
 */

import React from 'react';
import TagTypeIcon, {getTagTypeColor} from './TagTypeIcon';

interface TagTypeBadgeProps {
  type: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function TagTypeBadge({type, label, size = 'sm', className}: TagTypeBadgeProps) {
  const color = getTagTypeColor(type);
  const displayLabel = label ?? type;
  const isSm = size === 'sm';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 2 : 4,
        padding: isSm ? '1px 6px' : '2px 8px',
        borderRadius: 9999,
        fontSize: isSm ? 10 : 12,
        fontWeight: 500,
        lineHeight: isSm ? '14px' : '16px',
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
      }}
    >
      <TagTypeIcon type={type} size={isSm ? 12 : 14} />
      <span style={{textTransform: 'capitalize'}}>{displayLabel}</span>
    </span>
  );
}
