/**
 * V2 Mobile Bottom Sheet — slides up when element is selected on mobile.
 *
 * Uses React portal to escape the V2Editor's stacking context.
 * Inspired by Canva / VistaCreate / Crello mobile editors.
 */

import {useState, useMemo} from 'react';
import {createPortal} from 'react-dom';
import type {PropertyMetadata} from '@vary/v2/registry/elements';
import {getElement} from '@vary/v2/registry/elements';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';

type Tab = 'properties' | 'layers';

const SHEET_Z = 11000;
const BACKDROP_Z = 10999;

export default function MobileSheet() {
  const sheetOpen = useEditorStore((s) => s.mobileSheetOpen);
  const closeSheet = useEditorStore((s) => s.closeMobileSheet);
  const [tab, setTab] = useState<Tab>('properties');

  if (!sheetOpen) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div onClick={closeSheet} style={{
        position: 'fixed', inset: 0, zIndex: BACKDROP_Z,
        background: 'rgba(0,0,0,0.35)',
        WebkitTapHighlightColor: 'transparent',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: SHEET_Z,
        maxHeight: '75vh',
        background: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        animation: 'mobilesheet-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Drag handle */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '14px 0 8px', flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 5, borderRadius: 3,
            background: '#D1D5DB',
          }} />
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 12px', flexShrink: 0,
          gap: 4,
        }}>
          <SheetTab active={tab === 'properties'} onClick={() => setTab('properties')}>
            Properties
          </SheetTab>
          <SheetTab active={tab === 'layers'} onClick={() => setTab('layers')}>
            Layers
          </SheetTab>
          <button onClick={closeSheet} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            fontSize: 22, color: '#9CA3AF', cursor: 'pointer',
            padding: '6px 12px', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Content */}
        <div style={{flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch'}}>
          {tab === 'properties' ? <PropertySheet /> : <LayersSheet />}
        </div>
      </div>

      <style>{`
        @keyframes mobilesheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}

// ─── Tab Button ──────────────────────────────────────────────────

function SheetTab({active, onClick, children}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '12px 18px', background: 'none', border: 'none',
      borderBottom: active ? '3px solid #3B82F6' : '3px solid transparent',
      color: active ? '#1A202C' : '#9CA3AF',
      fontSize: 15, fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

// ─── Property Sheet ──────────────────────────────────────────────

const COLOR_SWATCHES = [
  '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
  '#1A365D', '#2D3748', '#1A202C', '#000000',
  '#3182CE', '#2B6CB0', '#38A169', '#D69E2E',
  '#DD6B20', '#E53E3E', '#9F7AEA', '#ED64A6',
];

function PropertySheet() {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const getElementDoc = useDocumentStore((s) => s.getElement);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const showAdvanced = useEditorStore((s) => s.showAdvanced);

  const element = selectedElementId ? getElementDoc(selectedElementId) ?? null : null;
  const def = element ? getElement(element.type) : null;

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
      <div style={{padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 15}}>
        Tap an element on the canvas to edit it
      </div>
    );
  }

  const {transform} = element;
  const props = element.props as Record<string, unknown>;

  const setProp = (key: string, value: unknown) => {
    const propDef = def.properties.find(p => p.key === key);
    let coerced = value;
    if (propDef?.type === 'select' && propDef.key === 'fontWeight') coerced = Number(value);
    else if (propDef?.type === 'select' && propDef.key === 'textAlign') coerced = String(value);
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
    <div style={{paddingBottom: 24}}>
      {/* Element header */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid #F3F4F6',
      }}>
        <span style={{fontSize: 17, fontWeight: 600, color: '#1A202C'}}>{def.icon} {element.name}</span>
        <span style={{fontSize: 12, color: '#9CA3AF', marginLeft: 'auto'}}>{def.name}</span>
      </div>

      {/* Transform controls */}
      <Section label="Position & Size">
        <Row>
          <LabeledInput label="X" value={Math.round(transform.x * 100)}
            onChange={(v) => setTransform('x', v / 100)} suffix="%" />
          <LabeledInput label="Y" value={Math.round(transform.y * 100)}
            onChange={(v) => setTransform('y', v / 100)} suffix="%" />
        </Row>
        <Row>
          <LabeledInput label="W"
            value={transform.width !== null ? Math.round(transform.width * 100) : null}
            onChange={(v) => setTransform('width', v !== null ? v / 100 : null)}
            suffix="%" nullable />
          <LabeledInput label="H"
            value={transform.height !== null ? Math.round(transform.height * 100) : null}
            onChange={(v) => setTransform('height', v !== null ? v / 100 : null)}
            suffix="%" nullable />
        </Row>
        <Row>
          <LabeledInput label="Rotate" value={Math.round(transform.rotation)}
            onChange={(v) => setTransform('rotation', v)} suffix="°" />
          <LabeledInput label="Layer" value={transform.zIndex}
            onChange={(v) => setTransform('zIndex', v)} />
        </Row>
        <LabeledInput label="Opacity" value={Math.round(transform.opacity * 100)}
          onChange={(v) => setTransform('opacity', v / 100)} suffix="%" />
      </Section>

      {/* Property groups */}
      {Array.from(groups.entries()).map(([groupName, properties]) => (
        <Section key={groupName} label={groupName}>
          {properties.map((prop) => {
            const value = props[prop.key];
            return (
              <div key={prop.key}>
                {prop.type === 'text' && (
                  <LabeledInput textInput label={prop.label} value={value as string ?? ''}
                    onChange={(v) => setProp(prop.key, v)} />
                )}
                {prop.type === 'number' && (
                  <LabeledInput label={prop.label} value={value as number ?? 0}
                    onChange={(v) => setProp(prop.key, v)} suffix={prop.unit} />
                )}
                {prop.type === 'slider' && (
                  <div style={{marginBottom: 4}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
                      <label style={{fontSize: 13, fontWeight: 500, color: '#6B7280'}}>{prop.label}</label>
                      <span style={{fontSize: 13, color: '#9CA3AF'}}>{value as number ?? 0}{prop.unit ?? ''}</span>
                    </div>
                    <input type="range" min={prop.min ?? 0} max={prop.max ?? 100} step={prop.step ?? 1}
                      value={value as number ?? 0}
                      onChange={(e) => setProp(prop.key, Number(e.target.value))}
                      style={{width: '100%', height: 6, cursor: 'pointer', accentColor: '#3B82F6'}} />
                  </div>
                )}
                {prop.type === 'color' && (
                  <div style={{marginBottom: 4}}>
                    <label style={{fontSize: 13, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 8}}>{prop.label}</label>
                    <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                      {COLOR_SWATCHES.map((color) => (
                        <button key={color} onClick={() => setProp(prop.key, color)} style={{
                          width: 30, height: 30, borderRadius: 6,
                          border: value === color ? '3px solid #3B82F6' : '1px solid #E5E7EB',
                          background: color, cursor: 'pointer', padding: 0,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                {prop.type === 'select' && (
                  <div style={{marginBottom: 4}}>
                    <label style={{fontSize: 13, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 6}}>{prop.label}</label>
                    <select value={value as string ?? ''} onChange={(e) => setProp(prop.key, e.target.value)}
                      style={{width: '100%', padding: '10px 14px', fontSize: 15,
                        border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff',
                        boxSizing: 'border-box', WebkitAppearance: 'none'}}>
                      {prop.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                {prop.type === 'boolean' && (
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 15, color: '#374151', cursor: 'pointer',
                    padding: '6px 0',
                  }}>
                    <input
                      type="checkbox" checked={value as boolean ?? false}
                      onChange={(e) => setProp(prop.key, e.target.checked)}
                      style={{width: 22, height: 22, accentColor: '#3B82F6'}} />
                    {prop.label}
                  </label>
                )}
              </div>
            );
          })}
        </Section>
      ))}

      <div style={{padding: '12px 20px', fontSize: 11, color: '#9CA3AF'}}>
        ID: {element.id} · {element.type}
        {element.locked && ' · 🔒 Locked'}
        {!element.visible && ' · Hidden'}
      </div>
    </div>
  );
}

// ─── Layers Sheet ─────────────────────────────────────────────────

function LayersSheet() {
  const elements = useDocumentStore((s) => s.getElements());
  const dispatch = useDocumentStore((s) => s.dispatch);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);

  const sorted = [...elements].sort((a, b) => a.transform.zIndex - b.transform.zIndex);

  if (sorted.length === 0) {
    return (
      <div style={{padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 15}}>
        No elements yet. Tap + to add one.
      </div>
    );
  }

  return (
    <div style={{paddingBottom: 24}}>
      {sorted.map((el) => {
        const icon = el.type === 'text' ? 'T' : el.type === 'image' ? '🖼' : '◻';
        const isSelected = el.id === selectedElementId;
        return (
          <div key={el.id} onClick={() => selectElement(el.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', cursor: 'pointer',
            background: isSelected ? '#EFF6FF' : 'transparent',
            opacity: el.visible ? 1 : 0.4,
            borderLeft: isSelected ? '3px solid #3B82F6' : '3px solid transparent',
            borderBottom: '1px solid #F3F4F6',
          }}>
            <span style={{fontWeight: 700, fontSize: 14, color: '#6B7280', width: 24, textAlign: 'center'}}>
              {icon}
            </span>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 15, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {el.name}
              </div>
              <div style={{fontSize: 11, color: '#9CA3AF'}}>{el.type} · z{el.transform.zIndex}</div>
            </div>
            <button onClick={(e) => {e.stopPropagation(); dispatch({type: 'SET_VISIBLE', elementId: el.id, visible: !el.visible});}}
              style={iconBtnStyle}>{el.visible ? '👁' : '—'}</button>
            <button onClick={(e) => {e.stopPropagation(); dispatch({type: 'SET_LOCKED', elementId: el.id, locked: !el.locked});}}
              style={{...iconBtnStyle, color: el.locked ? '#E53E3E' : '#D1D5DB'}}>{el.locked ? '🔒' : '🔓'}</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────

function Section({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div style={{
      padding: '14px 20px', borderBottom: '1px solid #E5E7EB',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{label}</div>
      {children}
    </div>
  );
}

function Row({children}: {children: React.ReactNode}) {
  return <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>{children}</div>;
}

function LabeledInput({label, value, onChange, suffix, nullable, textInput}: {
  label: string; value: string | number | null;
  onChange: (value: any) => void; suffix?: string;
  nullable?: boolean; textInput?: boolean;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 3}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontSize: 12, fontWeight: 500, color: '#9CA3AF'}}>{label}</span>
        {nullable && (
          <button onClick={() => onChange(value === null ? 0 : null)} style={{
            fontSize: 11, background: 'none', border: 'none', cursor: 'pointer',
            color: value === null ? '#3B82F6' : '#9CA3AF', padding: 0,
          }}>
            {value === null ? 'set' : 'auto'}
          </button>
        )}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
        {textInput ? (
          <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
            style={inputStyle} />
        ) : (
          <input type="number" value={value ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? (nullable ? null : 0) : Number(e.target.value);
              onChange(v);
            }}
            placeholder={nullable ? 'auto' : undefined}
            style={inputStyle} />
        )}
        {suffix && <span style={{fontSize: 13, color: '#9CA3AF', minWidth: 20}}>{suffix}</span>}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 15,
  border: '1px solid #E5E7EB', borderRadius: 8,
  boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums',
  background: '#F9FAFB',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 16, padding: '6px 10px', borderRadius: 6, color: '#6B7280',
};
