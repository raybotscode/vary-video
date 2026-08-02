import type {TemplateDefinition} from '../../api/client';
import {templateIconFor} from '../../utils/templates';

type TemplatePickerProps = {
  compositions: TemplateDefinition[];
  selectedCompositionId: string;
  onSelect: (templateId: string) => void;
};

/**
 * Template selection grid. Used in composer mode Step 1.
 */
export default function TemplatePicker({
  compositions,
  selectedCompositionId,
  onSelect,
}: TemplatePickerProps) {
  return (
    <div className="template-grid">
      {compositions.map((composition) => (
        <button
          key={composition.id}
          type="button"
          className={
            selectedCompositionId === composition.id
              ? 'template-card selected'
              : 'template-card'
          }
          onClick={() => onSelect(composition.id)}
        >
          <span className={`template-thumbnail ${composition.category ?? 'ad'}`}>
            <span>{templateIconFor(composition.id)}</span>
          </span>
          <strong>{composition.name ?? composition.id}</strong>
          <p>
            {composition.description ??
              'Dynamic video template for personalized variants.'}
          </p>
        </button>
      ))}
    </div>
  );
}
