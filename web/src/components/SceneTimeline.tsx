import {getBlockDefinition, type ComposerBlock} from '../utils/blocks';

type SceneTimelineProps = {
  blocks: ComposerBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (instanceId: string) => void;
  onRemoveBlock: (instanceId: string) => void;
  onMoveBlock: (instanceId: string, direction: 'up' | 'down') => void;
  onOpenPalette: () => void;
};

export default function SceneTimeline({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onRemoveBlock,
  onMoveBlock,
  onOpenPalette,
}: SceneTimelineProps) {
  const totalDuration = blocks.reduce((sum, block) => {
    const definition = getBlockDefinition(block.blockId);
    return sum + (block.durationFrames ?? definition.defaultDurationFrames);
  }, 0);

  return (
    <div className="scene-timeline">
      <div className="timeline-header">
        <div>
          <h3>Timeline</h3>
          <p>{totalDuration} frames total</p>
        </div>
        <button className="secondary-button" type="button" onClick={onOpenPalette}>
          Add Block
        </button>
      </div>

      <div className="timeline-track">
        {blocks.map((block, index) => {
          const definition = getBlockDefinition(block.blockId);
          const duration = block.durationFrames ?? definition.defaultDurationFrames;

          return (
            <article
              key={block.instanceId}
              className={
                selectedBlockId === block.instanceId
                  ? 'timeline-block selected'
                  : 'timeline-block'
              }
            >
              <button
                type="button"
                className="timeline-block-main"
                onClick={() => onSelectBlock(block.instanceId)}
              >
                <span className="block-icon">{definition.icon}</span>
                <strong>{definition.name}</strong>
                <small>{duration} frames</small>
              </button>
              <div className="timeline-actions">
                <button
                  className="ghost-button"
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveBlock(block.instanceId, 'up')}
                >
                  Up
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  disabled={index === blocks.length - 1}
                  onClick={() => onMoveBlock(block.instanceId, 'down')}
                >
                  Down
                </button>
                <button
                  className="ghost-button danger"
                  type="button"
                  onClick={() => onRemoveBlock(block.instanceId)}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
