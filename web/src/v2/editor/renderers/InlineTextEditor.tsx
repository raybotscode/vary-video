/**
 * InlineTextEditor — contentEditable div with merge tag support.
 *
 * Double-click a text element to inline edit.
 * - Type to edit
 * - Use {{tag}} syntax for merge tags
 * - Escape to cancel, Enter to commit, blur to commit
 */

import {useRef, useEffect, useState} from 'react';
import type React from 'react';
import type {TextElement} from '@vary/v2/schema/document';

interface InlineTextEditorProps {
  element: TextElement;
  scale: number;
  onCommit: (content: string) => void;
  onCancel: () => void;
}

export default function InlineTextEditor({
  element, scale, onCommit, onCancel,
}: InlineTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasCommitted, setHasCommitted] = useState(false);

  // Initialize content and focus
  useEffect(() => {
    const el = ref.current;
    if (!el || hasCommitted) return;

    el.textContent = element.props.content;
    el.focus();
    // Select all for easy replacement
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  const commit = () => {
    if (hasCommitted) return;
    setHasCommitted(true);
    const text = ref.current?.textContent ?? '';
    onCommit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setHasCommitted(true);
      onCancel();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  };

  const handleBlur = () => {
    commit();
  };

  const displayFontSize = Math.max(12, Math.round(element.props.fontSize * scale));

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        fontSize: displayFontSize,
        fontFamily: element.props.fontFamily,
        fontWeight: element.props.fontWeight,
        fontStyle: element.props.fontStyle === 'italic' ? 'italic' : 'normal',
        lineHeight: element.props.lineHeight,
        color: element.props.color,
        textAlign: element.props.textAlign as any,
        outline: 'none',
        minWidth: 40,
        minHeight: displayFontSize * 1.5,
        cursor: 'text',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    />
  );
}
