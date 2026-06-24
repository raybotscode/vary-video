import type {RenderTemplatePayload} from '../api/client';

type BrandSettingsProps = {
  template: RenderTemplatePayload;
  onChange: (template: RenderTemplatePayload) => void;
};

const backgroundTypes = ['solid', 'gradient', 'image'];

const stringValue = (template: RenderTemplatePayload, key: string, fallback = ''): string => {
  const value = template[key];
  return typeof value === 'string' ? value : fallback;
};

export default function BrandSettings({template, onChange}: BrandSettingsProps) {
  const update = (key: string, value: string) => onChange({...template, [key]: value});
  const backgroundType = stringValue(template, 'backgroundType', 'gradient');
  const optionalMediaField = template.productImageUrl !== undefined
    ? {key: 'productImageUrl', label: 'Product image URL'}
    : template.propertyImageUrl !== undefined
      ? {key: 'propertyImageUrl', label: 'Property image URL'}
      : null;

  return (
    <div className="settings-grid">
      <div className="form-grid two-columns">
        <label>
          <span>Brand colour</span>
          <div className="color-input-row">
            <input
              aria-label="Brand colour picker"
              type="color"
              value={stringValue(template, 'brandColor', '#1A365D')}
              onChange={(event) => update('brandColor', event.target.value)}
            />
            <input
              type="text"
              value={stringValue(template, 'brandColor', '#1A365D')}
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
              value={stringValue(template, 'secondaryColor', '#3182CE')}
              onChange={(event) => update('secondaryColor', event.target.value)}
            />
            <input
              type="text"
              value={stringValue(template, 'secondaryColor', '#3182CE')}
              onChange={(event) => update('secondaryColor', event.target.value)}
            />
          </div>
        </label>

        {template.accentColor !== undefined && (
          <label>
            <span>Accent colour</span>
            <div className="color-input-row">
              <input
                aria-label="Accent colour picker"
                type="color"
                value={stringValue(template, 'accentColor', '#FF6B5B')}
                onChange={(event) => update('accentColor', event.target.value)}
              />
              <input
                type="text"
                value={stringValue(template, 'accentColor', '#FF6B5B')}
                onChange={(event) => update('accentColor', event.target.value)}
              />
            </div>
          </label>
        )}

        <label>
          <span>Background type</span>
          <select
            value={backgroundType}
            onChange={(event) => update('backgroundType', event.target.value)}
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
            value={stringValue(template, 'backgroundColor', '#1A365D')}
            onChange={(event) => update('backgroundColor', event.target.value)}
          />
        </label>

        <label className="wide-field">
          <span>Logo URL</span>
          <input
            type="url"
            placeholder="https://example.com/logo.svg"
            value={stringValue(template, 'logoUrl')}
            onChange={(event) => update('logoUrl', event.target.value)}
          />
        </label>

        {backgroundType === 'image' && (
          <label className="wide-field">
            <span>Background image URL</span>
            <input
              type="url"
              placeholder="https://example.com/background.jpg"
              value={stringValue(template, 'backgroundImageUrl')}
              onChange={(event) => update('backgroundImageUrl', event.target.value)}
            />
          </label>
        )}

        {optionalMediaField && (
          <label className="wide-field">
            <span>{optionalMediaField.label}</span>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={stringValue(template, optionalMediaField.key)}
              onChange={(event) => update(optionalMediaField.key, event.target.value)}
            />
          </label>
        )}
      </div>

      <div
        className="brand-preview"
        style={{
          '--preview-primary': stringValue(template, 'brandColor', '#1A365D'),
          '--preview-secondary': stringValue(template, 'secondaryColor', '#3182CE'),
          '--preview-background': stringValue(template, 'backgroundColor', '#1A365D'),
        } as React.CSSProperties}
      >
        <div className="brand-preview-topline" />
        <strong>Sample ad frame</strong>
        <p>Brand colors update this preview in real time.</p>
        <span>{stringValue(template, 'ctaText', 'Get Started')}</span>
      </div>
    </div>
  );
}
