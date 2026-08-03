import type {RenderTemplatePayload, AudioConfig} from '../api/client';
import type {StylePresetCapability} from '@vary/shared/capabilities/types';
import {useRef, useState} from 'react';
import StylePresetPicker from './StylePresetPicker';
import {stylePresetToTemplatePatch} from '../utils/stylePresets';
import {apiClient} from '../api/client';

type BrandSettingsProps = {
  template: RenderTemplatePayload;
  onChange: (template: RenderTemplatePayload) => void;
  styles?: StylePresetCapability[];
  selectedStylePresetId?: string | null;
  onSelectStylePreset?: (styleId: string) => void;
  enableAudio?: boolean;
};

const backgroundTypes = ['solid', 'gradient', 'image'];

const stringValue = (template: RenderTemplatePayload, key: string, fallback = ''): string => {
  const value = template[key];
  return typeof value === 'string' ? value : fallback;
};

export default function BrandSettings({
  template,
  onChange,
  styles = [],
  selectedStylePresetId = null,
  onSelectStylePreset,
  enableAudio = false,
}: BrandSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const update = (key: string, value: string) => onChange({...template, [key]: value});
  const applyStylePreset = (style: StylePresetCapability) => {
    onSelectStylePreset?.(style.id);
    onChange({...template, ...stylePresetToTemplatePatch(style)});
  };

  const audioValue = (template.audio && typeof template.audio === 'object')
    ? template.audio as Partial<AudioConfig>
    : undefined;

  const updateAudio = (patch: Partial<AudioConfig>) => {
    onChange({
      ...template,
      audio: {
        volume: 0.3,
        fadeIn: 2,
        fadeOut: 2,
        loop: true,
        startOffset: 0,
        ...audioValue,
        ...patch,
      },
    });
  };

  const removeAudio = () => {
    const next = {...template};
    delete next.audio;
    onChange(next);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await apiClient.uploadAudio(file);
      updateAudio({src: uploaded.url});
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePreview = () => {
    if (!audioPreviewRef.current || !audioValue?.src) return;
    if (audioPreviewRef.current.paused) {
      audioPreviewRef.current.volume = audioValue.volume ?? 0.3;
      audioPreviewRef.current.currentTime = audioValue.startOffset ?? 0;
      audioPreviewRef.current.play();
    } else {
      audioPreviewRef.current.pause();
    }
  };
  const backgroundType = stringValue(template, 'backgroundType', 'gradient');
  const optionalMediaField = template.productImageUrl !== undefined
    ? {key: 'productImageUrl', label: 'Product image URL'}
    : template.propertyImageUrl !== undefined
      ? {key: 'propertyImageUrl', label: 'Property image URL'}
      : null;

  return (
    <div className="settings-grid">
      <div className="form-grid two-columns">
        <div className="wide-field">
          <StylePresetPicker
            styles={styles}
            selectedStylePresetId={selectedStylePresetId}
            onSelect={applyStylePreset}
          />
        </div>

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

      {enableAudio && (
        <div className="audio-settings">
          <h3>Background Audio</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            style={{display: 'none'}}
            onChange={handleFileSelect}
          />
          {audioValue?.src ? (
            <>
              <audio ref={audioPreviewRef} src={audioValue.src} preload="metadata" />
              <div className="audio-controls-grid">
                <label>
                  <span>Volume</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((audioValue.volume ?? 0.3) * 100)}
                    onChange={(e) => updateAudio({volume: Number(e.target.value) / 100})}
                  />
                  <span className="range-value">{Math.round((audioValue.volume ?? 0.3) * 100)}%</span>
                </label>
                <label>
                  <span>Fade in (s)</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.25"
                    value={audioValue.fadeIn ?? 2}
                    onChange={(e) => updateAudio({fadeIn: Number(e.target.value)})}
                  />
                  <span className="range-value">{audioValue.fadeIn ?? 2}s</span>
                </label>
                <label>
                  <span>Fade out (s)</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.25"
                    value={audioValue.fadeOut ?? 2}
                    onChange={(e) => updateAudio({fadeOut: Number(e.target.value)})}
                  />
                  <span className="range-value">{audioValue.fadeOut ?? 2}s</span>
                </label>
                <label>
                  <span>Loop</span>
                  <input
                    type="checkbox"
                    checked={audioValue.loop !== false}
                    onChange={(e) => updateAudio({loop: e.target.checked})}
                  />
                </label>
                <div className="audio-actions">
                  <button type="button" onClick={togglePreview}>Preview</button>
                  <button type="button" onClick={removeAudio}>Remove</button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}>Replace</button>
                </div>
              </div>
            </>
          ) : (
            <div className="audio-upload-empty">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Audio'}
              </button>
              {uploadError && <span className="inline-error">{uploadError}</span>}
              <p className="audio-hint">MP3, WAV, OGG, or M4A — max 20MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
