/**
 * EditOverlay — transparent clickable regions on top of the Remotion Player.
 *
 * Renders invisible positioned divs corresponding to each content field in the
 * active block. Hovering shows a dashed outline; clicking selects the field in
 * the EditPanel below.
 */

import type {ComposerBlock} from '../../utils/blocks';
import type {VariantData} from '../../utils/placeholder';
import {blockCapabilities} from '@vary/shared/capabilities/blocks';
import {resolvePlaceholders} from '../../utils/placeholder';

type EditOverlayProps = {
  block: ComposerBlock;
  variant: VariantData;
  selectedFieldKey: string | null;
  onSelectField: (fieldKey: string | null) => void;
};

export default function EditOverlay({
  block,
  variant,
  selectedFieldKey,
  onSelectField,
}: EditOverlayProps) {
  const definition = blockCapabilities.find((c) => c.id === block.blockId);
  if (!definition) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {definition.contentFields.map((field) => {
        const layout = block.layout?.[field.key];
        const x = layout?.x ?? 50;
        const y = layout?.y ?? 50;
        const fontSize = layout?.fontSize ?? 86;
        const isSelected = selectedFieldKey === field.key;

        // Resolve the display value
        const rawValue = block.content[field.key] ?? field.placeholder ?? '';
        const displayValue = resolvePlaceholders(rawValue, variant);

        // Position the overlay region centered at (x%, y%)
        // Size is proportional to font size (rough estimate for text area)
        const widthPx = Math.max(200, fontSize * 8);
        const heightPx = Math.max(40, fontSize * 1.8);

        return (
          <div
            key={field.key}
            data-overlay-field={field.key}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              width: widthPx,
              height: heightPx,
              pointerEvents: 'auto',
              cursor: 'pointer',
              borderRadius: 6,
              border: isSelected
                ? '2px solid #3B82F6'
                : '2px dashed transparent',
              background: isSelected
                ? 'rgba(59, 130, 246, 0.08)'
                : 'transparent',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.border =
                  '2px dashed rgba(59, 130, 246, 0.5)';
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(59, 130, 246, 0.04)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.border =
                  '2px dashed transparent';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectField(isSelected ? null : field.key);
            }}
            title={`Click to edit: ${field.label}`}
          >
            <span
              style={{
                fontSize: 11,
                color: isSelected ? '#3B82F6' : 'rgba(59, 130, 246, 0.6)',
                fontWeight: 600,
                pointerEvents: 'none',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '0 8px',
              }}
            >
              {field.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
