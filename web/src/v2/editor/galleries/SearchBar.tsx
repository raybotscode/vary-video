/**
 * SearchBar — debounced search input for mobile galleries.
 *
 * Dark themed, 44px minimum touch target.
 * Debounces 300ms before calling onChange.
 */

import {useState, useEffect, useRef} from 'react';

interface SearchBarProps {
  placeholder?: string;
  onChange: (query: string) => void;
}

export default function SearchBar({placeholder = 'Search...', onChange}: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(value);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, onChange]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#1E293B', borderRadius: 10,
      padding: '0 14px', minHeight: 44,
      border: '1px solid #334155',
    }}>
      <span style={{color: '#64748B', fontSize: 16, marginRight: 10}}>🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'transparent', border: 'none',
          color: '#E2E8F0', fontSize: 15, outline: 'none',
          padding: '10px 0',
        }}
      />
      {value && (
        <button onClick={() => setValue('')} style={{
          background: 'none', border: 'none', color: '#64748B',
          fontSize: 18, cursor: 'pointer', padding: '4px 8px',
        }}>×</button>
      )}
    </div>
  );
}
