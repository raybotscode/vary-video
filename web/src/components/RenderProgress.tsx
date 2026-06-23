import type {RenderStatus} from '../api/client';

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
        {Array.from({length: total}).map((_, index) => {
          const isComplete = status?.downloads[index] || status?.status === 'completed';
          const variantProgress =
            status?.status === 'completed' || (status && index < completed)
              ? 100
              : index === completed
                ? progress % Math.max(1, Math.round(100 / total))
                : 0;

          return (
            <div key={index} className="variant-progress-row">
              <span>Variant {index + 1}</span>
              <div className="mini-progress">
                <span style={{width: `${isComplete ? 100 : variantProgress}%`}} />
              </div>
              {isComplete ? (
                <a href={`/api/render/download/${jobId}/${index}`}>Download MP4</a>
              ) : (
                <span>{Math.round(isComplete ? 100 : variantProgress)}%</span>
              )}
            </div>
          );
        })}
      </div>

      {status?.status === 'completed' && (
        <div className="completion-note">
          <p>ZIP download is not implemented by the API yet. Download individual MP4 files above.</p>
        </div>
      )}

      {status?.status === 'failed' && status.error && (
        <div className="inline-error">{status.error}</div>
      )}
    </section>
  );
}
