import {
  blockDefinitions,
  categories,
  type SceneBlockDefinition,
} from '../utils/blocks';

type BlockPaletteProps = {
  templateId: string;
  onAddBlock: (blockId: string) => void;
};

const isCompatible = (block: SceneBlockDefinition, templateId: string): boolean =>
  block.compatibleSchemas.includes('any') ||
  block.compatibleSchemas.includes(templateId);

export default function BlockPalette({templateId, onAddBlock}: BlockPaletteProps) {
  const visibleBlocks = blockDefinitions.filter((block) =>
    isCompatible(block, templateId),
  );

  return (
    <div className="block-palette">
      {categories.map((category) => {
        const blocks = visibleBlocks.filter((block) => block.category === category);
        if (blocks.length === 0) {
          return null;
        }

        return (
          <section className="block-category" key={category}>
            <h3>{category}</h3>
            <div className="block-card-grid">
              {blocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  className="block-card"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', block.id);
                  }}
                  onClick={() => onAddBlock(block.id)}
                >
                  <span className="block-icon">{block.icon}</span>
                  <strong>{block.name}</strong>
                  <p>{block.description}</p>
                  <small>{block.defaultDurationFrames} frames</small>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
