import type {VariantData} from '../utils/placeholder';

type VariantTableProps = {
  variants: VariantData[];
  columns: string[];
  onChange: (index: number, key: string, value: string) => void;
  onDelete: (index: number) => void;
};

const labelFor = (key: string): string =>
  key
    .split('_')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');

export default function VariantTable({variants, columns, onChange, onDelete}: VariantTableProps) {
  return (
    <div className="variant-table-wrap">
      <table className="variant-table" aria-label="Variant data table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{labelFor(column)}</th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} data-label={labelFor(column)}>
                  {column === 'gender' ? (
                    <select
                      value={variant[column] ?? 'man'}
                      onChange={(event) => onChange(index, column, event.target.value)}
                    >
                      <option value="man">man</option>
                      <option value="woman">woman</option>
                    </select>
                  ) : (
                    <input
                      type={column === 'age' ? 'number' : 'text'}
                      value={variant[column] ?? ''}
                      onChange={(event) => onChange(index, column, event.target.value)}
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
