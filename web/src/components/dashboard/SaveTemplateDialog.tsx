import {useState} from 'react';
import {apiClient, type UserTemplate} from '../../api/client';

type SaveTemplateDialogProps = {
  spec: Record<string, unknown>;
  sourcePrompt?: string;
  sourceMode?: 'reused' | 'composed';
  baseTemplateId?: string | null;
  onSave: (template: UserTemplate) => void;
  onCancel: () => void;
};

const CATEGORIES = [
  {value: 'product', label: 'Product'},
  {value: 'ad', label: 'Advertisement'},
  {value: 'social', label: 'Social Media'},
  {value: 'property', label: 'Property'},
] as const;

export default function SaveTemplateDialog({
  spec,
  sourcePrompt = '',
  sourceMode = 'manual',
  baseTemplateId = null,
  onSave,
  onCancel,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('product');
  const [isPublic, setIsPublic] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Give your template a name.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const result = await apiClient.saveUserTemplate({
        name: name.trim(),
        description: description.trim(),
        category,
        spec,
        sourcePrompt,
        sourceMode,
        baseTemplateId,
        isPublic,
        tags,
      });

      onSave(result.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div>
          <h2 style={{margin: 0, fontSize: 20, fontWeight: 700, color: '#111827'}}>
            💾 Save as Template
          </h2>
          <p style={{margin: '6px 0 0', fontSize: 14, color: '#6B7280'}}>
            Save this AI-generated template to your library for reuse.
          </p>
        </div>

        {/* Name */}
        <div>
          <label style={{display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6}}>
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. SaaS Product Launch — Blue Theme"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6}}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this template good for?"
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6}}>
            Category
          </label>
          <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: category === cat.value ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  background: category === cat.value ? '#EFF6FF' : '#fff',
                  color: category === cat.value ? '#1D4ED8' : '#6B7280',
                  fontSize: 13,
                  fontWeight: category === cat.value ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label style={{display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6}}>
            Tags <span style={{fontWeight: 400, color: '#9CA3AF'}}>(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. saas, launch, modern"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Public toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            fontSize: 14,
            color: '#374151',
          }}
        >
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            style={{width: 18, height: 18, cursor: 'pointer'}}
          />
          <span>
            <strong>Share publicly</strong>
            <br />
            <span style={{fontSize: 12, color: '#9CA3AF'}}>
              Other users will be able to find and use this template
            </span>
          </span>
        </label>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: '#FEF2F2',
              color: '#991B1B',
              fontSize: 13,
              border: '1px solid #FECACA',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: isSaving ? '#93C5FD' : '#3B82F6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: isSaving ? 'wait' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {isSaving ? 'Saving…' : '💾 Save Template'}
          </button>
        </div>

        <p style={{fontSize: 12, color: '#9CA3AF', textAlign: 'center', margin: 0}}>
          <kbd style={{padding: '2px 6px', borderRadius: 4, background: '#F3F4F6', fontSize: 11}}>⌘</kbd>
          +
          <kbd style={{padding: '2px 6px', borderRadius: 4, background: '#F3F4F6', fontSize: 11}}>Enter</kbd>
          {' '}to save
        </p>
      </div>
    </div>
  );
}
