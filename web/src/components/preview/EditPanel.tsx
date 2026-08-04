/**
 * EditPanel — enhanced per-element editing panel for the Remotion Player.
 *
 * Shows controls for each content field in the active block:
 * - Text input
 * - Font size slider (12–120px)
 * - Color picker (hex input + preset swatches)
 * - Position X/Y sliders (0–100%)
 * - Entry/exit animation dropdowns
 * - Animation duration slider
 */
import {useState, useCallback} from 'react';
import type {ElementLayout} from '@vary/shared/capabilities/types';
import type {ComposerBlock} from '../../utils/blocks';
import {blockCapabilities} from '@vary/shared/capabilities/blocks';
import {animationPresetCapabilities} from '@vary/shared/capabilities/animations';
import {resolvePlaceholders} from '../../utils/placeholder';

// ─── Types ──────────────────────────────────────────────────────────

type EditPanelProps = {
  block: ComposerBlock;
  variant: Record<string, string>;
  onContentChange: (fieldKey: string, value: string) => void;
  onLayoutChange: (fieldKey: string, layout: ElementLayout) => void;
  selectedFieldKey?: string | null;
  onSelectField?: (fieldKey: string | null) => void;
};

// ─── Color presets ──────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#1A365D', '#2D3748', '#1A202C', '#2B6CB0', '#3182CE',
  '#38A169', '#D69E2E', '#DD6B20', '#E53E3E', '#9F7AEA',
  '#ED64A6', '#FFFFFF', '#F7FAFC', '#EDF2F7', '#000000',
];

// ─── Sub-components ─────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <label style={{fontSize: 11, fontWeight: 500, color: '#6B7280'}}>{label}</label>
        <span style={{fontSize: 11, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums'}}>
          {value}{unit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{width: '100%', height: 4, cursor: 'pointer'}}
      />
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      <label style={{fontSize: 11, fontWeight: 500, color: '#6B7280'}}>Color</label>
      <div style={{display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center'}}>
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
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
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          style={{
            width: 72,
            padding: '2px 6px',
            fontSize: 11,
            border: '1px solid #E5E7EB',
            borderRadius: 4,
            fontFamily: 'monospace',
          }}
        />
      </div>
    </div>
  );
}

function AnimationSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  const presets = animationPresetCapabilities.filter((p) =>
    label === 'Entry' ? p.direction !== 'out' : p.direction !== 'in',
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
      <label style={{fontSize: 11, fontWeight: 500, color: '#6B7280'}}>{label} Animation</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        <option value="">None</option>
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Field section ──────────────────────────────────────────────────

function FieldSection({
  fieldKey,
  label,
  rawValue,
  displayValue,
  layout,
  isSelected,
  onContentChange,
  onLayoutChange,
  onSelect,
}: {
  fieldKey: string;
  label: string;
  rawValue: string;
  displayValue: string;
  layout: ElementLayout | undefined;
  isSelected: boolean;
  onContentChange: (value: string) => void;
  onLayoutChange: (layout: ElementLayout) => void;
  onSelect: () => void;
}) {
  const x = layout?.x ?? 50;
  const y = layout?.y ?? 50;
  const fontSize = layout?.fontSize ?? 86;
  const color = layout?.color ?? '#1A365D';
  const entryPreset = layout?.animation?.entry?.presetId;
  const exitPreset = layout?.animation?.exit?.presetId;
  const animDuration = layout?.animation?.entry?.durationFrames ?? 20;

  const updateLayout = useCallback(
    (patch: Partial<ElementLayout>) => {
      const prev = layout ?? {x: 50, y: 50};
      onLayoutChange({
        ...prev,
        ...patch,
      });
    },
    [layout, onLayoutChange],
  );

  const updateAnimation = useCallback(
    (type: 'entry' | 'exit', presetId: string | undefined) => {
      const prev = layout ?? {x: 50, y: 50};
      const currentAnim = layout?.animation ?? {};
      const newAnim = {
        ...currentAnim,
        [type]: presetId
          ? {presetId, durationFrames: animDuration}
          : undefined,
      };
      // Clean up undefined entries
      if (!newAnim.entry && !newAnim.exit) {
        onLayoutChange({...prev, animation: undefined});
      } else {
        onLayoutChange({...prev, animation: newAnim});
      }
    },
    [layout, animDuration, onLayoutChange],
  );

  return (
    <div
      data-field-key={fieldKey}
      style={{
        background: isSelected ? '#F0F9FF' : '#F9FAFB',
        borderRadius: 10,
        padding: 12,
        border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onClick={onSelect}
    >
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between, marginBottom: isSelected ? 10 : 0'}}>
        <span style={{fontSize: 12, fontWeight: 600, color: '#374151'}}>
          {label}
        </span>
        <span style={{fontSize: 10, color: '#9CA3AF'}}>{fieldKey}</span>
      </div>

      {/* Always show text input */}
      <input
        type="text"
        value={displayValue}
        onChange={(e) => onContentChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #E5E7EB',
          fontSize: 13,
          outline: 'none',
          boxSizing: 'border-box',
          marginTop: 6,
        }}
      />

      {/* Expanded controls */}
      {isSelected && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
            <Slider
              label="Position X"
              value={x}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => updateLayout({x: v})}
            />
            <Slider
              label="Position Y"
              value={y}
              min={0}
              max={100}
              unit="%"
              onChange={(v) => updateLayout({y: v})}
            />
          </div>

          <Slider
            label="Font Size"
            value={fontSize}
            min={12}
            max={120}
            unit="px"
            onChange={(v) => updateLayout({fontSize: v})}
          />

          <ColorPicker
            value={color}
            onChange={(v) => updateLayout({color: v})}
          />

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
            <AnimationSelect
              label="Entry"
              value={entryPreset}
              onChange={(v) => updateAnimation('entry', v)}
            />
            <AnimationSelect
              label="Exit"
              value={exitPreset}
              onChange={(v) => updateAnimation('exit', v)}
            />
          </div>

          {(entryPreset || exitPreset) && (
            <Slider
              label="Animation Duration"
              value={animDuration}
              min={6}
              max={60}
              unit=" frames"
              onChange={(v) => {
                const prev = layout ?? {x: 50, y: 50};
                const anim = layout?.animation ?? {};
                onLayoutChange({
                  ...prev,
                  animation: {
                    ...(anim.entry ? {...anim.entry, durationFrames: v} : undefined),
                    ...(anim.exit ? {...anim.exit, durationFrames: v} : undefined),
                    ...anim,
                    entry: anim.entry ? {...anim.entry, durationFrames: v} : undefined,
                    exit: anim.exit ? {...anim.exit, durationFrames: v} : undefined,
                  },
                });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────

export default function EditPanel({
  block,
  variant,
  onContentChange,
  onLayoutChange,
  selectedFieldKey,
  onSelectField,
}: EditPanelProps) {
  const definition = blockCapabilities.find((c) => c.id === block.blockId);
  if (!definition) return null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 16,
        border: '1px solid #E5E7EB',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <span style={{fontSize: 13, fontWeight: 600, color: '#374151'}}>
          ✏️ Edit — {definition.name}
        </span>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {definition.contentFields.map((field) => {
          const rawValue = block.content[field.key] ?? field.placeholder ?? '';
          const displayValue = resolvePlaceholders(rawValue, variant);
          return (
            <FieldSection
              key={field.key}
              fieldKey={field.key}
              label={field.label}
              rawValue={rawValue}
              displayValue={displayValue}
              layout={block.layout?.[field.key]}
              isSelected={selectedFieldKey === field.key}
              onContentChange={(val) => onContentChange(field.key, val)}
              onLayoutChange={(layout) => onLayoutChange(field.key, layout)}
              onSelect={() =>
                onSelectField?.(selectedFieldKey === field.key ? null : field.key)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
