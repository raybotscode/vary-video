type RenderSummaryProps = {
  templateLabel: string;
  isComposer: boolean;
  blockCount: number;
  variantCount: number;
  formats: string[];
  estimatedMinutes: number;
  isSubmitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
};

/**
 * Output summary + render action. Used in the main workflow section
 * (Step 6) and shared by the mobile action bar.
 */
export default function RenderSummary({
  templateLabel,
  isComposer,
  blockCount,
  variantCount,
  formats,
  estimatedMinutes,
  isSubmitting,
  disabled,
  onSubmit,
}: RenderSummaryProps) {
  const totalOutputs = variantCount * formats.length;

  return (
    <>
      <div className="summary-grid">
        <div>
          <span>{isComposer ? 'Composition' : 'Template'}</span>
          <strong>{isComposer ? 'Scene Composer' : templateLabel}</strong>
        </div>
        {isComposer && (
          <div>
            <span>Blocks</span>
            <strong>{blockCount}</strong>
          </div>
        )}
        <div>
          <span>Variants</span>
          <strong>{variantCount}</strong>
        </div>
        <div>
          <span>Formats</span>
          <strong>{formats.join(', ')}</strong>
        </div>
        <div>
          <span>Total outputs</span>
          <strong>{totalOutputs}</strong>
        </div>
        <div>
          <span>Estimated render time</span>
          <strong>{estimatedMinutes} min</strong>
        </div>
      </div>

      <button
        className="primary-button generate-button"
        type="button"
        onClick={onSubmit}
        disabled={disabled}
      >
        {isSubmitting ? 'Starting Render...' : 'Generate All Variants'}
      </button>
    </>
  );
}
