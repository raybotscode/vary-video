import {useRef, useState} from 'react';
import type {
  AnimationPresetCapability,
  BlockTransitionConfig,
} from '@vary/shared/capabilities/types';
import BlockEditor from '../BlockEditor';
import BlockPalette from '../BlockPalette';
import SceneTimeline from '../SceneTimeline';
import type {ComposerBlock} from '../../utils/blocks';
import BlockPaletteSheet from './BlockPaletteSheet';
import ComposerTabs, {type ComposerTabId} from './ComposerTabs';

type ComposerWorkspaceProps = {
  blocks: ComposerBlock[];
  selectedBlockId: string | null;
  selectedTemplateId: string;
  animations?: AnimationPresetCapability[];
  onSelectBlock: (instanceId: string) => void;
  onRemoveBlock: (instanceId: string) => void;
  onMoveBlock: (instanceId: string, direction: 'up' | 'down') => void;
  onAddBlock: (blockId: string) => void;
  onUpdateBlock: (block: ComposerBlock) => void;
  onUpdateTransition: (instanceId: string, transition: BlockTransitionConfig) => void;
};

/**
 * Composer workspace with two interaction models:
 * - Desktop (≥769px): timeline + editor side by side (existing layout).
 * - Mobile (≤768px): preview strip + Scenes/Content tabs; block palette
 *   opens as a searchable sheet; timeline is a vertical list with
 *   move up/down buttons (no drag dependency).
 */
export default function ComposerWorkspace({
  blocks,
  selectedBlockId,
  selectedTemplateId,
  animations = [],
  onSelectBlock,
  onRemoveBlock,
  onMoveBlock,
  onAddBlock,
  onUpdateBlock,
  onUpdateTransition,
}: ComposerWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ComposerTabId>('scenes');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteOpenerRef = useRef<HTMLElement | null>(null);
  const selectedBlock = blocks.find((block) => block.instanceId === selectedBlockId) ?? null;

  const openPalette = (opener: HTMLElement) => {
    paletteOpenerRef.current = opener;
    setIsPaletteOpen(true);
  };

  return (
    <>
      {/* Desktop layout */}
      <div className="composer-layout composer-desktop">
        <div className="composer-main">
          <SceneTimeline
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            onRemoveBlock={onRemoveBlock}
            onMoveBlock={onMoveBlock}
            onUpdateTransition={onUpdateTransition}
            onOpenPalette={(event) => openPalette(event.currentTarget)}
          />

          {isPaletteOpen && (
            <div className="palette-panel">
              <div className="timeline-header">
                <div>
                  <h3>Block Library</h3>
                  <p>Choose a block to append to the sequence.</p>
                </div>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setIsPaletteOpen(false)}
                >
                  Close
                </button>
              </div>
              <BlockPalette
                templateId={selectedTemplateId}
                onAddBlock={(blockId) => {
                  onAddBlock(blockId);
                  setIsPaletteOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <BlockEditor block={selectedBlock} animations={animations} onChange={onUpdateBlock} />
      </div>

      {/* Mobile layout */}
      <div className="composer-mobile">
        <ComposerTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          hasSelectedBlock={selectedBlock !== null}
        />

        {activeTab === 'scenes' ? (
          <div
            id="composer-panel-scenes"
            role="tabpanel"
            aria-labelledby="composer-tab-scenes"
            className="composer-mobile-panel"
          >
            <SceneTimeline
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={(instanceId) => {
                onSelectBlock(instanceId);
                setActiveTab('content');
              }}
              onRemoveBlock={onRemoveBlock}
              onMoveBlock={onMoveBlock}
              onUpdateTransition={onUpdateTransition}
              onOpenPalette={(event) => openPalette(event.currentTarget)}
            />
          </div>
        ) : (
          <div
            id="composer-panel-content"
            role="tabpanel"
            aria-labelledby="composer-tab-content"
            className="composer-mobile-panel"
          >
            <BlockEditor block={selectedBlock} animations={animations} onChange={onUpdateBlock} />
          </div>
        )}
      </div>

      {isPaletteOpen && (
        <BlockPaletteSheet
          templateId={selectedTemplateId}
          onAddBlock={onAddBlock}
          onClose={() => setIsPaletteOpen(false)}
          openerRef={paletteOpenerRef}
        />
      )}
    </>
  );
}
