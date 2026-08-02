type LoadingStateProps = {
  label?: string;
};

/** Small loading placeholder for async sections. */
export default function LoadingState({label = 'Loading...'}: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
