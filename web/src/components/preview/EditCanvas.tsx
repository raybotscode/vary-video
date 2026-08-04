/**
 * EditCanvas — interactive HTML/CSS overlay that replaces the Player during
 * edit mode. Renders the active block's content fields as positioned elements
 * that can be dragged, resized, and edited inline.
 */

import {useEffect, useCallback} from 'react';
import type {ComposerBlock} from '../../utils/blocks';
import type {VariantData} from '../../utils/placeholder';
import type {BrandSettings} from '@vary/compositions/blocks/registry';
import {blockCapabilities} from '@vary/shared/capabilities/blocks';
import {resolvePlaceholders} from '../../utils/placeholder';
import {safeHexColor} from '@vary/components/util';
import EditableElement from './EditableElement';
import ElementToolbar from './ElementToolbar';

type EditCanvasProps = {
  blocks: ComposerBlock[];
  activeBlockIndex: number;
  variant: VariantData;
  brandSettings: BrandSettings;
  containerWidth: number;
  containerHeight: number;
  selectedFieldKey: string | null;
  editingFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
  onStartEditField: (fieldKey: string) => void;
  onStopEditField: () => void;
  onMoveField: (fieldKey: string, x: number, y: number) => void;
  onResizeField: (fieldKey: string, fontSize: number) => void;
  onContentChange: (fieldKey: string, value: string) => void;
  onColorChange: (fieldKey: string, color: string) => void;
  onExitEdit: () => void;
};

// ─── Background resolver ──────────────────────────────────────────

function getBlockBackground(
  blockId: string,
  brand: BrandSettings,
): React.CSSProperties {
  const bg = safeHexColor(brand.backgroundColor, '#F7FAFC');
  const sec = safeHexColor(brand.secondaryColor, '#3182CE');

  if (brand.backgroundType === 'solid') {
    return {background: bg};
  }
  if (brand.backgroundType === 'image' && brand.backgroundImageUrl) {
    return {
      background: `url(${brand.backgroundImageUrl}) center/cover no-repeat`,
    };
  }

  // Gradient — match block renderer conventions
  switch (blockId) {
    case 'data-callout':
      return {
        background: `linear-gradient(135deg, #FFFFFF 0%, ${sec}18 100%)`,
      };
    case 'text-overlay':
    default:
      return {
        background: `linear-gradient(135deg, ${bg} 0%, ${sec}20 100%)`,
      };
  }
}

// ─── Main component ───────────────────────────────────────────────

export default function EditCanvas({
  blocks,
  activeBlockIndex,
  variant,
  brandSettings,
  containerWidth,
  containerHeight,
  selectedFieldKey,
  editingFieldKey,
  onSelectField,
  onStartEditField,
  onStopEditField,
  onMoveField,
  onResizeField,
  onContentChange,
  onColorChange,
  onExitEdit,
}: EditCanvasProps) {
  const activeBlock = blocks[activeBlockIndex];
  const definition = activeBlock
    ? blockCapabilities.find((c) => c.id === activeBlock.blockId)
    : null;

  // Scale factor: canvas renders at 1920px wide
  const scaleFactor = containerWidth / 1920;

  // Escape key exits edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExitEdit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onExitEdit]);

  // Click on background deselects
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only deselect if clicking the canvas itself, not a child
      if (e.target === e.currentTarget) {
        onSelectField(null);
      }
    },
    [onSelectField],
  );

  if (!activeBlock || !definition) {
    return (
      <div
        data-edit-canvas
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9CA3AF',
          fontSize: 14,
          ...getBlockBackground('default', brandSettings),
        }}
      >
        No active block
      </div>
    );
  }

  const backgroundStyle = getBlockBackground(activeBlock.blockId, brandSettings);
  const fields = definition.contentFields;

  // Find the selected element's position for the toolbar
  const selectedField = selectedFieldKey
    ? fields.find((f) => f.key === selectedFieldKey)
    : null;
  const selectedLayout = selectedField
    ? activeBlock.layout?.[selectedField.key]
    : null;
  const selectedX = selectedLayout?.x ?? 50;
  const selectedY = selectedLayout?.y ?? 50;
  const selectedFontSize = selectedLayout?.fontSize ?? 86;
  const selectedColor = selectedLayout?.color ?? safeHexColor(brandSettings.brandColor, '#1A365D');
  const displayFontSize = Math.max(12, Math.round(selectedFontSize * scaleFactor));

  return (
    <div
      data-edit-canvas
      onClick={handleCanvasClick}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
        ...backgroundStyle,
      }}
    >
      {/* Background image if applicable */}
      {brandSettings.backgroundType === 'image' &&
        brandSettings.backgroundImageUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${brandSettings.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.16,
            }}
          />
        )}

      {/* Editable elements */}
      {fields.map((field) => {
        const rawValue =
          activeBlock.content[field.key] ?? field.placeholder ?? '';
        const displayValue = resolvePlaceholders(rawValue, variant);
        const layout = activeBlock.layout?.[field.key];
        const x = layout?.x ?? 50;
        const y = layout?.y ?? 50;
        const fontSize = layout?.fontSize ?? 86;
        const color =
          layout?.color ??
          safeHexColor(brandSettings.brandColor, '#1A365D');
        const isSelected = selectedFieldKey === field.key;
        const isEditing = editingFieldKey === field.key;

        return (
          <EditableElement
            key={field.key}
            fieldKey={field.key}
            label={field.label}
            displayValue={displayValue}
            rawValue={rawValue}
            x={x}
            y={y}
            fontSize={fontSize}
            color={color}
            scaleFactor={scaleFactor}
            isSelected={isSelected}
            isEditing={isEditing}
            onSelect={() => onSelectField(field.key)}
            onStartEdit={() => onStartEditField(field.key)}
            onStopEdit={onStopEditField}
            onMove={(newX, newY) => onMoveField(field.key, newX, newY)}
            onResize={(newFontSize) => onResizeField(field.key, newFontSize)}
            onContentChange={(val) => onContentChange(field.key, val)}
          />
        );
      })}

      {/* Floating toolbar above selected element */}
      {selectedFieldKey && (
        <div
          style={{
            position: 'absolute',
            left: `${selectedX}%`,
            top: `${selectedY}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          <div style={{position: 'relative', pointerEvents: 'auto'}}>
            <ElementToolbar
              isVisible={true}
              currentColor={selectedColor}
              currentFontSize={displayFontSize}
              onColorChange={(c) => onColorChange(selectedFieldKey, c)}
              onFontSizeChange={(delta) => {
                // Convert delta to canvas-scale and apply
                const newCanvasFontSize = Math.max(
                  12,
                  Math.min(200, selectedFontSize + delta),
                );
                onResizeField(selectedFieldKey, newCanvasFontSize);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit mode indicator */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '4px 10px',
          background: 'rgba(59, 130, 246, 0.9)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 6,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        ✏️ Edit Mode — click text to select, drag to move, double-click to type
      </div>
    </div>
  );
}
