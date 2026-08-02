import {useEffect, useRef, useState} from 'react';
import BlockPalette from '../BlockPalette';

type BlockPaletteSheetProps = {
  templateId: string;
  onAddBlock: (blockId: string) => void;
  onClose: () => void;
  openerRef?: React.RefObject<HTMLElement | null>;
};

/**
 * Searchable block palette presented as a full-screen sheet on mobile.
 * Reuses BlockPalette content; adds a filter input, Escape close, and
 * focus management (focus lands in the search box; returns to the opener).
 */
export default function BlockPaletteSheet({
  templateId,
  onAddBlock,
  onClose,
  openerRef,
}: BlockPaletteSheetProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus the search box on open.
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleClose = () => {
    onClose();
    // Restore focus to the element that opened the sheet.
    openerRef?.current?.focus();
  };

  // Escape closes the sheet; focus returns to the opener.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, openerRef]);

  return (
    <div className="palette-sheet" role="dialog" aria-modal="true" aria-label="Block library">
      <div className="palette-sheet-header">
        <div>
          <h3>Block Library</h3>
          <p>Choose a block to append to the sequence.</p>
        </div>
        <button className="ghost-button" type="button" onClick={handleClose}>
          Close
        </button>
      </div>
      <input
        ref={searchRef}
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
