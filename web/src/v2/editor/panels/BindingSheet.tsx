/**
 * BindingSheet — bottom sheet for choosing binding mode (Fixed/Tag).
 *
 * Slides up when user taps the variable icon next to a merge-tag-capable property.
 * Two tabs:
 * - Fixed: standard literal value editor
 * - Tag: autocomplete of available merge tags filtered by property type + fallback
 *
 * Also includes "Create new tag" flow via CreateTagInline.
 */

import {useState, useMemo, useRef, useEffect} from 'react';
import {createPortal} from 'react-dom';
import type {MergeTag} from '@vary/v2/schema/document';
import type {BindableValue} from '@vary/v2/schema/bindable';
import {literal, tagBinding, isTagTypeCompatible} from '@vary/v2/schema/bindable';
import {useDocumentStore} from '../../stores/documentStore';
import CreateTagInline from './CreateTagInline';

interface BindingSheetProps {
  propertyKey: string;
  propertyLabel: string;
  propertyType: string;
  currentValue: unknown;
  mergeTags: MergeTag[];
  onCommit: (key: string, value: unknown) => void;
  onClose: () => void;
}

const SHEET_Z = 12000;
const BACKDROP_Z = 11999;

export default function BindingSheet({
  propertyKey,
  propertyLabel,
  propertyType,
  currentValue,
  mergeTags,
  onCommit,
  onClose,
}: BindingSheetProps) {
  const dispatch = useDocumentStore((s) => s.dispatch);

  // Determine current binding mode from value
  const currentBinding = useMemo((): BindableValue => {
    if (
      typeof currentValue === 'object' &&
      currentValue !== null &&
      (currentValue as any)._type === 'tag'
    ) {
      return currentValue as BindableValue;
    }
    return literal(currentValue);
  }, [currentValue]);

  const [mode, setMode] = useState<'fixed' | 'tag'>(
    currentBinding._type === 'tag' ? 'tag' : 'fixed',
  );
  const [selectedTagId, setSelectedTagId] = useState<string | null>(
    currentBinding._type === 'tag' ? currentBinding.tagId : null,
  );
  const [fixedValue, setFixedValue] = useState<string>(
    currentBinding._type === 'literal' ? String(currentBinding.value ?? '') : '',
  );
  const [fallbackValue, setFallbackValue] = useState<string>(
    currentBinding._type === 'tag' && currentBinding.fallback !== undefined
      ? String(currentBinding.fallback)
      : '',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);

  // Filter compatible tags
  const compatibleTags = useMemo(() => {
    return mergeTags.filter((t) => isTagTypeCompatible(propertyType, t.type));
  }, [mergeTags, propertyType]);

  // Filter by search
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return compatibleTags;
    const q = searchQuery.toLowerCase();
    return compatibleTags.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q),
    );
  }, [compatibleTags, searchQuery]);

  const handleApply = () => {
    if (mode === 'fixed') {
      onCommit(propertyKey, fixedValue);
    } else if (selectedTagId) {
      const binding = tagBinding(
        selectedTagId,
        fallbackValue.trim() ? fallbackValue : undefined,
      );
      onCommit(propertyKey, binding);
    }
    onClose();
  };

  const handleTagCreated = (tag: MergeTag) => {
    // Pass the pre-generated ID through so the stored tag matches
    dispatch({
      type: 'ADD_MERGE_TAG',
      key: tag.key,
      tagType: tag.type,
      label: tag.label,
      defaultValue: tag.defaultValue,
      tagId: tag.id,
    });
    setSelectedTagId(tag.id);
    setShowCreateTag(false);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: active ? '3px solid #3B82F6' : '3px solid transparent',
    color: active ? '#1A202C' : '#9CA3AF',
    fontSize: 15,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  const content = (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: BACKDROP_Z,
        background: 'rgba(0,0,0,0.35)',
        WebkitTapHighlightColor: 'transparent',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: SHEET_Z,
        maxHeight: '80vh',
        background: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        animation: 'bindingsheet-up 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Drag handle */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '14px 0 8px', flexShrink: 0,
        }}>
          <div style={{width: 40, height: 5, borderRadius: 3, background: '#D1D5DB'}} />
        </div>

        {/* Header */}
        <div style={{
          padding: '4px 20px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{fontSize: 17, fontWeight: 600, color: '#1A202C'}}>{propertyLabel} Binding</div>
            <div style={{fontSize: 12, color: '#9CA3AF', marginTop: 2}}>
              Choose how this property gets its value
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 24,
            color: '#9CA3AF', cursor: 'pointer', padding: '4px 8px',
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #E5E7EB',
          padding: '0 12px', flexShrink: 0,
        }}>
          <button onClick={() => setMode('fixed')} style={tabStyle(mode === 'fixed')}>
            📝 Fixed
          </button>
          <button onClick={() => setMode('tag')} style={tabStyle(mode === 'tag')}>
            {`{ }`} Tag
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflow: 'auto', minHeight: 0,
          padding: '16px 20px', WebkitOverflowScrolling: 'touch',
        }}>
          {/* Fixed mode */}
          {mode === 'fixed' && (
            <div>
              <label style={{fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8}}>
                Fixed Value
              </label>
              {propertyType === 'color' ? (
                <div>
                  <div style={{display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8}}>
                    {[
                      '#FFFFFF', '#F8FAFC', '#E2E8F0', '#1A365D', '#2D3748', '#1A202C', '#000000',
                      '#3182CE', '#2B6CB0', '#38A169', '#D69E2E', '#DD6B20', '#E53E3E', '#9F7AEA', '#ED64A6',
                    ].map((color) => (
                      <button key={color} onClick={() => setFixedValue(color)} style={{
                        width: 32, height: 32, borderRadius: 6,
                        border: fixedValue === color ? '3px solid #3B82F6' : '1px solid #E5E7EB',
                        background: color, cursor: 'pointer', padding: 0,
                      }} />
                    ))}
                  </div>
                  <input type="text" value={fixedValue}
                    onChange={(e) => setFixedValue(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', fontSize: 15,
                      border: '1px solid #E5E7EB', borderRadius: 8,
                      background: '#F9FAFB', boxSizing: 'border-box',
                      fontFamily: 'monospace',
                    }} />
                </div>
              ) : propertyType === 'number' ? (
                <input type="number" value={fixedValue}
                  onChange={(e) => setFixedValue(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 15,
                    border: '1px solid #E5E7EB', borderRadius: 8,
                    background: '#F9FAFB', boxSizing: 'border-box',
                  }} />
              ) : (
                <textarea value={fixedValue}
                  onChange={(e) => setFixedValue(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 15,
                    border: '1px solid #E5E7EB', borderRadius: 8,
                    background: '#F9FAFB', boxSizing: 'border-box',
                    resize: 'vertical', fontFamily: 'inherit',
                  }} />
              )}
            </div>
          )}

          {/* Tag mode */}
          {mode === 'tag' && (
            <div>
              {showCreateTag ? (
                <CreateTagInline
                  suggestedKey={propertyKey}
                  propertyType={propertyType}
                  onCreated={handleTagCreated}
                  onCancel={() => setShowCreateTag(false)}
                />
              ) : (
                <>
                  {/* Tag selector */}
                  <div style={{marginBottom: 16}}>
                    <label style={{fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 8}}>
                      Bind to Merge Tag
                    </label>
                    <input
                      type="text"
                      placeholder="Search merge tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: 14,
                        border: '1px solid #E5E7EB', borderRadius: 8,
                        background: '#F9FAFB', boxSizing: 'border-box',
                        marginBottom: 8,
                      }}
                    />

                    {/* Tag list */}
                    <div style={{
                      maxHeight: 200, overflowY: 'auto',
                      border: '1px solid #E5E7EB', borderRadius: 8,
                    }}>
                      {filteredTags.length === 0 ? (
                        <div style={{
                          padding: '16px', textAlign: 'center', color: '#9CA3AF',
                          fontSize: 14,
                        }}>
                          <div style={{marginBottom: 8}}>No compatible merge tags found</div>
                          <button onClick={() => setShowCreateTag(true)} style={{
                            padding: '8px 16px', borderRadius: 6,
                            background: '#3B82F6', color: '#fff', border: 'none',
                            fontSize: 13, cursor: 'pointer', fontWeight: 500,
                          }}>
                            + Create New Tag
                          </button>
                        </div>
                      ) : (
                        filteredTags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => setSelectedTagId(tag.id === selectedTagId ? null : tag.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              width: '100%', padding: '12px 14px',
                              border: 'none', borderBottom: '1px solid #F3F4F6',
                              background: selectedTagId === tag.id ? '#EFF6FF' : 'transparent',
                              cursor: 'pointer', textAlign: 'left',
                              transition: 'background 0.1s',
                            }}
                          >
                            <span style={{
                              fontSize: 13, fontWeight: 600, color: '#1A365D',
                              background: '#DBEAFE', padding: '2px 8px', borderRadius: 4,
                              fontFamily: 'monospace',
                            }}>
                              {`{{${tag.key}}}`}
                            </span>
                            <span style={{fontSize: 13, color: '#374151', flex: 1}}>{tag.label}</span>
                            <span style={{
                              fontSize: 10, padding: '2px 6px', borderRadius: 4,
                              background: '#F3F4F6', color: '#6B7280',
                            }}>{tag.type}</span>
                            {selectedTagId === tag.id && (
                              <span style={{color: '#3B82F6', fontSize: 16}}>✓</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Create tag button (only when tags exist — empty state has its own) */}
                    {compatibleTags.length > 0 && (
                      <button onClick={() => setShowCreateTag(true)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      marginTop: 8, padding: '8px 14px', borderRadius: 8,
                      background: 'transparent', border: '1px dashed #D1D5DB',
                      color: '#6B7280', fontSize: 13, cursor: 'pointer',
                      width: '100%', justifyContent: 'center',
                    }}>
                      <span style={{fontSize: 16}}>+</span>
                      Create a new merge tag
                    </button>
                    )}
                  </div>

                  {/* Fallback value */}
                  {selectedTagId && (
                    <div>
                      <label style={{
                        fontSize: 12, fontWeight: 600, color: '#6B7280',
                        display: 'block', marginBottom: 8,
                      }}>
                        Fallback Value (optional)
                      </label>
                      <input type="text" value={fallbackValue}
                        onChange={(e) => setFallbackValue(e.target.value)}
                        placeholder="Used when tag value is empty..."
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: 14,
                          border: '1px solid #E5E7EB', borderRadius: 8,
                          background: '#F9FAFB', boxSizing: 'border-box',
                        }} />
                      <div style={{fontSize: 11, color: '#9CA3AF', marginTop: 4}}>
                        This value is used when the merge tag has no data
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Apply button */}
        <div style={{
          padding: '12px 20px 20px', flexShrink: 0,
          borderTop: '1px solid #E5E7EB',
        }}>
          <button onClick={handleApply} disabled={mode === 'tag' && !selectedTagId} style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: (mode === 'tag' && !selectedTagId) ? '#E5E7EB' : '#3B82F6',
            color: '#fff', border: 'none', fontSize: 16, fontWeight: 600,
            cursor: (mode === 'tag' && !selectedTagId) ? 'not-allowed' : 'pointer',
          }}>
            Apply Binding
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bindingsheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}
