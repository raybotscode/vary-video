import type {RenderStatus} from '../api/client';
import {apiClient} from '../api/client';

// Same logic as api/client.ts to resolve the API base URL
const apiBase =
  (typeof window !== 'undefined' && (window as any).__VARY_API_URL) ||
  import.meta.env.VITE_API_URL ||
  '/api';

type RenderProgressProps = {
  status: RenderStatus | null;
  jobId: string | null;
  variantCount: number;
  estimatedTimeSeconds: number | null;
};

const formatSeconds = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export default function RenderProgress({
  status,
  jobId,
  variantCount,
  estimatedTimeSeconds,
}: RenderProgressProps) {
  if (!jobId) {
    return null;
  }

  const progress = status?.progress ?? 0;
  const completed = status?.completedVariants ?? 0;
  const total = status?.totalVariants ?? variantCount;
  const remaining = estimatedTimeSeconds
    ? Math.max(0, Math.round(estimatedTimeSeconds * (1 - progress / 100)))
    : null;

  const formats = status?.formats ?? ['16:9'];
  const labelFor = (i: number): string => {
    if (status?.downloadLabels && status.downloadLabels[i]) {
      return status.downloadLabels[i];
    }
    const fi = i % formats.length;
    const vi = Math.floor(i / formats.length);
    const fmt = formats[fi];
    return `Variant ${vi + 1} — ${fmt}`;
  };

  return (
    <section className="render-progress" aria-live="polite">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Active render</p>
          <h2>Render Progress</h2>
        </div>
        <span className={`status-pill ${status?.status ?? 'queued'}`}>
          {status?.status ?? 'queued'}
        </span>
      </div>

      <div className="progress-bar" aria-label="Overall render progress">
        <span style={{width: `${progress}%`}} />
      </div>

      <div className="progress-meta">
        <span>{completed} of {total} completed</span>
        <span>{progress}%</span>
        {remaining !== null && status?.status !== 'completed' && (
          <span>{formatSeconds(remaining)} remaining</span>
        )}
      </div>

      <div className="variant-progress-list">
        {status?.downloads && status.downloads.length > 0
          ? status.downloads.map((url, i) => (
              <div key={i} className="variant-progress-row">
                <span className="download-label">{labelFor(i)}</span>
                <span className="download-badge completed">Ready</span>
                <a href={url} download className="download-link">Download MP4</a>
              </div>
            ))
          : Array.from({length: variantCount}).map((_, vi) => (
              <div key={vi} className="variant-progress-row">
                <span>Variant {vi + 1}</span>
                <div className="mini-progress">
                  <span
                    style={{
                      width: `${
                        status?.status === 'completed'
                          ? 100
                          : vi < completed
                            ? 100
                            : vi === completed
                              ? progress % Math.max(1, Math.round(100 / variantCount))
                              : 0
                      }%`,
                    }}
                  />
                </div>
                <span>
                  {status?.status === 'completed'
                    ? '100%'
                    : vi < completed
                      ? '100%'
                      : `${Math.round(
                          vi === completed
                            ? progress % Math.max(1, Math.round(100 / variantCount))
                            : 0,
                        )}%`}
                </span>
              </div>
            ))}
      </div>

      {status?.status === 'completed' && (
        <div className="completion-actions">
          <a
            className="primary-button zip-button"
            href={apiClient.getZipDownloadUrl(jobId)}
            download
          >
            Download All as ZIP
          </a>
        </div>
      )}

      {status?.status === 'failed' && status.error && (
        <div className="inline-error">{status.error}</div>
      )}
    </section>
  );
}
