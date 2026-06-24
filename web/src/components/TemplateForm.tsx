import {useMemo, useRef, useState, type ChangeEvent} from 'react';
import type {
  RenderTemplatePayload,
  TemplateCopyField,
  TemplateDefinition,
} from '../api/client';
import {templateIconFor} from '../utils/templates';
import {insertPlaceholder, resolvePlaceholders, type VariantData} from '../utils/placeholder';
import PlaceholderHelp from './PlaceholderHelp';

type TemplateFormProps = {
  compositions: TemplateDefinition[];
  selectedCompositionId: string;
  onSelectComposition: (id: string) => void;
  template: RenderTemplatePayload;
  selectedTemplate: TemplateDefinition;
  onTemplateChange: (template: RenderTemplatePayload) => void;
  previewVariant: VariantData;
};

const valueFor = (
  template: RenderTemplatePayload,
  field: TemplateCopyField,
): string => {
  const value = template[field.id];
  return typeof value === 'string' ? value : field.default;
};

const fallbackCopyFields: TemplateCopyField[] = [
  {id: 'headlineTemplate', label: 'Headline', default: ''},
  {id: 'ctaText', label: 'Call to Action', default: ''},
];

export default function TemplateForm({
  compositions,
  selectedCompositionId,
  onSelectComposition,
  template,
  selectedTemplate,
  onTemplateChange,
  previewVariant,
}: TemplateFormProps) {
  const copyFields = selectedTemplate.copyFields?.length
    ? selectedTemplate.copyFields
    : fallbackCopyFields;
  const [activeField, setActiveField] = useState(copyFields[0]?.id ?? 'headlineTemplate');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const visibleCompositions = compositions.length > 0 ? compositions : [selectedTemplate];
  const previewFields = useMemo(() => copyFields.slice(0, 3), [copyFields]);

  const updateTemplate = (key: string, value: string) =>
    onTemplateChange({...template, [key]: value});

  const insertIntoActiveField = (placeholder: string) => {
    const field = copyFields.find((candidate) => candidate.id === activeField) ?? copyFields[0];
    if (!field) {
      return;
    }

    const input = inputRefs.current[field.id];
    const currentValue = valueFor(template, field);
    const nextValue = insertPlaceholder(
      currentValue,
      placeholder,
      input?.selectionStart ?? null,
      input?.selectionEnd ?? null,
    );

    updateTemplate(field.id, nextValue);
    requestAnimationFrame(() => inputRefs.current[field.id]?.focus());
  };

  const onCopyChange =
    (field: TemplateCopyField) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      updateTemplate(field.id, event.target.value);

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
          {visibleCompositions.map((composition) => (
            <button
              key={composition.id}
              type="button"
              className={
                selectedCompositionId === composition.id ? 'template-card selected' : 'template-card'
              }
              onClick={() => onSelectComposition(composition.id)}
            >
              <span className={`template-thumbnail ${composition.category ?? 'ad'}`}>
                <span>{templateIconFor(composition.id)}</span>
              </span>
              <strong>{composition.name ?? composition.id}</strong>
              <p>{composition.description ?? 'Dynamic video template for personalized variants.'}</p>
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
              {copyFields.map((field) => (
                <label key={field.id}>
                  <span>{field.label}</span>
                  <input
                    ref={(element) => {
                      inputRefs.current[field.id] = element;
                    }}
                    type="text"
                    value={valueFor(template, field)}
                    onFocus={() => setActiveField(field.id)}
                    onChange={onCopyChange(field)}
                  />
                </label>
              ))}
            </div>

            <PlaceholderHelp
              placeholders={selectedTemplate.placeholders ?? []}
              onInsert={insertIntoActiveField}
            />
          </div>

          <div
            className="video-preview"
            style={{
              '--preview-primary':
                typeof template.brandColor === 'string' ? template.brandColor : '#1A365D',
              '--preview-secondary':
                typeof template.secondaryColor === 'string' ? template.secondaryColor : '#3182CE',
              '--preview-background':
                typeof template.backgroundColor === 'string' ? template.backgroundColor : '#1A365D',
            } as React.CSSProperties}
          >
            <div className="preview-logo">
              {typeof template.logoUrl === 'string' && template.logoUrl
                ? 'Logo loaded'
                : selectedTemplate.name ?? 'Vary.video'}
            </div>
            <h3>
              {previewFields[0]
                ? resolvePlaceholders(valueFor(template, previewFields[0]), previewVariant)
                : selectedTemplate.name}
            </h3>
            <p>
              {previewFields[1]
                ? resolvePlaceholders(valueFor(template, previewFields[1]), previewVariant)
                : selectedTemplate.description}
            </p>
            <span>
              {previewFields[2]
                ? resolvePlaceholders(valueFor(template, previewFields[2]), previewVariant)
                : resolvePlaceholders(String(template.ctaText ?? 'Get Started'), previewVariant)}
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
