import {useState} from 'react';
import BlockPalette from '../BlockPalette';

type BlockPaletteSheetProps = {
  templateId: string;
  onAddBlock: (blockId: string) => void;
  onClose: () => void;
};

/**
 * Searchable block palette presented as a full-screen sheet on mobile.
 * Reuses BlockPalette content; adds a filter input and close action.
 */
export default function BlockPaletteSheet({
  templateId,
  onAddBlock,
  onClose,
}: BlockPaletteSheetProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="palette-sheet" role="dialog" aria-modal="true" aria-label="Block library">
      <div className="palette-sheet-header">
        <div>
          <h3>Block Library</h3>
          <p>Choose a block to append to the sequence.</p>
        </div>
        <button className="ghost-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <input
        className="palette-search"
        type="search"
        placeholder="Search blocks..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search blocks"
      />
      <div className="palette-sheet-body">
        <BlockPalette
          templateId={templateId}
          onAddBlock={(blockId) => {
            onAddBlock(blockId);
            onClose();
          }}
          query={query}
        />
      </div>
    </div>
  );
}
