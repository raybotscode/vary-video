import {useCallback, useEffect, useState} from 'react';
import {
  apiClient,
  resolveApiDownloadUrl,
  type RenderListItem,
  type RenderDetail,
} from '../api/client';
import EmptyState from '../components/ui/EmptyState';

type FilterStatus = 'all' | 'completed' | 'rendering' | 'failed';

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  rendering: 'Rendering',
  completed: 'Completed',
  failed: 'Failed',
};

const STATUS_CLASSES: Record<string, string> = {
  queued: 'status-queued',
  rendering: 'status-rendering',
  completed: 'status-completed',
  failed: 'status-failed',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

export default function RenderHistory() {
  const [renders, setRenders] = useState<RenderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RenderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = filter === 'all' ? undefined : filter;
      const data = await apiClient.listRenders({status: statusParam, limit: 50});
      setRenders(data.renders);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load renders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRenders();
  }, [fetchRenders]);

  // Auto-refresh every 10s if any jobs are in-progress
  useEffect(() => {
    const hasActive = renders.some((r) => r.status === 'queued' || r.status === 'rendering');
    if (!hasActive) return;

    const interval = setInterval(fetchRenders, 10_000);
    return () => clearInterval(interval);
  }, [renders, fetchRenders]);

  const loadDetail = async (jobId: string) => {
    setSelectedId(jobId);
    setDetailLoading(true);
    try {
      const data = await apiClient.getRenderDetail(jobId);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load render detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!window.confirm('Delete this render and its files? This cannot be undone.')) return;
    setDeleting(jobId);
    try {
      await apiClient.deleteRender(jobId);
      setRenders((prev) => prev.filter((r) => r.id !== jobId));
      setTotal((prev) => prev - 1);
      if (selectedId === jobId) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete render');
    } finally {
      setDeleting(null);
    }
  };

  const filters: {key: FilterStatus; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'completed', label: 'Completed'},
    {key: 'rendering', label: 'In Progress'},
    {key: 'failed', label: 'Failed'},
  ];

  return (
    <section className="page-section">
      <div className="page-title">
        <p className="eyebrow">Renders</p>
        <h1>My Renders</h1>
        <p>Browse and download past render jobs. History persists across API restarts.</p>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {/* Filter tabs */}
      <div className="renders-filter-bar" role="tablist" aria-label="Filter renders by status">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? 'mode-button active' : 'mode-button'}
            onClick={() => setFilter(f.key)}
            role="tab"
            aria-selected={filter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div className="renders-loading">Loading renders…</div>}

      {/* Empty state */}
      {!loading && renders.length === 0 && (
        <EmptyState
          title="No render history yet"
          description={
            filter === 'all'
              ? 'Start a batch render and your completed jobs will appear here.'
              : `No ${filter} renders found.`
          }
          action={
            <a href="/dashboard" className="primary-button" style={{marginTop: 12}}>
              Go to Dashboard
            </a>
          }
        />
      )}

      {/* Render list */}
      {!loading && renders.length > 0 && (
        <>
          <p className="renders-count">{total} render{total !== 1 ? 's' : ''}</p>
          <div className="renders-list">
            {renders.map((render) => (
              <div
                key={render.id}
                className={`render-card ${selectedId === render.id ? 'selected' : ''}`}
              >
                <button
                  type="button"
                  className="render-card-main"
                  onClick={() => loadDetail(render.id)}
                >
                  <div className="render-card-header">
                    <span className={`status-pill ${STATUS_CLASSES[render.status]}`}>
                      {STATUS_LABELS[render.status]}
                    </span>
                    <span className="render-card-time">
                      {formatRelativeTime(render.createdAt)}
                    </span>
                  </div>
                  <div className="render-card-body">
                    <strong>{render.compositionId}</strong>
                    <span className="render-card-meta">
                      {render.totalVariants} variant{render.totalVariants !== 1 ? 's' : ''}
                      {' · '}
                      {render.formats.join(', ')}
                      {render.downloadCount > 0 && (
                        <> · {render.downloadCount} file{render.downloadCount !== 1 ? 's' : ''}</>
                      )}
                    </span>
                  </div>
                </button>
                <div className="render-card-actions">
                  <button
                    type="button"
                    className="ghost-button small"
                    onClick={() => handleDelete(render.id)}
                    disabled={deleting === render.id}
                    aria-label={`Delete render ${render.id}`}
                  >
                    {deleting === render.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail panel */}
      {selectedId && (
        <div className="render-detail-panel" role="dialog" aria-label="Render details">
          {detailLoading && <div className="renders-loading">Loading details…</div>}
          {detail && !detailLoading && (
            <>
              <div className="render-detail-header">
                <div>
                  <p className="eyebrow">Render Detail</p>
                  <h2>{detail.compositionId}</h2>
                  <p className="render-detail-id">{detail.id}</p>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => { setSelectedId(null); setDetail(null); }}
                >
                  Close
                </button>
              </div>

              <div className="render-detail-meta">
                <span className={`status-pill ${STATUS_CLASSES[detail.status]}`}>
                  {STATUS_LABELS[detail.status]}
                </span>
                <span>{detail.completedVariants} of {detail.totalVariants} completed</span>
                <span>Created {formatRelativeTime(detail.createdAt)}</span>
                {detail.formats && <span>Formats: {detail.formats.join(', ')}</span>}
              </div>

              {detail.error && (
                <div className="inline-error">{detail.error}</div>
              )}

              {detail.downloads.length > 0 && (
                <div className="render-detail-downloads">
                  <h3>Downloads</h3>
                  {detail.downloads.map((dl) => (
                    <div key={dl.variantIndex} className="variant-progress-row">
                      <span className="download-label">{dl.label}</span>
                      <a
                        href={resolveApiDownloadUrl(dl.downloadUrl)}
                        download
                        className="download-link"
                      >
                        Download MP4
                      </a>
                    </div>
                  ))}
                  {detail.status === 'completed' && (
                    <a
                      className="primary-button zip-button"
                      href={apiClient.getZipDownloadUrl(detail.id)}
                      download
                      style={{marginTop: 16}}
                    >
                      Download All as ZIP
                    </a>
                  )}
                </div>
              )}

              <div className="render-detail-actions">
                <button
                  type="button"
                  className="ghost-button danger"
                  onClick={() => handleDelete(detail.id)}
                  disabled={deleting === detail.id}
                >
                  Delete Render
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
