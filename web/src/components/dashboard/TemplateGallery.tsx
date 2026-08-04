import {useMemo, useState} from 'react';
import type {TemplateDefinition} from '../../api/client';
import {templateIconFor} from '../../utils/templates';

type TemplateGalleryProps = {
  compositions: TemplateDefinition[];
  selectedCompositionId: string;
  onSelect: (templateId: string) => void;
};

const CATEGORY_COLORS: Record<string, {bg: string; text: string; border: string}> = {
  ad: {bg: '#FEF3C7', text: '#92400E', border: '#F59E0B'},
  product: {bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6'},
  property: {bg: '#D1FAE5', text: '#065F46', border: '#10B981'},
  social: {bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6'},
  webinar: {bg: '#FCE7F3', text: '#9D174D', border: '#EC4899'},
};

const categoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? {bg: '#F3F4F6', text: '#374151', border: '#9CA3AF'};

export default function TemplateGallery({
  compositions,
  selectedCompositionId,
  onSelect,
}: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(compositions.map((c) => c.category ?? 'other'));
    return ['all', ...cats];
  }, [compositions]);

  const filtered = useMemo(() => {
    let result = compositions;
    if (activeCategory && activeCategory !== 'all') {
      result = result.filter((c) => (c.category ?? 'other') === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q) ||
          (c.useCase ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [compositions, activeCategory, search]);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      {/* Search + filter bar */}
      <div style={{display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap'}}>
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            fontSize: 14,
            background: '#F9FAFB',
          }}
        />
        <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat || (cat === 'all' && !activeCategory);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat === 'all' ? null : cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: isActive ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  background: isActive ? '#EFF6FF' : '#fff',
                  color: isActive ? '#1D4ED8' : '#6B7280',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {filtered.map((template) => {
          const isSelected = selectedCompositionId === template.id;
          const colors = categoryColor(template.category ?? 'other');

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 12,
                border: isSelected
                  ? '2px solid #3B82F6'
                  : '1px solid #E5E7EB',
                background: '#fff',
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                boxShadow: isSelected
                  ? '0 0 0 3px rgba(59,130,246,0.15)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {/* Preview area */}
              <div
                style={{
                  height: 140,
                  background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border}22 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: colors.text,
                    opacity: 0.6,
                    letterSpacing: 2,
                  }}
                >
                  {templateIconFor(template.id)}
                </span>
                {/* Category badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    border: `1px solid ${colors.border}40`,
                  }}
                >
                  {template.category ?? 'other'}
                </span>
              </div>

              {/* Info area */}
              <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4}}>
                <strong style={{fontSize: 15, color: '#111827'}}>
                  {template.name ?? template.id}
                </strong>
                <p style={{fontSize: 13, color: '#6B7280', margin: 0, lineHeight: 1.4}}>
                  {template.description ?? 'Dynamic video template.'}
                </p>
                {template.useCase && (
                  <span style={{fontSize: 12, color: '#9CA3AF', marginTop: 4}}>
                    {template.useCase}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{textAlign: 'center', padding: 32, color: '#9CA3AF'}}>
          No templates match your search.
        </div>
      )}
    </div>
  );
}
