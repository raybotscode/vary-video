import type {VariantData} from '../utils/placeholder';

type VariantTableProps = {
  variants: VariantData[];
  onChange: (index: number, key: keyof VariantData, value: string) => void;
  onDelete: (index: number) => void;
};

const fields: Array<{key: keyof VariantData; label: string}> = [
  {key: 'age', label: 'Age'},
  {key: 'gender', label: 'Gender'},
  {key: 'location', label: 'Location'},
  {key: 'company', label: 'Company'},
];

export default function VariantTable({variants, onChange, onDelete}: VariantTableProps) {
  return (
    <div className="variant-table-wrap">
      <table className="variant-table" aria-label="Variant data table">
        <thead>
          <tr>
            {fields.map((field) => (
              <th key={field.key}>{field.label}</th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant, index) => (
            <tr key={index}>
              {fields.map((field) => (
                <td key={field.key} data-label={field.label}>
                  {field.key === 'gender' ? (
                    <select
                      value={variant.gender}
                      onChange={(event) => onChange(index, field.key, event.target.value)}
                    >
                      <option value="man">man</option>
                      <option value="woman">woman</option>
                    </select>
                  ) : (
                    <input
                      type={field.key === 'age' ? 'number' : 'text'}
                      value={variant[field.key]}
                      onChange={(event) => onChange(index, field.key, event.target.value)}
                    />
                  )}
                </td>
              ))}
              <td data-label="Action">
                <button
                  className="ghost-button danger"
                  type="button"
                  onClick={() => onDelete(index)}
                  disabled={variants.length === 1}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
