import type {TemplatePayload} from '../api/client';

type BrandSettingsProps = {
  template: TemplatePayload;
  onChange: (template: TemplatePayload) => void;
};

const backgroundTypes: TemplatePayload['backgroundType'][] = ['solid', 'gradient', 'image'];

export default function BrandSettings({template, onChange}: BrandSettingsProps) {
  const update = <Key extends keyof TemplatePayload>(
    key: Key,
    value: TemplatePayload[Key],
  ) => onChange({...template, [key]: value});

  return (
    <div className="settings-grid">
      <div className="form-grid two-columns">
        <label>
          <span>Brand colour</span>
          <div className="color-input-row">
            <input
              aria-label="Brand colour picker"
              type="color"
              value={template.brandColor}
              onChange={(event) => update('brandColor', event.target.value)}
            />
            <input
              type="text"
              value={template.brandColor}
              onChange={(event) => update('brandColor', event.target.value)}
            />
          </div>
        </label>

        <label>
          <span>Secondary colour</span>
          <div className="color-input-row">
            <input
              aria-label="Secondary colour picker"
              type="color"
              value={template.secondaryColor}
              onChange={(event) => update('secondaryColor', event.target.value)}
            />
            <input
              type="text"
              value={template.secondaryColor}
              onChange={(event) => update('secondaryColor', event.target.value)}
            />
          </div>
        </label>

        <label>
          <span>Background type</span>
          <select
            value={template.backgroundType}
            onChange={(event) =>
              update('backgroundType', event.target.value as TemplatePayload['backgroundType'])
            }
          >
            {backgroundTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Background colour</span>
          <input
            type="text"
            value={template.backgroundColor}
            onChange={(event) => update('backgroundColor', event.target.value)}
          />
        </label>

        <label className="wide-field">
          <span>Logo URL</span>
          <input
            type="url"
            placeholder="https://example.com/logo.svg"
            value={template.logoUrl}
            onChange={(event) => update('logoUrl', event.target.value)}
          />
        </label>

        {template.backgroundType === 'image' && (
          <label className="wide-field">
            <span>Background image URL</span>
            <input
              type="url"
              placeholder="https://example.com/background.jpg"
              value={template.backgroundImageUrl ?? ''}
              onChange={(event) => update('backgroundImageUrl', event.target.value)}
            />
          </label>
        )}
      </div>

      <div
        className="brand-preview"
        style={{
          '--preview-primary': template.brandColor,
          '--preview-secondary': template.secondaryColor,
          '--preview-background': template.backgroundColor,
        } as React.CSSProperties}
      >
        <div className="brand-preview-topline" />
        <strong>Sample ad frame</strong>
        <p>Brand colors update this preview in real time.</p>
        <span>Get a Quote Today</span>
      </div>
    </div>
  );
}
