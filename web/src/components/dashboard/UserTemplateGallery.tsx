import {useEffect, useMemo, useState} from 'react';
import {apiClient, type UserTemplate} from '../../api/client';

type UserTemplateGalleryProps = {
  onSelect: (spec: Record<string, unknown>, templateId: string) => void;
  selectedId?: string;
};

const CATEGORY_COLORS: Record<string, {bg: string; text: string; border: string}> = {
  ad: {bg: '#FEF3C7', text: '#92400E', border: '#F59E0B'},
  product: {bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6'},
  property: {bg: '#D1FAE5', text: '#065F46', border: '#10B981'},
  social: {bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6'},
};

const categoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? {bg: '#F3F4F6', text: '#374151', border: '#9CA3AF'};

const SOURCE_BADGES: Record<string, {label: string; color: string}> = {
  reused: {label: '🔄 Adapted', color: '#7C3AED'},
  composed: {label: '✨ AI Composed', color: '#2563EB'},
  manual: {label: '✏️ Manual', color: '#6B7280'},
};

export default function UserTemplateGallery({onSelect, selectedId}: UserTemplateGalleryProps) {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'all' | 'mine' | 'public'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient.getUserTemplates({scope, limit: 100})
      .then((res) => {
        if (!cancelled) {
          setTemplates(res.templates);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load templates');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [scope]);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }, [templates, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient.deleteUserTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const result = await apiClient.publishUserTemplate(id);
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? {...t, isPublic: result.isPublic} : t)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: 24, color: '#9CA3AF'}}>
        Loading your templates…
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12}}>
        <h3 style={{margin: 0, fontSize: 16, fontWeight: 700, color: '#111827'}}>
          💾 My Templates
        </h3>
        <div style={{display: 'flex', gap: 6}}>
          {(['all', 'mine', 'public'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              style={{
                padding: '5px 12px',
                borderRadius: 16,
                border: scope === s ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: scope === s ? '#EFF6FF' : '#fff',
                color: scope === s ? '#1D4ED8' : '#6B7280',
                fontSize: 12,
                fontWeight: scope === s ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s === 'mine' ? 'My Templates' : s === 'public' ? 'Community' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search your templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #E5E7EB',
          fontSize: 13,
          background: '#F9FAFB',
        }}
      />

      {error && (
        <div style={{padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', color: '#991B1B', fontSize: 13}}>
          {error}
        </div>
      )}

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div style={{textAlign: 'center', padding: 32, color: '#9CA3AF'}}>
          {templates.length === 0
            ? 'No saved templates yet. Generate one with AI and save it!'
            : 'No templates match your search.'}
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14}}>
          {filtered.map((template) => {
            const isSelected = selectedId === template.id;
            const colors = categoryColor(template.category);
            const sourceBadge = SOURCE_BADGES[template.sourceMode] ?? SOURCE_BADGES.manual;

            return (
              <div
                key={template.id}
                style={{
                  borderRadius: 12,
                  border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  background: '#fff',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onClick={() => onSelect(template.spec, template.id)}
              >
                {/* Preview area */}
                <div style={{
                  height: 100,
                  background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.border}22 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <span style={{fontSize: 28, fontWeight: 800, color: colors.text, opacity: 0.5}}>
                    {template.name.charAt(0).toUpperCase()}
                  </span>

                  {/* Source badge */}
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#fff',
                    color: sourceBadge.color,
                    fontSize: 10,
                    fontWeight: 600,
                    border: `1px solid ${sourceBadge.color}30`,
                  }}>
                    {sourceBadge.label}
                  </span>

                  {/* Category badge */}
                  <span style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: colors.bg,
                    color: colors.text,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}>
                    {template.category}
                  </span>

                  {/* Public indicator */}
                  {template.isPublic && (
                    <span style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      fontSize: 11,
                    }}>
                      🌐
                    </span>
                  )}
                </div>

                {/* Info area */}
                <div style={{padding: '10px 14px'}}>
                  <strong style={{fontSize: 14, color: '#111827', display: 'block'}}>
                    {template.name}
                  </strong>
                  {template.description && (
                    <p style={{fontSize: 12, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.4}}>
                      {template.description}
                    </p>
                  )}
                  <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 8}}>
                    <span style={{fontSize: 11, color: '#9CA3AF'}}>
                      Used {template.useCount}×
                    </span>
                    {template.tags.length > 0 && (
                      <span style={{fontSize: 11, color: '#9CA3AF'}}>
                        {template.tags.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{display: 'flex', gap: 6, marginTop: 8}} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(template.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #E5E7EB',
                        background: '#fff',
                        color: '#6B7280',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      {template.isPublic ? '🔒 Make Private' : '🌐 Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id, template.name)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#991B1B',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
