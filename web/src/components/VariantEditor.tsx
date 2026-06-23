import {useState} from 'react';
import {createEmptyVariant, parseCsv, type VariantData} from '../utils/placeholder';
import VariantTable from './VariantTable';

type VariantEditorProps = {
  variants: VariantData[];
  onChange: (variants: VariantData[]) => void;
  onError: (message: string) => void;
};

export default function VariantEditor({variants, onChange, onError}: VariantEditorProps) {
  const [importMode, setImportMode] = useState<'json' | 'csv' | null>(null);
  const [importText, setImportText] = useState('');

  const updateVariant = (index: number, key: keyof VariantData, value: string) => {
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
          : parseCsv(importText);

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Import must contain at least one row.');
      }

      const normalized = rows.map((row) => ({
        age: String(row.age ?? ''),
        gender: (row.gender === 'woman' ? 'woman' : 'man') as 'man' | 'woman',
        location: String(row.location ?? ''),
        company: String(row.company ?? ''),
      })) satisfies VariantData[];

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
        <button type="button" className="secondary-button" onClick={() => onChange([...variants, createEmptyVariant()])}>
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
                  ? '[{"age":"52","gender":"man","location":"Dublin","company":"Vary Cover"}]'
                  : 'age,gender,location,company\n52,man,Dublin,Vary Cover'
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

      <VariantTable variants={variants} onChange={updateVariant} onDelete={deleteVariant} />
    </div>
  );
}
