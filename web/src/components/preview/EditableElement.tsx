/**
 * EditableElement — a single draggable, resizable, inline-editable text element
 * positioned on the EditCanvas. Handles click-to-select, drag-to-move,
 * corner-handle resize, and double-click-to-edit.
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [editText, setEditText] = useState(rawValue);

  // Scale font size for display
  const displayFontSize = Math.max(12, Math.round(fontSize * scaleFactor));
  // Estimate element dimensions based on font size and text length
  const estWidth = Math.max(120, displayValue.length * displayFontSize * 0.5);
  const estHeight = Math.max(36, displayFontSize * 1.6);

  // Sync editText when rawValue changes externally
  useEffect(() => {
    if (!isEditing) setEditText(rawValue);
  }, [rawValue, isEditing]);

  // Focus contentEditable when entering edit mode
  useEffect(() => {
    if (isEditing && elementRef.current) {
      requestAnimationFrame(() => {
        const el = elementRef.current;
        if (!el) return;
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
    }
  }, [isEditing]);

  // ─── Drag ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return;
      if ((e.target as HTMLElement).dataset.handle) return; // Don't drag on resize handles

      e.preventDefault();
      e.stopPropagation();
      onSelect();

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = x;
      const startTop = y;

      // Get canvas dimensions from parent
      const canvas = (e.currentTarget as HTMLElement).parentElement;
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
    onContentChange(editText);
    onStopEdit();
  }, [editText, onContentChange, onStopEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onContentChange(editText);
        onStopEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditText(rawValue); // Revert
        onStopEdit();
      }
    },
    [editText, rawValue, onContentChange, onStopEdit],
  );

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    setEditText((e.currentTarget as HTMLDivElement).textContent ?? '');
  }, []);

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
      ref={canvasRef}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isSelected ? 20 : 10,
      }}
    >
      {/* Main element */}
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
        onInput={isEditing ? handleInput : undefined}
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
      >
        {isEditing ? undefined : displayValue || label}
      </div>

      {/* Resize handles — only when selected and not editing */}
      {isSelected && !isEditing && (
        <>
          {/* Bottom-right */}
          <div
            data-handle="br"
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              right: -HANDLE_SIZE / 2,
              bottom: -HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: '#3B82F6',
              borderRadius: 2,
              cursor: 'nwse-resize',
              border: '1px solid #fff',
            }}
          />
          {/* Bottom-left */}
          <div
            data-handle="bl"
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              left: -HANDLE_SIZE / 2,
              bottom: -HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: '#3B82F6',
              borderRadius: 2,
              cursor: 'nesw-resize',
              border: '1px solid #fff',
            }}
          />
          {/* Top-right */}
          <div
            data-handle="tr"
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              right: -HANDLE_SIZE / 2,
              top: -HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: '#3B82F6',
              borderRadius: 2,
              cursor: 'nesw-resize',
              border: '1px solid #fff',
            }}
          />
          {/* Top-left */}
          <div
            data-handle="tl"
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              left: -HANDLE_SIZE / 2,
              top: -HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: '#3B82F6',
              borderRadius: 2,
              cursor: 'nwse-resize',
              border: '1px solid #fff',
            }}
          />
        </>
      )}
    </div>
  );
}
