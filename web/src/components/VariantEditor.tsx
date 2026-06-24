import {useState} from 'react';
import {createEmptyVariant, parseCsv, type VariantData} from '../utils/placeholder';
import VariantTable from './VariantTable';

type VariantEditorProps = {
  variants: VariantData[];
  columns: string[];
  templateId: string;
  onChange: (variants: VariantData[]) => void;
  onError: (message: string) => void;
};

export default function VariantEditor({variants, columns, templateId, onChange, onError}: VariantEditorProps) {
  const [importMode, setImportMode] = useState<'json' | 'csv' | null>(null);
  const [importText, setImportText] = useState('');

  const updateVariant = (index: number, key: string, value: string) => {
    onChange(
      variants.map((variant, variantIndex) =>
        variantIndex === index ? {...variant, [key]: value} : variant,
      ),
    );
  };

  const deleteVariant = (index: number) => {
    onChange(variants.filter((_, variantIndex) => variantIndex !== index));
  };

  const importRows = () => {
    try {
      const rows =
        importMode === 'json'
          ? (JSON.parse(importText) as VariantData[])
          : parseCsv(importText, columns);

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Import must contain at least one row.');
      }

      const normalized = rows.map((row) =>
        Object.fromEntries(
          columns.map((column) => [column, String(row[column] ?? '')]),
        ),
      );

      onChange(normalized);
      setImportText('');
      setImportMode(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not import variants.');
    }
  };

  return (
    <div className="stack">
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => onChange([...variants, createEmptyVariant(templateId)])}>
          Add Row
        </button>
        <button type="button" className="ghost-button" onClick={() => setImportMode('json')}>
          Import JSON
        </button>
        <button type="button" className="ghost-button" onClick={() => setImportMode('csv')}>
          Import CSV
        </button>
      </div>

      {importMode && (
        <div className="import-panel">
          <label>
            <span>{importMode.toUpperCase()} data</span>
            <textarea
              rows={6}
              placeholder={
                importMode === 'json'
                  ? `[${JSON.stringify(createEmptyVariant(templateId))}]`
                  : `${columns.join(',')}\n${columns.map((column) => createEmptyVariant(templateId)[column] || column).join(',')}`
              }
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={importRows}>
              Import Rows
            </button>
            <button type="button" className="ghost-button" onClick={() => setImportMode(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <VariantTable variants={variants} columns={columns} onChange={updateVariant} onDelete={deleteVariant} />
    </div>
  );
}
