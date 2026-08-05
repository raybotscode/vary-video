/**
 * V2 Properties Panel — schema-driven right sidebar.
 *
 * Renders property controls for the selected element based on
 * the ElementDefinition.properties metadata.
 *
 * Each property type renders a different control:
 * - text → input field
 * - number → input with min/max
 * - slider → range slider
 * - color → color picker with swatches
 * - select → dropdown
 * - boolean → checkbox
 * - image → file picker
 */

import {useCallback} from 'react';
import type {V2Element} from '../schema/document';
import type {PropertyMetadata} from '../registry/elements';
import {getElement} from '../registry/elements';

type PropertiesPanelProps = {
  element: V2Element | null;
  onChangeProp: (key: string, value: unknown) => void;
  onChangeTransform: (field: string, value: number) => void;
  onClose: () => void;
};

const COLOR_SWATCHES = [
  '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
  '#1A365D', '#2D3748', '#1A202C', '#000000',
  '#3182CE', '#2B6CB0', '#38A169', '#D69E2E',
  '#DD6B20', '#E53E3E', '#9F7AEA', '#ED64A6',
];

export default function PropertiesPanel({
  element,
  onChangeProp,
  onChangeTransform,
  onClose,
}: PropertiesPanelProps) {
  if (!element) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={{fontSize: 13, fontWeight: 600, color: '#9CA3AF'}}>Properties</span>
        </div>
        <div style={{padding: 16, textAlign: 'center', color: '#6B7280', fontSize: 13}}>
          Select an element to edit its properties
        </div>
      </div>
    );
  }

  const def = getElement(element.type);
  const {transform} = element;
  const props = element.props as Record<string, unknown>;

  const handlePropChange = useCallback(
    (key: string, value: unknown) => {
      onChangeProp(key, value);
    },
    [onChangeProp],
  );

  // Group properties by their group field
  const groups = new Map<string, PropertyMetadata[]>();
  for (const prop of def.properties) {
    const group = prop.group ?? 'General';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(prop);
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <span style={{fontSize: 13, fontWeight: 600, color: '#374151'}}>
            {def.icon} {element.name}
          </span>
          <span style={{fontSize: 11, color: '#9CA3AF', marginLeft: 8}}>
            {def.name}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            color: '#9CA3AF',
            padding: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Transform controls */}
      <div style={{padding: '12px 16px', borderBottom: '1px solid #E5E7EB'}}>
        <div style={{fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8}}>
          Position
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
          <LabeledInput
            label="X"
            value={Math.round(transform.x * 100)}
            onChange={(v) => onChangeTransform('x', v / 100)}
            suffix="%"
            min={0}
            max={100}
          />
          <LabeledInput
            label="Y"
            value={Math.round(transform.y * 100)}
            onChange={(v) => onChangeTransform('y', v / 100)}
            suffix="%"
            min={0}
            max={100}
          />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8}}>
          <LabeledInput
            label="Width"
            value={transform.width !== null ? Math.round(transform.width * 100) : null}
            onChange={(v) => onChangeTransform('width', v !== null ? v / 100 : null as unknown as number)}
            suffix="%"
            min={0}
            max={100}
            nullable
          />
          <LabeledInput
            label="Height"
            value={transform.height !== null ? Math.round(transform.height * 100) : null}
            onChange={(v) => onChangeTransform('height', v !== null ? v / 100 : null as unknown as number)}
            suffix="%"
            min={0}
            max={100}
            nullable
          />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8}}>
          <LabeledInput
            label="Rotation"
            value={Math.round(transform.rotation)}
            onChange={(v) => onChangeTransform('rotation', v)}
            suffix="°"
            min={-360}
            max={360}
          />
          <LabeledInput
            label="Z-Index"
            value={transform.zIndex}
            onChange={(v) => onChangeTransform('zIndex', v)}
            min={0}
            max={1000}
          />
          <LabeledInput
            label="Opacity"
            value={Math.round(transform.opacity * 100)}
            onChange={(v) => onChangeTransform('opacity', v / 100)}
            suffix="%"
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Property groups */}
      {Array.from(groups.entries()).map(([groupName, properties]) => (
        <div key={groupName} style={{padding: '12px 16px', borderBottom: '1px solid #E5E7EB'}}>
          <div style={{fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8}}>
            {groupName}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {properties.map((prop) => {
              const value = props[prop.key];
              const isAdvanced = prop.advanced ?? false;

              return (
                <div key={prop.key} style={{opacity: isAdvanced ? 0.7 : 1}}>
                  {prop.type === 'text' && (
                    <LabeledInput
                      label={prop.label}
                      value={value as string ?? ''}
                      onChange={(v) => handlePropChange(prop.key, v)}
                    />
                  )}
                  {prop.type === 'number' && (
                    <LabeledInput
                      label={prop.label}
                      value={value as number ?? 0}
                      onChange={(v) => handlePropChange(prop.key, v)}
                      min={prop.min}
                      max={prop.max}
                      suffix={prop.unit}
                    />
                  )}
                  {prop.type === 'slider' && (
                    <div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                        <label style={{fontSize: 11, color: '#6B7280'}}>{prop.label}</label>
                        <span style={{fontSize: 11, color: '#9CA3AF'}}>
                          {value as number ?? 0}{prop.unit ?? ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={prop.min ?? 0}
                        max={prop.max ?? 100}
                        step={prop.step ?? 1}
                        value={value as number ?? 0}
                        onChange={(e) => handlePropChange(prop.key, Number(e.target.value))}
                        style={{width: '100%', height: 4, cursor: 'pointer'}}
                      />
                    </div>
                  )}
                  {prop.type === 'color' && (
                    <div>
                      <label style={{fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4}}>
                        {prop.label}
                      </label>
                      <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                        {COLOR_SWATCHES.map((color) => (
                          <button
                            key={color}
                            onClick={() => handlePropChange(prop.key, color)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              border: value === color ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                              background: color,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        value={value as string ?? ''}
                        onChange={(e) => handlePropChange(prop.key, e.target.value)}
                        style={{
                          width: '100%',
                          marginTop: 4,
                          padding: '3px 6px',
                          fontSize: 11,
                          border: '1px solid #E5E7EB',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}
                  {prop.type === 'select' && (
                    <div>
                      <label style={{fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4}}>
                        {prop.label}
                      </label>
                      <select
                        value={value as string ?? ''}
                        onChange={(e) => handlePropChange(prop.key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          fontSize: 12,
                          border: '1px solid #E5E7EB',
                          borderRadius: 4,
                          background: '#fff',
                          boxSizing: 'border-box',
                        }}
                      >
                        {prop.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {prop.type === 'boolean' && (
                    <label style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#374151', cursor: 'pointer'}}>
                      <input
                        type="checkbox"
                        checked={value as boolean ?? false}
                        onChange={(e) => handlePropChange(prop.key, e.target.checked)}
                      />
                      {prop.label}
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Element info */}
      <div style={{padding: '12px 16px', fontSize: 10, color: '#9CA3AF'}}>
        ID: {element.id} · Type: {element.type}
        {element.locked && ' · Locked'}
        {!element.visible && ' · Hidden'}
      </div>
    </div>
  );
}

// ─── Labeled Input ─────────────────────────────────────────────────

function LabeledInput({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  nullable,
}: {
  label: string;
  value: string | number | null;
  onChange: (value: any) => void;
  suffix?: string;
  min?: number;
  max?: number;
  nullable?: boolean;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF'}}>{label}</label>
        {nullable && (
          <button
            onClick={() => onChange(value === null ? (min ?? 0) : null)}
            style={{
              fontSize: 9,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: value === null ? '#3B82F6' : '#9CA3AF',
              padding: 0,
            }}
          >
            {value === null ? 'set' : 'auto'}
          </button>
        )}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? (nullable ? null : 0) : Number(e.target.value);
            if (v !== null && min !== undefined && v < min) return;
            if (v !== null && max !== undefined && v > max) return;
            onChange(v);
          }}
          placeholder={nullable ? 'auto' : undefined}
          style={{
            width: '100%',
            padding: '3px 6px',
            fontSize: 11,
            border: '1px solid #E5E7EB',
            borderRadius: 4,
            boxSizing: 'border-box',
            fontVariantNumeric: 'tabular-nums',
          }}
          min={min}
          max={max}
        />
        {suffix && (
          <span style={{fontSize: 10, color: '#9CA3AF', minWidth: 16}}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 260,
  background: '#fff',
  borderLeft: '1px solid #E5E7EB',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  flexShrink: 0,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid #E5E7EB',
};
