/**
 * BindableTextDisplay — renders BindableText as rich text with
 * highlighted merge tag tokens.
 *
 * Splits a BindableText into literal spans and TagToken components
 * for visual distinction between static text and merge tags.
 */

import React from 'react';
import type {BindableText} from '@vary/v2/schema/bindable';
import type {MergeTag} from '@vary/v2/schema/document';
import TagToken from './TagToken';

interface BindableTextDisplayProps {
  /** The BindableText to render. */
  bindableText: BindableText;
  /** All merge tags for resolving tagId → tag info. */
  tags: MergeTag[];
  /** Whether to highlight tag tokens. */
  showHighlights?: boolean;
  /** Callback when a tag token is clicked. */
  onTagClick?: (tagId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function BindableTextDisplay({
  bindableText,
  tags,
  showHighlights = false,
  onTagClick,
  className,
  style,
}: BindableTextDisplayProps) {
  if (!bindableText || !bindableText.tokens) {
    return null;
  }

  return (
    <span className={className} style={style}>
      {bindableText.tokens.map((token) => {
        if (token._type === 'literal') {
          return <span key={token.id}>{token.text}</span>;
        }

        // Tag token
        const tag = tags.find((t) => t.id === token.tagId);
        const key = tag?.key ?? token.tagId;

        return (
          <TagToken
            key={token.id}
            tagKey={key}
            tag={tag}
            showHighlight={showHighlights}
            onClick={onTagClick ? () => onTagClick(token.tagId) : undefined}
          />
        );
      })}
    </span>
  );
}
