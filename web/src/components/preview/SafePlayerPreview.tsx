import {Component, type ReactNode, Suspense, lazy} from 'react';

// ─── Error Boundary that passes error to fallback ─────────────────

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: (error: Error | null) => ReactNode;
  label: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class PlayerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {hasError: false, error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.label}] Caught:`, error.message);
    console.error(`[${this.props.label}] Stack:`, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

// ─── Lazy-loaded components ────────────────────────────────────────

const RemotionPlayerInner = lazy(() => import('./RemotionPlayerPreview'));
const MinimalPlayerInner = lazy(() => import('./MinimalPlayerTest'));

// ─── Loading state ─────────────────────────────────────────────────

function PlayerLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        background: '#F9FAFB',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
      }}
    >
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #E5E7EB',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{fontSize: 14, color: '#6B7280'}}>Loading video preview…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── Error card with actual error details ──────────────────────────

function ErrorCard({title, error}: {title: string; error: Error | null}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        minHeight: 200,
        background: '#FEF2F2',
        borderRadius: 12,
        border: '1px solid #FECACA',
        gap: 8,
        padding: 20,
      }}
    >
      <span style={{fontSize: 18}}>⚠️</span>
      <span style={{fontSize: 14, color: '#991B1B', fontWeight: 600}}>
        {title}
      </span>
      {error && (
        <pre
          style={{
            fontSize: 11,
            color: '#7F1D1D',
            background: '#FEE2E2',
            padding: 12,
            borderRadius: 8,
            overflow: 'auto',
            maxHeight: 200,
            width: '100%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            fontFamily: 'monospace',
            boxSizing: 'border-box',
          }}
        >
          {error.message}
          {error.stack ? '\n\n' + error.stack : ''}
        </pre>
      )}
      <span style={{fontSize: 12, color: '#6B7280'}}>
        Batch rendering will still work normally.
      </span>
    </div>
  );
}

// ─── Main wrapper: try full → try minimal → show error ─────────────

type SafePlayerPreviewProps = {
  blocks: import('../../utils/blocks').ComposerBlock[];
  template: import('../../api/client').RenderTemplatePayload;
  variant: import('../../utils/placeholder').VariantData;
  onVariantChange?: (updated: import('../../utils/placeholder').VariantData) => void;
  onBlockLayoutChange?: (blockInstanceId: string, fieldKey: string, layout: import('@vary/shared/capabilities/types').ElementLayout) => void;
  onFrameChange?: (frame: number) => void;
};

export default function SafePlayerPreview(props: SafePlayerPreviewProps) {
  return (
    <PlayerErrorBoundary
      label="FullPlayer"
      fallback={(fullError) => (
        // Full Player failed — try minimal test
        <PlayerErrorBoundary
          label="MinimalTest"
          fallback={(minimalError) => (
            // Both failed — show the actual error from whichever we prefer
            <ErrorCard
              title="Video preview failed"
              error={fullError ?? minimalError}
            />
          )}
        >
          <Suspense fallback={<PlayerLoading />}>
            <MinimalPlayerInner />
          </Suspense>
        </PlayerErrorBoundary>
      )}
    >
      <Suspense fallback={<PlayerLoading />}>
        <RemotionPlayerInner {...props} />
      </Suspense>
    </PlayerErrorBoundary>
  );
}
