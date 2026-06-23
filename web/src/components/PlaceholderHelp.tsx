import {placeholders} from '../utils/placeholder';

type PlaceholderHelpProps = {
  onInsert: (placeholder: string) => void;
};

export default function PlaceholderHelp({onInsert}: PlaceholderHelpProps) {
  return (
    <aside className="helper-panel">
      <h3>Placeholders</h3>
      <p>Click to insert dynamic data into the active copy field.</p>
      <div className="placeholder-list">
        {placeholders.map((placeholder) => (
          <button
            key={placeholder}
            className="placeholder-chip"
            type="button"
            onClick={() => onInsert(placeholder)}
          >
            {'{{'}
            {placeholder}
            {'}}'}
          </button>
        ))}
      </div>
    </aside>
  );
}
