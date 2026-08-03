import type {StylePresetCapability} from '@vary/shared/capabilities/types';

type StylePresetPickerProps = {
  styles: StylePresetCapability[];
  selectedStylePresetId: string | null;
  onSelect: (style: StylePresetCapability) => void;
};

const fallbackColor = (value: string | undefined, fallback: string): string =>
  value ?? fallback;

export default function StylePresetPicker({
  styles,
  selectedStylePresetId,
  onSelect,
}: StylePresetPickerProps) {
  if (styles.length === 0) {
    return null;
  }

  return (
    <section className="style-preset-picker" aria-label="Style presets">
      <div className="compact-heading">
        <h3>Style Preset</h3>
        <p className="muted">Apply a palette without changing logos or media URLs.</p>
      </div>
      <div className="style-preset-grid">
        {styles.map((style) => {
          const colors = style.colors;
          const selected = selectedStylePresetId === style.id;

          return (
            <button
              key={style.id}
              type="button"
              className={selected ? 'style-preset-card selected' : 'style-preset-card'}
              onClick={() => onSelect(style)}
              aria-pressed={selected}
            >
              <span
                className="style-preset-preview"
                style={{
                  '--style-primary': fallbackColor(colors.primary, '#1A365D'),
                  '--style-secondary': fallbackColor(colors.secondary, '#3182CE'),
                  '--style-accent': fallbackColor(colors.accent, '#FF6B5B'),
                  '--style-background': fallbackColor(colors.background, '#F7FAFC'),
                } as React.CSSProperties}
              >
                <span />
                <span />
                <span />
              </span>
              <span className="style-preset-copy">
                <strong>{style.name}</strong>
                <small>{style.description}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
