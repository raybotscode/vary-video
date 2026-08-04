import {Component, type ReactNode, Suspense, lazy} from 'react';

// ─── Error Boundary ────────────────────────────────────────────────

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
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

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Lazy-loaded Player ────────────────────────────────────────────

const RemotionPlayerInner = lazy(() => import('./RemotionPlayerPreview'));

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

// ─── Error fallback ────────────────────────────────────────────────

function PlayerError() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        background: '#FEF2F2',
        borderRadius: 12,
        border: '1px solid #FECACA',
        gap: 12,
      }}
    >
      <span style={{fontSize: 24}}>⚠️</span>
      <span style={{fontSize: 14, color: '#991B1B', fontWeight: 600}}>
        Video preview failed to load
      </span>
      <span style={{fontSize: 13, color: '#6B7280'}}>
        The video renderer is unavailable. You can still batch render normally.
      </span>
    </div>
  );
}

// ─── Exported wrapper ──────────────────────────────────────────────

type SafePlayerPreviewProps = {
  blocks: import('../../utils/blocks').ComposerBlock[];
  template: import('../../api/client').RenderTemplatePayload;
  variant: import('../../utils/placeholder').VariantData;
  onVariantChange?: (updated: import('../../utils/placeholder').VariantData) => void;
  onFrameChange?: (frame: number) => void;
};

export default function SafePlayerPreview(props: SafePlayerPreviewProps) {
  return (
    <PlayerErrorBoundary fallback={<PlayerError />}>
      <Suspense fallback={<PlayerLoading />}>
        <RemotionPlayerInner {...props} />
      </Suspense>
    </PlayerErrorBoundary>
  );
}
