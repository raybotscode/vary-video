/**
 * ElementToolbar — floating toolbar above the selected element.
 * Shows color swatches and font size +/- controls.
 */

type ElementToolbarProps = {
  isVisible: boolean;
  currentColor: string;
  currentFontSize: number; // display-scaled
  onColorChange: (color: string) => void;
  onFontSizeChange: (delta: number) => void; // +/- in 1920-scale pixels
};

export default function ElementToolbar({
  isVisible,
  currentColor,
  currentFontSize,
  onColorChange,
  onFontSizeChange,
}: ElementToolbarProps) {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: -48,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        border: '1px solid #E5E7EB',
        zIndex: 30,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Color swatches */}
      {['#1A365D', '#3182CE', '#38A169', '#D69E2E', '#DD6B20', '#E53E3E', '#9F7AEA', '#FFFFFF', '#000000'].map(
        (color) => (
          <button
            key={color}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onColorChange(color);
            }}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              border:
                currentColor === color
                  ? '2px solid #3B82F6'
                  : '1px solid #E5E7EB',
              background: color,
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          />
        ),
      )}

      {/* Divider */}
      <div style={{width: 1, height: 20, background: '#E5E7EB', margin: '0 4px'}} />

      {/* Font size controls */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFontSizeChange(-4);
        }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          border: '1px solid #E5E7EB',
          background: '#F9FAFB',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          color: '#374151',
        }}
      >
        −
      </button>
      <span
        style={{
          fontSize: 11,
          color: '#6B7280',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
          textAlign: 'center',
        }}
      >
        {currentFontSize}px
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onFontSizeChange(4);
        }}
        style={{
          width: 24,
          height: 24,
          borderRadius: 4,
          border: '1px solid #E5E7EB',
          background: '#F9FAFB',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          color: '#374151',
        }}
      >
        +
      </button>

      {/* Arrow pointing down */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #fff',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
        }}
      />
    </div>
  );
}
