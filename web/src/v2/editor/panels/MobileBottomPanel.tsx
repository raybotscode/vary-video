/**
 * V2 Mobile Bottom Panel — context-sensitive property editor for mobile.
 *
 * When NO element is selected: shows the home toolbar with large icon+label
 *   buttons for Templates, Photos, Videos, Text, Objects, Background, Music,
 *   Data, Scenes.
 * When text is selected: shows Content | Font | Style | Spacing | Effects |
 *   Color | Lock | Order tabs.
 * When image is selected: shows Effects | Color | Lock | Order tabs.
 * When shape is selected: shows Color | Lock | Order tabs.
 *
 * Fixed height panel at the bottom — stage remains fully visible above.
 */

import {useState, useMemo, useCallback} from 'react';
import {getElement} from '@vary/v2/registry/elements';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {useMergeDataStore} from '../../stores/mergeDataStore';
import {serializeBindableText, parseBindableText} from '@vary/v2/schema/bindable';
import BindingSheet from './BindingSheet';

type Tab = 'add' | 'content' | 'font' | 'style' | 'spacing' | 'effects' | 'color' | 'transparency' | 'lock' | 'order' | 'animate' | 'image' | 'shape';

const PANEL_HEIGHT = 320;

export default function MobileBottomPanel() {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const getElementDoc = useDocumentStore((s) => s.getElement);
  const element = selectedElementId ? getElementDoc(selectedElementId) ?? null : null;

  const [tab, setTab] = useState<Tab>('add');

  // Merge data row navigation
  const previewRowIndex = useMergeDataStore((s) => s.previewRowIndex);
  const mergeRows = useMergeDataStore((s) => s.rows);
  const setPreviewRow = useMergeDataStore((s) => s.setPreviewRow);
  const showMergeData = useEditorStore((s) => s.showMergeData);
  const toggleShowMergeData = useEditorStore((s) => s.toggleShowMergeData);
  const hasDataLoaded = mergeRows.length > 0;

  // Auto-switch tab when selection changes
  useMemo(() => {
    if (!element) { setTab('add'); return; }
    const current = tab;
    const tabs = getTabs(element.type);
    if (!tabs.includes(current)) {
      setTab(tabs[0]);
    }
  }, [element?.id, element?.type]);

  const tabs = element ? getTabs(element.type) : ['add' as Tab];

  return (
    <div style={{
      maxHeight: '45vh',
      minHeight: 260,
      background: '#1A202C',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderTop: '1px solid #2D3748',
    }}>
      {/* ── Data row navigator (when CSV is loaded) ── */}
      {hasDataLoaded && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px',
          background: '#1E3A5F', borderBottom: '1px solid #2D4A7C',
        }}>
          <button
            onClick={() => {
              const idx = previewRowIndex ?? 0;
              setPreviewRow(idx > 0 ? idx - 1 : mergeRows.length - 1);
            }}
            style={{
              background: 'none', border: 'none', color: '#93C5FD',
              fontSize: 16, cursor: 'pointer', padding: '2px 6px',
            }}
          >◀</button>
          <span style={{
            color: '#93C5FD', fontSize: 11, fontWeight: 600, flex: 1,
            textAlign: 'center',
          }}>
            {previewRowIndex !== null
              ? `Row ${previewRowIndex + 1}/${mergeRows.length}`
              : `${mergeRows.length} rows`}
          </span>
          <button
            onClick={() => {
              const idx = previewRowIndex ?? -1;
              setPreviewRow(idx < mergeRows.length - 1 ? idx + 1 : 0);
            }}
            style={{
              background: 'none', border: 'none', color: '#93C5FD',
              fontSize: 16, cursor: 'pointer', padding: '2px 6px',
            }}
          >▶</button>
          <button
            onClick={toggleShowMergeData}
            title={showMergeData ? 'Hide data preview' : 'Show data preview on canvas'}
            style={{
              background: showMergeData ? '#3B82F6' : '#2D3748',
              border: 'none', borderRadius: 4,
              color: '#fff', fontSize: 10, fontWeight: 600,
              cursor: 'pointer', padding: '3px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            {showMergeData ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
      {/* Tab bar — horizontally scrollable with swipe */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
        borderBottom: '1px solid #2D3748',
        flexShrink: 0,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {tabs.map((t) => (
          <TabBtn key={t} active={tab === t} onClick={() => setTab(t)}>
            {tabLabel(t)}
          </TabBtn>
        ))}
      </div>

      {/* Tab content — iOS requires explicit 'scroll' not 'auto' */}
      <div style={{
        flex: 1, minHeight: 0, overflow: 'scroll',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}>
        {tab === 'add' && <AddPanel />}
        {tab === 'content' && <ContentPanel />}
        {tab === 'font' && <FontPanel />}
        {tab === 'style' && <StylePanel />}
        {tab === 'spacing' && <SpacingPanel />}
        {tab === 'effects' && <EffectsPanel />}
        {tab === 'color' && <ColorPanel />}
        {tab === 'transparency' && <TransparencyPanel />}
        {tab === 'lock' && <LockPanel />}
        {tab === 'order' && <OrderPanel />}
        {tab === 'animate' && <AnimatePanel />}
        {tab === 'image' && <ImagePanel />}
        {tab === 'shape' && <ShapePanel />}
      </div>
    </div>
  );
}

// ─── Tab Helpers ──────────────────────────────────────────────────

function getTabs(type: string): Tab[] {
  switch (type) {
    case 'text': return ['content', 'font', 'style', 'spacing', 'effects', 'color', 'lock', 'order', 'animate'];
    case 'image': return ['image', 'effects', 'color', 'lock', 'order', 'animate'];
    case 'shape': return ['shape', 'color', 'lock', 'order', 'animate'];
    default: return ['add'];
  }
}

function tabLabel(t: Tab): string {
  const map: Record<Tab, string> = {
    add: 'Add', content: 'Content', font: 'Font', style: 'Style',
    spacing: 'Spacing', effects: 'Effects', color: 'Color',
    transparency: 'Opacity', lock: 'Lock', order: 'Order', animate: 'Animate',
    image: 'Image', shape: 'Shape',
  };
  return map[t];
}

function TabBtn({active, onClick, children}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 16px', background: 'none', border: 'none',
      borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent',
      color: active ? '#fff' : '#9CA3AF',
      fontSize: 13, fontWeight: active ? 600 : 400,
      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      transition: 'all 0.15s',
    }}>{children}</button>
  );
}

// ─── Dispatch Helpers ─────────────────────────────────────────────

function useElementProps() {
  const id = useEditorStore((s) => s.selectedElementId);
  const getEl = useDocumentStore((s) => s.getElement);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const el = id ? getEl(id) : null;
  const def = el ? getElement(el.type) : null;

  const setProp = (key: string, value: unknown) => {
    if (!id) return;
    const propDef = def?.properties.find(p => p.key === key);
    let coerced = value;
    if (propDef?.type === 'select' && propDef.key === 'fontWeight') coerced = Number(value);
    else if (propDef?.type === 'select' && propDef.key === 'textAlign') coerced = String(value);
    dispatch({type: 'SET_ELEMENT_PROP', elementId: id, key, value: coerced});
  };

  return {element: el, def, setProp, props: (el?.props ?? {}) as Record<string, unknown>, id, dispatch};
}

// ─── Add Panel (no element selected) — Home Toolbar ───────────────

const HOME_TOOLS: {icon: string; label: string; action?: string}[] = [
  {icon: '📋', label: 'Templates'},
  {icon: '🖼', label: 'Photos', action: 'image'},
  {icon: '🎬', label: 'Videos'},
  {icon: 'T', label: 'Text', action: 'text'},
  {icon: '◻', label: 'Objects', action: 'shape'},
  {icon: '🎨', label: 'Background', action: 'background'},
  {icon: '🎵', label: 'Music', action: 'music'},
  {icon: '📊', label: 'Data', action: 'data'},
  {icon: '🎞', label: 'Scenes'},
];

function AddPanel() {
  const dispatch = useDocumentStore((s) => s.dispatch);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const openGallery = useEditorStore((s) => s.openGallery);

  if (selectedElementId) return null;

  const handleTool = (tool: typeof HOME_TOOLS[number]) => {
    if (tool.action === 'text') {
      dispatch({type: 'ADD_ELEMENT', elementType: 'text'});
    } else if (tool.action === 'image') {
      dispatch({type: 'ADD_ELEMENT', elementType: 'image'});
    } else if (tool.action === 'shape') {
      dispatch({type: 'ADD_ELEMENT', elementType: 'shape'});
    } else {
      openGallery(tool.action ?? tool.label.toLowerCase());
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 16px', gap: 8}}>
      <div style={{color: '#9CA3AF', fontSize: 13, fontWeight: 500, marginBottom: 2}}>Add to scene</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
      }}>
        {HOME_TOOLS.map((tool) => (
          <button
            key={tool.label}
            onClick={() => handleTool(tool)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: '#2D3748',
              border: '1px solid #374151',
              borderRadius: 12,
              padding: '14px 8px',
              cursor: 'pointer',
              minHeight: 72,
              transition: 'background 0.15s',
            }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#374151'; }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2D3748'; }}
          >
            <span style={{fontSize: 26, lineHeight: 1}}>{tool.icon}</span>
            <span style={{color: '#D1D5DB', fontSize: 11, fontWeight: 500, lineHeight: 1}}>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Content Panel (text elements) ─────────────────────────────────

function ContentPanel() {
  const {element, setProp, props, id} = useElementProps();
  const dispatch = useDocumentStore((s) => s.dispatch);
  const mergeTags = useDocumentStore((s) => s.document.mergeTags);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showBindingSheet, setShowBindingSheet] = useState(false);

  if (!element || element.type !== 'text') return null;

  // Support both legacy plain strings and BindableText objects
  const rawContent = props.content;
  const contentStr: string = useMemo(() => {
    if (typeof rawContent === 'string') return rawContent;
    if (
      typeof rawContent === 'object' &&
      rawContent !== null &&
      (rawContent as any)._type === 'bindableText'
    ) {
      return serializeBindableText(rawContent as any);
    }
    return '';
  }, [rawContent]);

  const textAlign = (props.textAlign as string) ?? 'center';
  const verticalAlign = (props.verticalAlign as string) ?? 'middle';

  // Check if content has bound tags
  const hasBoundTags = useMemo(() => {
    return (
      typeof rawContent === 'object' &&
      rawContent !== null &&
      (rawContent as any)._type === 'bindableText' &&
      (rawContent as any).tokens.some((t: any) => t._type === 'tag')
    );
  }, [rawContent]);

  const handleContentChange = (newValue: string) => {
    // Always parse to BindableText if content contains {{tag}} patterns,
    // otherwise the preview resolver won't process inline tags.
    const tagMap = new Map<string, string>();
    for (const tag of mergeTags) {
      tagMap.set(tag.key, tag.id);
    }
    const hasTagPattern = /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/.test(newValue);
    if (hasTagPattern) {
      const parsed = parseBindableText(newValue, tagMap);
      setProp('content', parsed);
    } else if (
      typeof rawContent === 'object' &&
      rawContent !== null &&
      (rawContent as any)._type === 'bindableText'
    ) {
      // Was BindableText but no tags now — re-parse (produces single text token)
      const parsed = parseBindableText(newValue, tagMap);
      setProp('content', parsed);
    } else {
      setProp('content', newValue);
    }
  };

  const insertMergeTag = useCallback((tag: {id: string; key: string}) => {
    const tagStr = `{{${tag.key}}}`;
    const textarea = document.getElementById('mobile-content-textarea') as HTMLTextAreaElement | null;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = contentStr.slice(0, start) + tagStr + contentStr.slice(end);
      handleContentChange(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagStr.length, start + tagStr.length);
      }, 0);
    } else {
      handleContentChange(contentStr + tagStr);
    }
    setShowTagMenu(false);
  }, [contentStr, rawContent, mergeTags]);

  // Build tagMap for parsing
  const handleBindingCommit = (key: string, value: unknown) => {
    setProp(key, value);
    setShowBindingSheet(false);
  };

  return (
    <div style={{padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 12}}>
      {/* Text value */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 6,
        }}>
          <span style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500}}>
            TEXT CONTENT
            <span style={{color: '#636B7A', fontSize: 10, marginLeft: 8}}>
              {mergeTags.length > 0 ? `${mergeTags.length} tags` : 'No merge tags'}
            </span>
          </span>
          <button
            onClick={() => setShowBindingSheet(true)}
            title="Bind to merge tag or create new one"
            style={{
              background: hasBoundTags ? '#1E3A5F' : '#2D3748',
              border: hasBoundTags ? '1px solid #3B82F6' : '1px solid #374151',
              borderRadius: 6, cursor: 'pointer',
              padding: '4px 10px', fontSize: 14,
              color: hasBoundTags ? '#93C5FD' : '#9CA3AF',
              fontWeight: 600,
            }}
          >{`{x}`}</button>
        </div>

        {/* Tag tokens display (if bound) */}
        {hasBoundTags && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4,
            marginBottom: 8, padding: '6px 8px',
            borderRadius: 6, background: '#1A2744',
          }}>
            {(rawContent as any).tokens.map((tok: any, i: number) => {
              if (tok._type === 'tag') {
                const tag = mergeTags.find((t) => t.id === tok.tagId);
                return (
                  <span key={tok.id} style={{
                    background: '#1E3A5F', color: '#93C5FD',
                    padding: '2px 6px', borderRadius: 4,
                    fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
                  }}>
                    {tag ? `{{${tag.key}}}` : `{{unknown}}`}
                  </span>
                );
              }
              return tok.text ? (
                <span key={tok.id} style={{color: '#E2E8F0', fontSize: 11}}>
                  {tok.text.length > 20 ? tok.text.slice(0, 20) + '...' : tok.text}
                </span>
              ) : null;
            })}
          </div>
        )}

        <textarea
          id="mobile-content-textarea"
          value={contentStr}
          onChange={(e) => handleContentChange(e.target.value)}
          rows={2}
          style={{
            width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 8,
            border: '1px solid #374151', background: '#2D3748', color: '#E2E8F0',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Merge tag insertion */}
      {mergeTags.length > 0 && (
        <div style={{position: 'relative'}}>
          <button
            onClick={() => setShowTagMenu(!showTagMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: '#2D3748', border: '1px solid #374151',
              color: '#93C5FD', fontSize: 13, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <span style={{fontSize: 16}}>{'{ }'}</span>
            Insert Merge Tag
          </button>
          {showTagMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, zIndex: 20,
              marginTop: 4, background: '#1A202C', border: '1px solid #374151',
              borderRadius: 8, overflow: 'hidden',
              minWidth: 200, maxHeight: 200, overflowY: 'auto',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {mergeTags.map((tag) => (
                <button
                  key={tag.id ?? tag.key}
                  onClick={() => insertMergeTag({id: tag.id, key: tag.key})}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', border: 'none',
                    background: 'transparent', color: '#E2E8F0',
                    fontSize: 13, cursor: 'pointer',
                    borderBottom: '1px solid #2D3748',
                  }}
                  onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2D3748'; }}
                  onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{fontWeight: 500}}>{`{{${tag.key}}}`}</div>
                  <div style={{fontSize: 11, color: '#9CA3AF', marginTop: 2}}>
                    {tag.label} · {tag.type}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alignment */}
      <div>
        <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 6}}>ALIGNMENT</div>
        <div style={{display: 'flex', gap: 6}}>
          {([
            {value: 'left', icon: '⟵', label: 'Left'},
            {value: 'center', icon: '⬌', label: 'Center'},
            {value: 'right', icon: '⟶', label: 'Right'},
          ] as const).map(({value, icon, label}) => (
            <button
              key={value}
              onClick={() => setProp('textAlign', value)}
              title={label}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: textAlign === value ? '#3B82F6' : '#2D3748',
                color: textAlign === value ? '#fff' : '#9CA3AF',
                fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 0,
              }}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* Vertical alignment */}
      <div>
        <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 6}}>VERTICAL</div>
        <div style={{display: 'flex', gap: 6}}>
          {([
            {value: 'top', icon: '⏫', label: 'Top'},
            {value: 'middle', icon: '⏺', label: 'Middle'},
            {value: 'bottom', icon: '⏬', label: 'Bottom'},
          ] as const).map(({value, icon, label}) => (
            <button
              key={value}
              onClick={() => setProp('verticalAlign', value)}
              title={label}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: verticalAlign === value ? '#3B82F6' : '#2D3748',
                color: verticalAlign === value ? '#fff' : '#9CA3AF',
                fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 0,
              }}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* Binding Sheet */}
      {showBindingSheet && (
        <BindingSheet
          propertyKey="content"
          propertyLabel="Content"
          propertyType="text"
          currentValue={rawContent}
          mergeTags={mergeTags}
          onCommit={handleBindingCommit}
          onClose={() => setShowBindingSheet(false)}
        />
      )}
    </div>
  );
}

// ─── Font Panel ───────────────────────────────────────────────────

function FontPanel() {
  const {element, def, setProp, props, id} = useElementProps();
  if (!element) return null;

  const fontFamily = (props.fontFamily as string) ?? 'Inter';
  const fontSize = (props.fontSize as number) ?? 48;
  const fontWeight = (props.fontWeight as number) ?? 400;

  const fontProp = def?.properties.find(p => p.key === 'fontFamily');
  const weightProp = def?.properties.find(p => p.key === 'fontWeight');
  const fonts = fontProp?.options ?? [];
  const weights = weightProp?.options ?? [];

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 8}}>FONT FAMILY</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
        {fonts.map((f: any) => (
          <button key={f.value} onClick={() => setProp('fontFamily', f.value)} style={{
            padding: '8px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: fontFamily === f.value ? '#3B82F6' : 'transparent',
            color: fontFamily === f.value ? '#fff' : '#D1D5DB',
            fontSize: 14, textAlign: 'left', fontFamily: f.value,
          }}>{f.label}</button>
        ))}
      </div>
      <div style={{marginTop: 16}}>
        <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 6}}>WEIGHT</div>
        <div style={{display: 'flex', gap: 8}}>
          {weights.map((w: any) => (
            <button key={w.value} onClick={() => setProp('fontWeight', w.value)} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: fontWeight === Number(w.value) ? '#3B82F6' : '#2D3748',
              color: fontWeight === Number(w.value) ? '#fff' : '#D1D5DB',
              fontSize: 14, fontWeight: Number(w.value),
            }}>{w.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Style Panel ──────────────────────────────────────────────────

function StylePanel() {
  const {element, setProp, props, id} = useElementProps();
  if (!element) return null;

  const fontSize = (props.fontSize as number) ?? 48;
  const textAlign = (props.textAlign as string) ?? 'left';
  const fontStyle = (props.fontStyle as string) ?? 'normal';
  const textTransform = (props.textTransform as string) ?? 'none';

  const def = element ? getElement(element.type) : null;
  const alignOptions = def?.properties.find(p => p.key === 'textAlign')?.options ?? [];

  return (
    <div style={{padding: '12px 20px'}}>
      {/* Font size slider */}
      <div style={{marginBottom: 16}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
          <span style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500}}>SIZE</span>
          <span style={{color: '#fff', fontSize: 18, fontWeight: 600}}>{fontSize}</span>
        </div>
        <input type="range" min={8} max={200} value={fontSize}
          onChange={(e) => setProp('fontSize', Number(e.target.value))}
          style={{width: '100%', height: 6, accentColor: '#3B82F6', cursor: 'pointer'}} />
      </div>

      {/* Alignment */}
      <div style={{marginBottom: 16}}>
        <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 8}}>ALIGNMENT</div>
        <div style={{display: 'flex', gap: 8}}>
          {alignOptions.map((a: any) => (
            <button key={a.value} onClick={() => setProp('textAlign', a.value)} style={{
              padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: textAlign === a.value ? '#3B82F6' : '#2D3748',
              color: textAlign === a.value ? '#fff' : '#D1D5DB',
              fontSize: 14,
            }}>{a.label}</button>
          ))}
        </div>
      </div>

      {/* Bold / Italic / Underline */}
      <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
        <StyleToggle active={fontWeightIsBold(props)} onClick={() => {
          const current = (props.fontWeight as number) ?? 400;
          setProp('fontWeight', current >= 700 ? 400 : 700);
        }}>B</StyleToggle>
        <StyleToggle active={fontStyle === 'italic'} onClick={() => {
          setProp('fontStyle', fontStyle === 'italic' ? 'normal' : 'italic');
        }}>I</StyleToggle>
        <StyleToggle active={textTransform === 'uppercase'} onClick={() => {
          setProp('textTransform', textTransform === 'uppercase' ? 'none' : 'uppercase');
        }}>AA</StyleToggle>
      </div>
    </div>
  );
}

function fontWeightIsBold(props: Record<string, unknown>): boolean {
  return ((props.fontWeight as number) ?? 400) >= 700;
}

function StyleToggle({active, onClick, children}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer',
      background: active ? '#3B82F6' : '#2D3748',
      color: active ? '#fff' : '#D1D5DB',
      fontSize: 16, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}

// ─── Spacing Panel ────────────────────────────────────────────────

function SpacingPanel() {
  const {element, setProp, props} = useElementProps();
  if (!element) return null;

  const letterSpacing = (props.letterSpacing as number) ?? 0;
  const lineHeight = (props.lineHeight as number) ?? 1.2;

  return (
    <div style={{padding: '12px 20px'}}>
      {/* Letter spacing */}
      <div style={{marginBottom: 20}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
          <span style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500}}>LETTER SPACING</span>
          <span style={{color: '#fff', fontSize: 13}}>{letterSpacing}</span>
        </div>
        <input type="range" min={-5} max={20} step={0.5} value={letterSpacing}
          onChange={(e) => setProp('letterSpacing', Number(e.target.value))}
          style={{width: '100%', height: 6, accentColor: '#3B82F6', cursor: 'pointer'}} />
      </div>

      {/* Line height */}
      <div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
          <span style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500}}>LINE HEIGHT</span>
          <span style={{color: '#fff', fontSize: 13}}>{lineHeight}</span>
        </div>
        <input type="range" min={0.5} max={3} step={0.1} value={lineHeight}
          onChange={(e) => setProp('lineHeight', Number(e.target.value))}
          style={{width: '100%', height: 6, accentColor: '#3B82F6', cursor: 'pointer'}} />
      </div>
    </div>
  );
}

// ─── Effects Panel ────────────────────────────────────────────────

function EffectsPanel() {
  const {element, setProp, props} = useElementProps();
  if (!element) return null;

  const backgroundColor = (props.backgroundColor as string) ?? null;
  const borderRadius = (props.borderRadius as number) ?? 0;

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 8}}>EFFECTS</div>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        <EffectBtn active={!backgroundColor} onClick={() => setProp('backgroundColor', null)} label="None" icon="⊘" />
        <EffectBtn active={!!backgroundColor} onClick={() => setProp('backgroundColor', backgroundColor || '#000000')}
          label="BG" icon="◼" />
      </div>

      {backgroundColor && (
        <div style={{marginTop: 12}}>
          <input type="text" value={backgroundColor}
            onChange={(e) => setProp('backgroundColor', e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6,
              border: '1px solid #374151', background: '#2D3748', color: '#fff',
              fontFamily: 'monospace', boxSizing: 'border-box',
            }} />
        </div>
      )}

      <div style={{marginTop: 16}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
          <span style={{color: '#9CA3AF', fontSize: 11}}>RADIUS</span>
          <span style={{color: '#fff', fontSize: 13}}>{borderRadius}px</span>
        </div>
        <input type="range" min={0} max={50} value={borderRadius}
          onChange={(e) => setProp('borderRadius', Number(e.target.value))}
          style={{width: '100%', height: 6, accentColor: '#3B82F6', cursor: 'pointer'}} />
      </div>
    </div>
  );
}

function EffectBtn({active, onClick, label, icon}: {
  active: boolean; onClick: () => void; label: string; icon: string;
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '10px 16px', borderRadius: 8, border: active ? '2px solid #3B82F6' : '1px solid #374151',
      background: active ? '#1E3A5F' : '#2D3748', cursor: 'pointer', minWidth: 56,
    }}>
      <span style={{fontSize: 20, color: '#fff'}}>{icon}</span>
      <span style={{color: '#D1D5DB', fontSize: 10}}>{label}</span>
    </button>
  );
}

// ─── Color Panel ──────────────────────────────────────────────────

const COLORS = [
  '#FFFFFF', '#F8FAFC', '#E2E8F0', '#CBD5E1',
  '#1A365D', '#2D3748', '#1A202C', '#000000',
  '#3182CE', '#2B6CB0', '#38A169', '#D69E2E',
  '#DD6B20', '#E53E3E', '#9F7AEA', '#ED64A6',
  '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6',
];

function ColorPanel() {
  const {element, setProp, props} = useElementProps();
  if (!element) return null;

  const color = (props.color as string) ?? '#1A202C';
  const fill = (props.fill as string) ?? '#3182CE';

  const currentColor = element.type === 'text' ? color : fill;
  const colorKey = element.type === 'text' ? 'color' : 'fill';

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 10}}>COLOR</div>

      {/* Custom color picker + preview */}
      <div style={{display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14}}>
        <label style={{position: 'relative', cursor: 'pointer', flexShrink: 0}}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: currentColor,
            border: '2px solid #4A5568',
          }} />
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setProp(colorKey, e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              width: '100%', height: '100%', cursor: 'pointer',
            }}
          />
        </label>
        <input type="text" value={currentColor}
          onChange={(e) => setProp(colorKey, e.target.value)}
          style={{
            flex: 1, padding: '10px 12px', fontSize: 14, borderRadius: 8,
            border: '1px solid #374151', background: '#2D3748', color: '#E2E8F0',
            fontFamily: 'monospace', boxSizing: 'border-box',
          }} />
      </div>

      {/* Preset row */}
      <div style={{color: '#9CA3AF', fontSize: 10, fontWeight: 500, marginBottom: 6}}>PRESETS</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
        {COLORS.map((c) => (
          <button key={c} onClick={() => setProp(colorKey, c)} style={{
            width: 30, height: 30, borderRadius: 6, background: c,
            border: currentColor === c ? '3px solid #3B82F6' : '1px solid #374151',
            cursor: 'pointer', padding: 0, flexShrink: 0,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Transparency Panel ───────────────────────────────────────────

function TransparencyPanel() {
  const {element, dispatch} = useElementProps();
  if (!element || !dispatch) return null;

  const opacity = element.transform.opacity;
  const id = element.id;

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
        <span style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500}}>OPACITY</span>
        <span style={{color: '#fff', fontSize: 13}}>{Math.round(opacity * 100)}%</span>
      </div>
      <input type="range" min={0} max={100} value={Math.round(opacity * 100)}
        onChange={(e) => {
          dispatch({
            type: 'SET_ELEMENT_PROP', elementId: id,
            key: 'opacity', value: Number(e.target.value) / 100,
          });
        }}
        style={{width: '100%', height: 6, accentColor: '#3B82F6', cursor: 'pointer'}} />
    </div>
  );
}

// ─── Lock Panel ────────────────────────────────────────────────────

function LockPanel() {
  const {element, dispatch, id} = useElementProps();
  if (!element || !dispatch || !id) return null;

  const locked = element.locked;
  const visible = element.visible;

  return (
    <div style={{padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 4}}>ELEMENT CONTROLS</div>

      {/* Lock / Unlock */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: 10, background: '#2D3748',
        border: '1px solid #374151',
      }}>
        <div>
          <div style={{color: '#E2E8F0', fontSize: 14, fontWeight: 600}}>Lock Position</div>
          <div style={{color: '#9CA3AF', fontSize: 11, marginTop: 2}}>
            {locked ? 'Element cannot be moved or resized' : 'Element can be freely moved'}
          </div>
        </div>
        <button
          onClick={() => dispatch({type: 'SET_LOCKED', elementId: id, locked: !locked})}
          style={{
            width: 52, height: 28, borderRadius: 14, border: 'none',
            cursor: 'pointer', padding: 0, position: 'relative',
            background: locked ? '#3B82F6' : '#4A5568',
            transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: locked ? 26 : 2,
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>

      {/* Hide / Show */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderRadius: 10, background: '#2D3748',
        border: '1px solid #374151',
      }}>
        <div>
          <div style={{color: '#E2E8F0', fontSize: 14, fontWeight: 600}}>
            {visible ? '👁 Visible' : '👁‍🗨 Hidden'}
          </div>
          <div style={{color: '#9CA3AF', fontSize: 11, marginTop: 2}}>
            {visible ? 'Element is visible on stage' : 'Element is hidden from view'}
          </div>
        </div>
        <button
          onClick={() => dispatch({type: 'SET_VISIBLE', elementId: id, visible: !visible})}
          style={{
            width: 52, height: 28, borderRadius: 14, border: 'none',
            cursor: 'pointer', padding: 0, position: 'relative',
            background: visible ? '#3B82F6' : '#4A5568',
            transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: visible ? 26 : 2,
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>

      {/* Status indicators */}
      <div style={{display: 'flex', gap: 12, marginTop: 8}}>
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: locked ? '#38A16920' : '#4A5568',
          border: `1px solid ${locked ? '#38A16940' : '#374151'}`,
          fontSize: 12, color: locked ? '#38A169' : '#9CA3AF',
        }}>
          {locked ? '🔒 Locked' : '🔓 Unlocked'}
        </div>
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: visible ? '#38A16920' : '#E53E3E20',
          border: `1px solid ${visible ? '#38A16940' : '#E53E3E40'}`,
          fontSize: 12, color: visible ? '#38A169' : '#E53E3E',
        }}>
          {visible ? '👁 Visible' : '👁‍🗨 Hidden'}
        </div>
      </div>
    </div>
  );
}

// ─── Order Panel ──────────────────────────────────────────────────

function OrderPanel() {
  const {element, dispatch} = useElementProps();
  if (!element || !dispatch) return null;

  const id = element.id;
  const zIndex = element.transform.zIndex;

  const move = (direction: 'front' | 'forward' | 'backward' | 'back') => {
    let newZ = zIndex;
    if (direction === 'front') newZ = 1000;
    else if (direction === 'back') newZ = 0;
    else if (direction === 'forward') newZ = Math.min(1000, zIndex + 1);
    else newZ = Math.max(0, zIndex - 1);

    dispatch({
      type: 'SET_ELEMENT_PROP', elementId: id,
      key: 'zIndex', value: newZ,
    });
  };

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 12}}>LAYER ORDER</div>
      <div style={{display: 'flex', gap: 8, justifyContent: 'center'}}>
        <OrderBtn icon="⏫" label="Front" onClick={() => move('front')} />
        <OrderBtn icon="🔼" label="Forward" onClick={() => move('forward')} />
        <OrderBtn icon="🔽" label="Back" onClick={() => move('backward')} />
        <OrderBtn icon="⏬" label="Back" onClick={() => move('back')} />
      </div>
    </div>
  );
}

function OrderBtn({icon, label, onClick}: {icon: string; label: string; onClick: () => void}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '10px 14px', borderRadius: 8, border: '1px solid #374151',
      background: '#2D3748', cursor: 'pointer',
    }}>
      <span style={{fontSize: 18}}>{icon}</span>
      <span style={{color: '#D1D5DB', fontSize: 10}}>{label}</span>
    </button>
  );
}

// ─── Animate Panel ────────────────────────────────────────────────

const ANIMATIONS = [
  {id: 'none', icon: '⊘', label: 'None'},
  {id: 'fade-in', icon: '◉', label: 'Fade'},
  {id: 'slide-up', icon: '↑', label: 'Slide'},
  {id: 'zoom-in', icon: '⊕', label: 'Zoom'},
  {id: 'bounce-in', icon: '↕', label: 'Bounce'},
];

function AnimatePanel() {
  const {element, setProp} = useElementProps();
  if (!element) return null;

  const animIn = element.animation?.in?.preset ?? 'none';
  const animOut = element.animation?.out?.preset ?? 'none';

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 8}}>ENTRANCE</div>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {ANIMATIONS.map((a) => (
          <button key={a.id} onClick={() => {
            const anim = element?.animation ?? {};
            setProp('animation', {
              ...anim,
              in: a.id === 'none' ? undefined : {preset: a.id, durationFrames: 15, easing: 'ease-out'},
            });
          }} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 14px', borderRadius: 8,
            border: animIn === a.id ? '2px solid #3B82F6' : '1px solid #374151',
            background: animIn === a.id ? '#1E3A5F' : '#2D3748',
            cursor: 'pointer',
          }}>
            <span style={{fontSize: 20, color: '#fff'}}>{a.icon}</span>
            <span style={{color: '#D1D5DB', fontSize: 10}}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Image Panel (image elements) ─────────────────────────────────

function ImagePanel() {
  const {element, setProp, props} = useElementProps();
  const openGallery = useEditorStore((s) => s.openGallery);
  if (!element || element.type !== 'image') return null;

  const src = (props.src as string) ?? '';
  const fit = (props.fit as string) ?? 'cover';

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 8}}>IMAGE SOURCE</div>

      {/* Image preview */}
      {src && src !== '{{imageUrl}}' && (
        <div style={{
          marginBottom: 12, borderRadius: 8, overflow: 'hidden',
          border: '1px solid #374151', aspectRatio: '16/9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#1A202C',
        }}>
          <img src={src} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        </div>
      )}

      {/* Open Photo Gallery */}
      <button onClick={() => openGallery('photos')} style={{
        width: '100%', padding: '12px 16px', borderRadius: 8,
        background: '#3B82F6', border: 'none', cursor: 'pointer',
        color: '#fff', fontSize: 14, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginBottom: 12,
      }}>
        <span style={{fontSize: 18}}>🖼</span>
        Search Stock Photos
      </button>

      {/* Direct URL input */}
      <div>
        <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 6}}>OR PASTE URL</div>
        <input type="text"
          value={src === '{{imageUrl}}' ? '' : src}
          onChange={(e) => setProp('src', e.target.value || '{{imageUrl}}')}
          placeholder="https://example.com/photo.jpg"
          style={{
            width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8,
            border: '1px solid #374151', background: '#2D3748', color: '#E2E8F0',
            fontFamily: 'monospace', boxSizing: 'border-box',
          }} />
      </div>

      {/* Fit */}
      <div style={{marginTop: 16}}>
        <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 8}}>FIT</div>
        <div style={{display: 'flex', gap: 6}}>
          {([
            {value: 'cover', label: 'Cover'},
            {value: 'contain', label: 'Contain'},
            {value: 'fill', label: 'Fill'},
          ]).map(({value, label}) => (
            <button key={value} onClick={() => setProp('fit', value)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: fit === value ? '#3B82F6' : '#2D3748',
              color: fit === value ? '#fff' : '#D1D5DB',
              fontSize: 13, fontWeight: 500,
            }}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shape Panel (shape elements) ─────────────────────────────────

const SHAPE_TYPES = [
  {id: 'rectangle', icon: '▬', label: 'Rectangle'},
  {id: 'circle', icon: '●', label: 'Circle'},
  {id: 'line', icon: '—', label: 'Line'},
  {id: 'star', icon: '★', label: 'Star'},
  {id: 'triangle', icon: '▲', label: 'Triangle'},
  {id: 'diamond', icon: '◆', label: 'Diamond'},
  {id: 'hexagon', icon: '⬡', label: 'Hexagon'},
  {id: 'rounded-rect', icon: '▢', label: 'Rounded'},
];

function ShapePanel() {
  const {element, setProp, props} = useElementProps();
  if (!element || element.type !== 'shape') return null;

  const shapeType = (props.shapeType as string) ?? 'rectangle';
  const borderRadius = (props.borderRadius as number) ?? 0;

  return (
    <div style={{padding: '12px 20px'}}>
      <div style={{color: '#9CA3AF', fontSize: 11, fontWeight: 500, marginBottom: 10}}>SHAPE TYPE</div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
        {SHAPE_TYPES.map((s) => (
          <button key={s.id} onClick={() => {
            setProp('shapeType', s.id);
            // Auto-set sensible defaults per shape
            if (s.id === 'circle') setProp('borderRadius', 999);
            else if (s.id === 'rounded-rect') setProp('borderRadius', 12);
            else if (s.id === 'line') setProp('borderRadius', 0);
          }} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '12px 6px', borderRadius: 8,
            border: shapeType === s.id ? '2px solid #3B82F6' : '1px solid #374151',
            background: shapeType === s.id ? '#1E3A5F' : '#2D3748',
            cursor: 'pointer',
          }}>
            <span style={{fontSize: 24, color: '#fff'}}>{s.icon}</span>
            <span style={{color: shapeType === s.id ? '#93C5FD' : '#9CA3AF', fontSize: 10, fontWeight: 500}}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Border radius slider for rectangle variants */}
      {shapeType !== 'circle' && shapeType !== 'line' && (
        <div style={{marginTop: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
            <span style={{color: '#9CA3AF', fontSize: 11}}>ROUNDING</span>
            <span style={{color: '#D1D5DB', fontSize: 13}}>{borderRadius}px</span>
          </div>
          <input type="range" min={0} max={200} value={borderRadius}
            onChange={(e) => setProp('borderRadius', Number(e.target.value))}
            style={{width: '100%', height: 6, accentColor: '#3B82F6', cursor: 'pointer'}} />
        </div>
      )}
    </div>
  );
}
