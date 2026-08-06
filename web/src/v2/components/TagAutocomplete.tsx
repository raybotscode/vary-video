/**
 * TagAutocomplete — searchable dropdown of merge tags filtered by type.
 *
 * Used in property panels and binding sheets to let users select a merge
 * tag to bind a property to. Filters by search text and compatible tag types.
 */

import React, {useState, useMemo, useRef, useEffect} from 'react';
import type {MergeTag, MergeTagType} from '@vary/v2/schema/document';
import TagTypeIcon from './TagTypeIcon';

interface TagAutocompleteProps {
  /** All available merge tags. */
  tags: MergeTag[];
  /** Currently selected tag ID. */
  value?: string | null;
  /** Only show tags of these types. If omitted, show all. */
  compatibleTypes?: string[];
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Called when user selects a tag. */
  onSelect: (tagId: string) => void;
  /** Called when user clears the selection. */
  onClear?: () => void;
  className?: string;
}

export default function TagAutocomplete({
  tags,
  value,
  compatibleTypes,
  placeholder = 'Search tags...',
  onSelect,
  onClear,
  className,
}: TagAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter tags
  const filtered = useMemo(() => {
    let list = tags;
    if (compatibleTypes && compatibleTypes.length > 0) {
      list = list.filter((t) => compatibleTypes.includes(t.type));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.key.toLowerCase().includes(q) ||
          t.label.toLowerCase().includes(q),
      );
    }
    return list;
  }, [tags, compatibleTypes, search]);

  const selected = tags.find((t) => t.id === value) ?? null;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{position: 'relative', width: '100%'}}
    >
      {/* Trigger */}
      <div
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #D1D5DB',
          backgroundColor: '#F9FAFB',
          cursor: 'pointer',
          minHeight: 34,
          fontSize: 13,
        }}
      >
        {selected ? (
          <>
            <TagTypeIcon type={selected.type} size={14} />
            <span style={{fontFamily: 'monospace', fontWeight: 600, color: '#6366F1'}}>
              {`{{${selected.key}}}`}
            </span>
            <span style={{color: '#6B7280', flex: 1}}>{selected.label}</span>
            {onClear && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: 14,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </>
        ) : (
          <span style={{color: '#9CA3AF'}}>Select tag...</span>
        )}
        <span style={{marginLeft: 'auto', color: '#9CA3AF', fontSize: 10}}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: 4,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: 220,
            overflow: 'hidden',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: 'none',
              borderBottom: '1px solid #E5E7EB',
              outline: 'none',
              fontSize: 12,
            }}
          />
          <div style={{overflowY: 'auto', maxHeight: 180}}>
            {filtered.length === 0 ? (
              <div style={{padding: '12px 10px', color: '#9CA3AF', fontSize: 12, textAlign: 'center'}}>
                No tags found
              </div>
            ) : (
              filtered.map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => {
                    onSelect(tag.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    backgroundColor: tag.id === value ? '#EEF2FF' : 'transparent',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      tag.id === value ? '#EEF2FF' : 'transparent';
                  }}
                >
                  <TagTypeIcon type={tag.type} size={16} />
                  <span style={{fontFamily: 'monospace', fontWeight: 600, color: '#6366F1'}}>
                    {`{{${tag.key}}}`}
                  </span>
                  <span style={{color: '#6B7280', fontSize: 12, flex: 1}}>
                    {tag.label}
                  </span>
                  {tag.required && (
                    <span style={{color: '#EF4444', fontSize: 10, fontWeight: 600}}>REQ</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
