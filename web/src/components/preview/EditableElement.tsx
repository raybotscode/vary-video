/**
 * EditableElement — a single draggable, resizable, inline-editable text element
 * positioned on the EditCanvas.
 *
 * Uses a FULLY UNCONTROLLED approach for contentEditable:
 * - Text content is managed via ref (not React children)
 * - React never re-renders the div's content during editing
 * - This prevents the "React overwrites user input" bug
 */

import {useCallback, useRef, useState, useEffect} from 'react';

export type EditableElementProps = {
  fieldKey: string;
  label: string;
  displayValue: string;
  rawValue: string;
  x: number;          // 0-100 percentage
  y: number;          // 0-100 percentage
  fontSize: number;    // 1920-scale canvas pixels
  color: string;
  scaleFactor: number; // containerWidth / 1920
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (fontSize: number) => void;
  onContentChange: (value: string) => void;
};

const HANDLE_SIZE = 8;

export default function EditableElement({
  fieldKey,
  label,
  displayValue,
  rawValue,
  x,
  y,
  fontSize,
  color,
  scaleFactor,
  isSelected,
  isEditing,
  onSelect,
  onStartEdit,
  onStopEdit,
  onMove,
  onResize,
  onContentChange,
}: EditableElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Scale font size for display
  const displayFontSize = Math.max(12, Math.round(fontSize * scaleFactor));

  // ─── Text content management (uncontrolled) ────────────────────

  // Sync display text when NOT editing (normal React updates)
  useEffect(() => {
    if (!isEditing && elementRef.current) {
      const text = displayValue || label;
      if (elementRef.current.textContent !== text) {
        elementRef.current.textContent = text;
      }
    }
  }, [displayValue, label, isEditing]);

  // When entering edit mode: set text, focus, select all
  useEffect(() => {
    if (isEditing && elementRef.current) {
      const el = elementRef.current;
      // Set the resolved display value (not raw {{placeholders}})
      el.textContent = displayValue;
      // Focus and select all text
      requestAnimationFrame(() => {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
    }
  }, [isEditing]); // Only run when isEditing changes

  // ─── Drag ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return;
      if ((e.target as HTMLElement).dataset.handle) return;

      e.preventDefault();
      e.stopPropagation();
      onSelect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = x;
      const startTop = y;

      const canvas = (e.currentTarget as HTMLElement).closest('[data-edit-canvas]');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const handleMouseMove = (e: MouseEvent) => {
        const dx = ((e.clientX - startX) / rect.width) * 100;
        const dy = ((e.clientY - startY) / rect.height) * 100;
        onMove(
          Math.max(0, Math.min(100, startLeft + dx)),
          Math.max(0, Math.min(100, startTop + dy)),
        );
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isEditing, x, y, onSelect, onMove],
  );

  // ─── Resize ──────────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startY = e.clientY;
      const startFontSize = fontSize;

      const canvas = (e.currentTarget as HTMLElement).closest('[data-edit-canvas]');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const handleMouseMove = (e: MouseEvent) => {
        const dy = e.clientY - startY;
        const scale = 1 + (dy / rect.height) * 3;
        const newCanvasFontSize = Math.max(12, Math.min(200, Math.round(startFontSize * scale)));
        onResize(newCanvasFontSize);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [fontSize, onResize],
  );

  // ─── Inline editing ──────────────────────────────────────────────

  const handleDoubleClick = useCallback(() => {
    if (isEditing) return;
    onStartEdit();
  }, [isEditing, onStartEdit]);

  const handleBlur = useCallback(() => {
    // Read text directly from DOM — no React state involved
    const text = elementRef.current?.textContent ?? displayValue;
    onContentChange(text);
    onStopEdit();
  }, [displayValue, onContentChange, onStopEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = elementRef.current?.textContent ?? displayValue;
        onContentChange(text);
        onStopEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Revert to original display value
        if (elementRef.current) {
          elementRef.current.textContent = displayValue;
        }
        onStopEdit();
      }
    },
    [displayValue, onContentChange, onStopEdit],
  );

  // ─── Styles ──────────────────────────────────────────────────────

  const borderColor = isEditing
    ? '#3B82F6'
    : isSelected
      ? '#3B82F6'
      : isHovered
        ? 'rgba(59,130,246,0.4)'
        : 'transparent';

  const borderStyle = isEditing || isSelected
    ? '2px solid'
    : isHovered
      ? '1px dashed'
      : 'none';

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 20 : 10,
      }}
    >
      {/* Main element — fully uncontrolled contentEditable */}
      <div
        ref={elementRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
        onBlur={isEditing ? handleBlur : undefined}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        style={{
          minWidth: 80,
          minHeight: 28,
          padding: '4px 8px',
          fontSize: displayFontSize,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          color: color,
          lineHeight: 1.3,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          cursor: isEditing ? 'text' : 'move',
          borderRadius: 4,
          border: borderStyle === 'none' ? 'none' : `${borderStyle} ${borderColor}`,
          background: isSelected || isEditing ? 'rgba(59,130,246,0.06)' : 'transparent',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          userSelect: isEditing ? 'text' : 'none',
          maxWidth: '90%',
          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
      {/* Note: NO children. Text is managed via ref.textContent */}

      {/* Resize handles — only when selected and not editing */}
      {isSelected && !isEditing && (
        <>
          <div data-handle="br" onMouseDown={handleResizeStart} style={{position: 'absolute', right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2, width: HANDLE_SIZE, height: HANDLE_SIZE, background: '#3B82F6', borderRadius: 2, cursor: 'nwse-resize', border: '1px solid #fff'}} />
          <div data-handle="bl" onMouseDown={handleResizeStart} style={{position: 'absolute', left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2, width: HANDLE_SIZE, height: HANDLE_SIZE, background: '#3B82F6', borderRadius: 2, cursor: 'nesw-resize', border: '1px solid #fff'}} />
          <div data-handle="tr" onMouseDown={handleResizeStart} style={{position: 'absolute', right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2, width: HANDLE_SIZE, height: HANDLE_SIZE, background: '#3B82F6', borderRadius: 2, cursor: 'nesw-resize', border: '1px solid #fff'}} />
          <div data-handle="tl" onMouseDown={handleResizeStart} style={{position: 'absolute', left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2, width: HANDLE_SIZE, height: HANDLE_SIZE, background: '#3B82F6', borderRadius: 2, cursor: 'nwse-resize', border: '1px solid #fff'}} />
        </>
      )}
    </div>
  );
}
