/**
 * EditableTitle — click-to-edit project title.
 *
 * Used in MobileTopBar or as a standalone field.
 * Updates document.name via dispatch.
 */

import {useState, useRef, useEffect, useCallback} from 'react';
import {useDocumentStore} from '../../stores/documentStore';

interface EditableTitleProps {
  style?: React.CSSProperties;
}

export default function EditableTitle({style}: EditableTitleProps) {
  const name = useDocumentStore((s) => s.document.name);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      dispatch({type: 'SET_DOCUMENT_NAME', name: trimmed} as any);
    }
    setEditing(false);
  }, [value, name, dispatch]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setValue(name); setEditing(false); }
        }}
        style={{
          background: '#2D3748', border: '1px solid #3B82F6',
          color: '#E2E8F0', fontSize: 13, fontWeight: 600,
          padding: '4px 8px', borderRadius: 6, width: 160,
          ...style,
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Tap to rename project"
      style={{
        background: 'none', border: 'none',
        color: '#D1D5DB', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', padding: '6px 8px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: 120,
        ...style,
      }}
    >
      {name || 'Untitled'}
    </button>
  );
}
