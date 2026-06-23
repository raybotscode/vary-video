import {useRef, useState, type ChangeEvent, type RefObject} from 'react';
import type {Composition, TemplatePayload} from '../api/client';
import {insertPlaceholder, resolvePlaceholders, type VariantData} from '../utils/placeholder';
import PlaceholderHelp from './PlaceholderHelp';

type TemplateFormProps = {
  compositions: Composition[];
  selectedCompositionId: string;
  onSelectComposition: (id: string) => void;
  template: TemplatePayload;
  onTemplateChange: (template: TemplatePayload) => void;
  previewVariant: VariantData;
};

type CopyField = 'headlineTemplate' | 'subheadlineTemplate' | 'ctaText';

const fieldLabels: Record<CopyField, string> = {
  headlineTemplate: 'Headline',
  subheadlineTemplate: 'Subheadline',
  ctaText: 'Call to Action',
};

export default function TemplateForm({
  compositions,
  selectedCompositionId,
  onSelectComposition,
  template,
  onTemplateChange,
  previewVariant,
}: TemplateFormProps) {
  const [activeField, setActiveField] = useState<CopyField>('headlineTemplate');
  const refs: Record<CopyField, RefObject<HTMLInputElement | null>> = {
    headlineTemplate: useRef<HTMLInputElement>(null),
    subheadlineTemplate: useRef<HTMLInputElement>(null),
    ctaText: useRef<HTMLInputElement>(null),
  };

  const updateTemplate = <Key extends keyof TemplatePayload>(
    key: Key,
    value: TemplatePayload[Key],
  ) => onTemplateChange({...template, [key]: value});

  const insertIntoActiveField = (placeholder: string) => {
    const input = refs[activeField].current;
    const value = template[activeField];
    const nextValue = insertPlaceholder(
      value,
      placeholder,
      input?.selectionStart ?? null,
      input?.selectionEnd ?? null,
    );

    updateTemplate(activeField, nextValue);
    requestAnimationFrame(() => refs[activeField].current?.focus());
  };

  const onCopyChange =
    (field: CopyField) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      updateTemplate(field, event.target.value);

  return (
    <div className="stack">
      <section className="step-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2>Choose a Template</h2>
          </div>
        </div>

        <div className="template-grid">
          {(compositions.length > 0
            ? compositions
            : [{id: 'InsuranceAd', durationInFrames: 450, fps: 30, width: 1920, height: 1080}]
          ).map((composition) => (
            <button
              key={composition.id}
              type="button"
              className={
                selectedCompositionId === composition.id ? 'template-card selected' : 'template-card'
              }
              onClick={() => onSelectComposition(composition.id)}
            >
              <span className="template-thumbnail">
                <span>16:9</span>
              </span>
              <strong>{composition.id === 'InsuranceAd' ? 'Insurance Ad' : composition.id}</strong>
              <p>Personalized copy, brand styling, and dynamic audience details.</p>
            </button>
          ))}
        </div>
      </section>

      {selectedCompositionId && (
        <section className="step-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Write Your Copy</h2>
            </div>
          </div>

          <div className="copy-layout">
            <div className="form-grid">
              {(Object.keys(fieldLabels) as CopyField[]).map((field) => (
                <label key={field}>
                  <span>{fieldLabels[field]}</span>
                  <input
                    ref={refs[field]}
                    type="text"
                    value={template[field]}
                    onFocus={() => setActiveField(field)}
                    onChange={onCopyChange(field)}
                  />
                </label>
              ))}
            </div>

            <PlaceholderHelp onInsert={insertIntoActiveField} />
          </div>

          <div
            className="video-preview"
            style={{
              '--preview-primary': template.brandColor,
              '--preview-secondary': template.secondaryColor,
              '--preview-background': template.backgroundColor,
            } as React.CSSProperties}
          >
            <div className="preview-logo">{template.logoUrl ? 'Logo loaded' : 'Vary Cover'}</div>
            <h3>{resolvePlaceholders(template.headlineTemplate, previewVariant)}</h3>
            <p>{resolvePlaceholders(template.subheadlineTemplate, previewVariant)}</p>
            <span>{resolvePlaceholders(template.ctaText, previewVariant)}</span>
          </div>
        </section>
      )}
    </div>
  );
}
