type MobileActionBarProps = {
  variantCount: number;
  formatCount: number;
  isSubmitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
};

/**
 * Sticky bottom action bar for small viewports (≤768px):
 * output count + validation status + render button.
 * Desktop hides this; the in-flow RenderSummary button is used instead.
 */
export default function MobileActionBar({
  variantCount,
  formatCount,
  isSubmitting,
  disabled,
  onSubmit,
}: MobileActionBarProps) {
  const totalOutputs = variantCount * formatCount;

  return (
    <div className="mobile-action-bar" aria-label="Render actions">
      <div className="mobile-action-summary">
        <strong>{totalOutputs}</strong>
        <span>output{totalOutputs === 1 ? '' : 's'}</span>
        {disabled && <em className="mobile-action-warning">needs data</em>}
      </div>
      <button
        className="primary-button mobile-action-button"
        type="button"
        onClick={onSubmit}
        disabled={disabled}
      >
        {isSubmitting ? 'Rendering...' : `Render ${totalOutputs} video${totalOutputs === 1 ? '' : 's'}`}
      </button>
    </div>
  );
}
