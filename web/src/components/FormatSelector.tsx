import type {OutputFormat} from '../api/client';

type FormatSelectorProps = {
  formats: OutputFormat[];
  onChange: (formats: OutputFormat[]) => void;
};

const allFormats: Array<{id: OutputFormat; label: string; desc: string; res: string}> = [
  {id: '16:9', label: 'Landscape 16:9', desc: 'Horizontal widescreen', res: '1920×1080'},
  {id: '9:16', label: 'Portrait 9:16', desc: 'Vertical for Stories / Reels / Shorts', res: '1080×1920'},
  {id: '1:1', label: 'Square 1:1', desc: 'Social feed posts', res: '1080×1080'},
];

export default function FormatSelector({formats, onChange}: FormatSelectorProps) {
  const toggle = (formatId: OutputFormat) => {
    const next = formats.includes(formatId)
      ? formats.filter((f) => f !== formatId)
      : [...formats, formatId];

    // Ensure at least one format is selected
    if (next.length === 0) {
      return;
    }

    onChange(next);
  };

  return (
    <div className="format-grid">
      {allFormats.map((format) => (
        <label
          key={format.id}
          className={`format-chip${formats.includes(format.id) ? ' selected' : ''}`}
        >
          <input
            type="checkbox"
            checked={formats.includes(format.id)}
            onChange={() => toggle(format.id)}
          />
          <span className="format-label">{format.label}</span>
          <span className="format-desc">{format.desc}</span>
          <span className="format-res">{format.res}</span>
        </label>
      ))}
    </div>
  );
}
