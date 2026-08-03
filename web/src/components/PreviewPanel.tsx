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
  const {imageUrl, loading, error, refresh} = useDebouncedPreview({
    template,
    compositionId,
    variant,
    enabled,
  });

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <h3>Preview</h3>
        <span className="preview-label">frame 0</span>
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

      <div className="preview-frame">
        {loading && !imageUrl && (
          <div className="preview-placeholder">
            <div className="preview-spinner" />
            <span>Rendering preview…</span>
          </div>
        )}

        {error && (
          <div className="preview-placeholder preview-error">
            <span>Preview unavailable</span>
            <span className="preview-error-detail">{error}</span>
            <button type="button" onClick={refresh}>Retry</button>
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
        Low-resolution preview of frame 0. Final render will be full quality.
      </p>
    </div>
  );
}
