/**
 * V2 Properties Panel — schema-driven right sidebar.
 *
 * Reads the selected element from editor store, element definition
 * from the registry, and dispatches property mutations to the document store.
 *
 * Mobile-first: panel slides in as overlay on small screens.
 */

import {useMemo, useState} from 'react';
import type {V2Element, MergeTag} from '@vary/v2/schema/document';
import type {PropertyMetadata} from '@vary/v2/registry/elements';
import {getElement} from '@vary/v2/registry/elements';
import {useDocumentStore} from '../../stores/documentStore';
import {useEditorStore} from '../../stores/editorStore';
import BindingSheet from './BindingSheet';

const COLOR_SWATCHES = [
  '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
  '#1A365D', '#2D3748', '#1A202C', '#000000',
  '#3182CE', '#2B6CB0', '#38A169', '#D69E2E',
  '#DD6B20', '#E53E3E', '#9F7AEA', '#ED64A6',
];

// ─── Merge Tag Helpers ─────────────────────────────────────────────

/** Extract {{tagKey}} patterns from a string. Returns unique tags in order of first appearance. */
function extractMergeTags(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const matches = value.match(/\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

/** Build a tag index from the document's mergeTags for fast lookup. */
function buildTagMap(tags: MergeTag[]): Map<string, MergeTag> {
  const map = new Map<string, MergeTag>();
  for (const t of tags) {
    map.set(t.key, t);
  }
  return map;
}

function MergeTagPreview({tags, tagMap}: {tags: string[]; tagMap: Map<string, MergeTag>}) {
  return (
    <div style={{
      marginTop: 6, padding: '6px 10px', borderRadius: 6,
      background: '#F8FAFC', border: '1px solid #E2E8F0',
      fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{color: '#9CA3AF', fontWeight: 500, fontSize: 10, marginBottom: 2}}>MERGE TAGS</div>
      {tags.map((tagKey) => {
        const def = tagMap.get(tagKey);
        const label = def?.label ?? tagKey;
        const defaultValue = def?.defaultValue ?? '';
        return (
          <div key={tagKey} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: 'space-between',
          }}>
            <code style={{
              fontSize: 11, background: '#E2E8F0', padding: '1px 6px',
              borderRadius: 3, color: '#1A365D', fontWeight: 600,
            }}>{`{{${tagKey}}}`}</code>
            <span style={{color: '#6B7280', fontSize: 11, fontStyle: 'italic'}}>
              {label}{defaultValue ? ` → "${defaultValue}"` : ' (no preview)'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function PropertiesPanel() {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const getElementDoc = useDocumentStore((s) => s.getElement);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const showAdvanced = useEditorStore((s) => s.showAdvanced);
  const mergeTags = useDocumentStore((s) => s.document.mergeTags);

  const [bindingSheetProp, setBindingSheetProp] = useState<{
    key: string;
    label: string;
    type: string;
  } | null>(null);

  const element = selectedElementId ? getElementDoc(selectedElementId) ?? null : null;

  // ALL hooks before early return
  const def = element ? getElement(element.type) : null;
  const tagMap = useMemo(() => buildTagMap(mergeTags), [mergeTags]);
  const groups = useMemo(() => {
    if (!def) return new Map<string, PropertyMetadata[]>();
    const map = new Map<string, PropertyMetadata[]>();
    for (const prop of def.properties) {
      if (!showAdvanced && prop.advanced) continue;
      const group = prop.group ?? 'General';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(prop);
    }
    return map;
  }, [def, showAdvanced]);

  if (!element || !def) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span style={{fontSize: 13, fontWeight: 600, color: '#9CA3AF'}}>Properties</span>
        </div>
        <div style={{padding: 16, textAlign: 'center', color: '#6B7280', fontSize: 13}}>
          Select an element to edit
        </div>
      </div>
    );
  }

  const {transform} = element;
  const props = element.props as Record<string, unknown>;

  const setProp = (key: string, value: unknown) => {
    // Coerce select values to proper types based on property metadata
    const propDef = def.properties.find(p => p.key === key);
    let coerced = value;
    if (propDef?.type === 'select' && propDef.key === 'fontWeight') {
      coerced = Number(value);
    } else if (propDef?.type === 'select' && propDef.key === 'textAlign') {
      coerced = String(value);
    }
    dispatch({type: 'SET_ELEMENT_PROP', elementId: element.id, key, value: coerced});
  };

  const setTransform = (field: string, value: number | null) => {
    if (field === 'x' || field === 'y') {
      dispatch({type: 'SET_POSITION', elementId: element.id, [field]: value} as any);
    } else if (field === 'width' || field === 'height') {
      dispatch({type: 'SET_SIZE', elementId: element.id, [field]: value} as any);
    } else if (field === 'rotation') {
      dispatch({type: 'SET_ROTATION', elementId: element.id, rotation: value as number});
    } else {
      setProp(field, value);
    }
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <span style={{fontSize: 13, fontWeight: 600, color: '#374151'}}>
            {def.icon} {element.name}
          </span>
          <span style={{fontSize: 11, color: '#9CA3AF', marginLeft: 8}}>{def.name}</span>
        </div>
        <button onClick={() => selectElement(null)} style={closeBtn}>×</button>
      </div>

      {/* Transform controls */}
      <div style={{padding: '12px 16px', borderBottom: '1px solid #E5E7EB'}}>
        <div style={{fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8}}>Position</div>
        <div style={grid2}>
          <LabeledInput label="X" value={Math.round(transform.x * 100)}
            onChange={(v) => setTransform('x', v / 100)} suffix="%" min={0} max={100} />
          <LabeledInput label="Y" value={Math.round(transform.y * 100)}
            onChange={(v) => setTransform('y', v / 100)} suffix="%" min={0} max={100} />
        </div>
        <div style={{...grid2, marginTop: 8}}>
          <LabeledInput label="Width"
            value={transform.width !== null ? Math.round(transform.width * 100) : null}
            onChange={(v) => setTransform('width', v !== null ? v / 100 : null)}
            suffix="%" min={0} max={100} nullable />
          <LabeledInput label="Height"
            value={transform.height !== null ? Math.round(transform.height * 100) : null}
            onChange={(v) => setTransform('height', v !== null ? v / 100 : null)}
            suffix="%" min={0} max={100} nullable />
        </div>
        <div style={{...grid2, marginTop: 8}}>
          <LabeledInput label="Rotation" value={Math.round(transform.rotation)}
            onChange={(v) => setTransform('rotation', v)} suffix="°" min={-360} max={360} />
          <LabeledInput label="Z-Index" value={transform.zIndex}
            onChange={(v) => setTransform('zIndex', v)} min={0} max={1000} />
        </div>
        <div style={{marginTop: 8}}>
          <LabeledInput label="Opacity" value={Math.round(transform.opacity * 100)}
            onChange={(v) => setTransform('opacity', v / 100)} suffix="%" min={0} max={100} />
        </div>
      </div>

      {/* Property groups */}
      {Array.from(groups.entries()).map(([groupName, properties]) => (
        <div key={groupName} style={{padding: '12px 16px', borderBottom: '1px solid #E5E7EB'}}>
          <div style={{fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8}}>{groupName}</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {properties.map((prop) => {
              const value = props[prop.key];
              return (
                <div key={prop.key}>
                  {prop.type === 'text' && (<>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: 4}}>
                      <div style={{flex: 1}}>
                        <LabeledInput textInput label={prop.label} value={value as string ?? ''}
                          onChange={(v) => setProp(prop.key, v)} />
                      </div>
                      {prop.supportsMergeTags && (
                        <button
                          onClick={() => setBindingSheetProp({
                            key: prop.key,
                            label: prop.label,
                            type: 'text',
                          })}
                          title="Bind to merge tag"
                          style={{
                            background: 'none', border: '1px solid #E5E7EB',
                            borderRadius: 4, cursor: 'pointer',
                            padding: '2px 6px', fontSize: 14, marginTop: 16,
                            color: '#6B7280', flexShrink: 0,
                          }}
                        >{`{x}`}</button>
                      )}
                    </div>
                    {prop.supportsMergeTags && mergeTags.length > 0 && (() => {
                      const extracted = extractMergeTags(value);
                      return extracted.length > 0 ? <MergeTagPreview tags={extracted} tagMap={tagMap} /> : null;
                    })()}
                  </>)}
                  {prop.type === 'number' && (
                    <LabeledInput label={prop.label} value={value as number ?? 0}
                      onChange={(v) => setProp(prop.key, v)} min={prop.min} max={prop.max} suffix={prop.unit} />
                  )}
                  {prop.type === 'slider' && (
                    <div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                        <label style={{fontSize: 11, color: '#6B7280'}}>{prop.label}</label>
                        <span style={{fontSize: 11, color: '#9CA3AF'}}>{value as number ?? 0}{prop.unit ?? ''}</span>
                      </div>
                      <input type="range" min={prop.min ?? 0} max={prop.max ?? 100} step={prop.step ?? 1}
                        value={value as number ?? 0}
                        onChange={(e) => setProp(prop.key, Number(e.target.value))}
                        style={{width: '100%', height: 4, cursor: 'pointer'}} />
                    </div>
                  )}
                  {prop.type === 'color' && (<>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: 4}}>
                      <div style={{flex: 1}}>
                        <div>
                          <label style={{fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4}}>{prop.label}</label>
                          <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>
                            {COLOR_SWATCHES.map((color) => (
                              <button key={color} onClick={() => setProp(prop.key, color)} style={{
                                width: 20, height: 20, borderRadius: 4,
                                border: value === color ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                                background: color, cursor: 'pointer', padding: 0,
                              }} />
                            ))}
                          </div>
                          <input type="text" value={value as string ?? ''}
                            onChange={(e) => setProp(prop.key, e.target.value)}
                            style={{width: '100%', marginTop: 4, padding: '3px 6px', fontSize: 11,
                              border: '1px solid #E5E7EB', borderRadius: 4, fontFamily: 'monospace', boxSizing: 'border-box'}} />
                        </div>
                      </div>
                      {prop.supportsMergeTags && (
                        <button
                          onClick={() => setBindingSheetProp({
                            key: prop.key,
                            label: prop.label,
                            type: 'color',
                          })}
                          title="Bind to merge tag"
                          style={{
                            background: 'none', border: '1px solid #E5E7EB',
                            borderRadius: 4, cursor: 'pointer',
                            padding: '2px 6px', fontSize: 14, marginTop: 16,
                            color: '#6B7280', flexShrink: 0,
                          }}
                        >{`{x}`}</button>
                      )}
                    </div>
                    {prop.supportsMergeTags && mergeTags.length > 0 && (() => {
                      const extracted = extractMergeTags(value);
                      return extracted.length > 0 ? <MergeTagPreview tags={extracted} tagMap={tagMap} /> : null;
                    })()}
                  </>)}
                  {prop.type === 'select' && (
                    <div>
                      <label style={{fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4}}>{prop.label}</label>
                      <select value={value as string ?? ''} onChange={(e) => setProp(prop.key, e.target.value)}
                        style={{width: '100%', padding: '4px 8px', fontSize: 12,
                          border: '1px solid #E5E7EB', borderRadius: 4, background: '#fff', boxSizing: 'border-box'}}>
                        {prop.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {prop.type === 'boolean' && (
                    <label style={{display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 12, color: '#374151', cursor: 'pointer'}}>
                      <input type="checkbox" checked={value as boolean ?? false}
                        onChange={(e) => setProp(prop.key, e.target.checked)} />
                      {prop.label}
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{padding: '12px 16px', fontSize: 10, color: '#9CA3AF'}}>
        ID: {element.id} · Type: {element.type}
        {element.locked && ' · Locked'}
        {!element.visible && ' · Hidden'}
      </div>

      {/* Binding Sheet overlay */}
      {bindingSheetProp && (
        <BindingSheet
          propertyKey={bindingSheetProp.key}
          propertyLabel={bindingSheetProp.label}
          propertyType={bindingSheetProp.type}
          currentValue={props[bindingSheetProp.key]}
          mergeTags={mergeTags}
          onCommit={(key, value) => {
            setProp(key, value);
          }}
          onClose={() => setBindingSheetProp(null)}
        />
      )}
    </div>
  );
}

// ─── Labeled Input ─────────────────────────────────────────────────

function LabeledInput({label, value, onChange, suffix, min, max, nullable, textInput}: {
  label: string;
  value: string | number | null;
  onChange: (value: any) => void;
  suffix?: string;
  min?: number;
  max?: number;
  nullable?: boolean;
  textInput?: boolean;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <label style={{fontSize: 10, fontWeight: 500, color: '#9CA3AF'}}>{label}</label>
        {nullable && (
          <button onClick={() => onChange(value === null ? (min ?? 0) : null)}
            style={{fontSize: 9, background: 'none', border: 'none', cursor: 'pointer',
              color: value === null ? '#3B82F6' : '#9CA3AF', padding: 0}}>
            {value === null ? 'set' : 'auto'}
          </button>
        )}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
        {textInput ? (
          <input type="text" value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            style={{width: '100%', padding: '3px 6px', fontSize: 11,
              border: '1px solid #E5E7EB', borderRadius: 4, boxSizing: 'border-box'}} />
        ) : (
          <input type="number" value={value ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? (nullable ? null : 0) : Number(e.target.value);
              if (v !== null && min !== undefined && v < min) return;
              if (v !== null && max !== undefined && v > max) return;
              onChange(v);
            }}
            placeholder={nullable ? 'auto' : undefined}
            style={{width: '100%', padding: '3px 6px', fontSize: 11,
              border: '1px solid #E5E7EB', borderRadius: 4, boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums'}}
            min={min} max={max} />
        )}
        {suffix && <span style={{fontSize: 10, color: '#9CA3AF', minWidth: 16}}>{suffix}</span>}
      </div>
    </div>
  );
}

const grid2: React.CSSProperties = {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8};
const panelStyle: React.CSSProperties = {
  width: 260, background: '#fff', borderLeft: '1px solid #E5E7EB',
  display: 'flex', flexDirection: 'column', overflow: 'auto', flexShrink: 0,
};
const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 16px', borderBottom: '1px solid #E5E7EB',
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, color: '#9CA3AF', padding: 0,
};
