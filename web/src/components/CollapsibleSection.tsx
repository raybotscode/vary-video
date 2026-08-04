import {useState, useCallback, type ReactNode} from 'react';

type CollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <div style={{border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden'}}>
      <button
        type="button"
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 16px',
          background: '#F9FAFB',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
        }}
      >
        <span>{title}</span>
        <span
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: 12,
            color: '#9CA3AF',
          }}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{padding: '12px 16px'}}>
          {children}
        </div>
      )}
    </div>
  );
}
