/**
 * TagToken — renders a single {{key}} merge tag token.
 *
 * Displays a tag reference as a highlighted inline pill, optionally
 * with a highlighted background when showHighlights is true.
 */

import React from 'react';
import type {MergeTag} from '@vary/v2/schema/document';
import {getTagTypeColor} from './TagTypeIcon';

interface TagTokenProps {
  tagKey: string;
  tag?: MergeTag;
  showHighlight?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function TagToken({
  tagKey,
  tag,
  showHighlight = false,
  onClick,
  className,
  style,
}: TagTokenProps) {
  const tagType = tag?.type ?? 'text';
  const color = getTagTypeColor(tagType);

  return (
    <span
      className={className}
      onClick={onClick}
      style={{
        display: 'inline',
        padding: '1px 4px',
        borderRadius: 4,
        fontFamily: 'monospace',
        fontSize: '0.9em',
        fontWeight: 600,
        color: showHighlight ? color : '#6366F1',
        backgroundColor: showHighlight ? `${color}20` : 'transparent',
        border: showHighlight ? `1px solid ${color}40` : 'none',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        ...style,
      }}
      title={tag ? `${tag.key} (${tag.type})` : tagKey}
    >
      {`{{${tagKey}}}`}
    </span>
  );
}
