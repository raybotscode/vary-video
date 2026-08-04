import {useState} from 'react';
import {useDebouncedPreview} from '../hooks/useDebouncedPreview';
import type {RenderTemplatePayload} from '../api/client';

type PreviewPanelProps = {
  template: RenderTemplatePayload;
  compositionId?: string;
  variant?: Record<string, string>;
  enabled?: boolean;
};

export default function PreviewPanel({
  template,
  compositionId,
  variant,
  enabled = true,
}: PreviewPanelProps) {
  const [scale, setScale] = useState<'full' | 'medium' | 'fast'>('medium');
  const {imageUrl, loading, error, refresh} = useDebouncedPreview({
    template,
    compositionId,
    variant,
    enabled,
    scale,
  });

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Preview</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as 'full' | 'medium' | 'fast')}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #E5E7EB',
              fontSize: 12,
              background: '#F9FAFB',
              color: '#374151',
            }}
            disabled={loading}
            title="Preview quality"
          >
            <option value="fast">Fast (480px)</option>
            <option value="medium">Medium (720px)</option>
            <option value="full">Full (1920px)</option>
          </select>
          <button
            type="button"
            className="preview-refresh-btn"
            onClick={refresh}
            disabled={loading}
            title="Refresh preview"
          >
            {loading ? '…' : '↻'}
          </button>
        </div>
      </div>

      <div className="preview-frame">
        {loading && !imageUrl && (
          <div className="preview-placeholder">
            <div className="preview-spinner" />
            <span>Rendering preview…</span>
          </div>
        )}

        {error && (
          <div className="preview-placeholder preview-error">
            <span style={{fontSize: 14, fontWeight: 600}}>Preview unavailable</span>
            <span className="preview-error-detail" style={{fontSize: 12, color: '#9CA3AF', maxWidth: 280, textAlign: 'center'}}>
              {error}
            </span>
            <button
              type="button"
              onClick={refresh}
              style={{
                marginTop: 8,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              ↻ Retry
            </button>
          </div>
        )}

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Video preview — frame 0"
            className={`preview-image ${loading ? 'preview-image-loading' : ''} ${error ? 'preview-image-stale' : ''}`}
          />
        )}
      </div>

      <p className="preview-hint">
        {scale === 'fast' ? 'Quick preview (480px)' : scale === 'full' ? 'Full resolution preview' : 'Medium preview (720px)'}. Final render will be full quality.
      </p>
    </div>
  );
}
