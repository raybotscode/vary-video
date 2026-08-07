/**
 * V2 Text Renderer — renders a TextElement as a DOM node.
 *
 * Scales font size from design-space (1920px canvas) to display pixels.
 * Phase 3: read-only (no inline editing yet).
 */

import type {TextElement} from '@vary/v2/schema/document';
import InlineTextEditor from './InlineTextEditor';

interface TextRendererProps {
  element: TextElement;
  scale: number;
  isEditing?: boolean;
  onCommitText?: (content: string) => void;
  onCancelEdit?: () => void;
}

export default function TextRenderer({element, scale, isEditing, onCommitText, onCancelEdit}: TextRendererProps) {
  const {props} = element;

  // Inline editing mode
  if (isEditing && onCommitText && onCancelEdit) {
    return (
      <InlineTextEditor
        element={element}
        scale={scale}
        onCommit={onCommitText}
        onCancel={onCancelEdit}
      />
    );
  }

  // Scale font size from design resolution to display
  const displayFontSize = Math.max(10, Math.round(props.fontSize * scale));

  return (
    <div
      style={{
        fontSize: displayFontSize,
        fontFamily: props.fontFamily,
        fontWeight: props.fontWeight,
        fontStyle: props.fontStyle === 'italic' ? 'italic' : 'normal',
        lineHeight: props.lineHeight,
        letterSpacing: `${props.letterSpacing * scale}px`,
        color: props.color,
        textAlign: props.textAlign as React.CSSProperties['textAlign'],
        textTransform: props.textTransform === 'none' ? undefined : props.textTransform,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        textShadow: props.color === '#FFFFFF' ? '0 1px 3px rgba(0,0,0,0.3)' : undefined,
        backgroundColor: props.backgroundColor ?? undefined,
        padding: props.padding ? `${props.padding * scale}px` : undefined,
        borderRadius: props.borderRadius ? `${props.borderRadius * scale}px` : undefined,
        display: element.transform.height !== null ? 'flex' : undefined,
        alignItems: element.transform.height !== null ? flexAlign(props.verticalAlign) : undefined,
        justifyContent: element.transform.height !== null ? flexJustify(props.textAlign) : undefined,
      }}
    >
      {props.content}
    </div>
  );
}

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
