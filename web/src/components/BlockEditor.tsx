import type {AnimationPresetCapability} from '@vary/shared/capabilities/types';
import AnimationControls from './AnimationControls';
import {getBlockDefinition, type ComposerBlock} from '../utils/blocks';

type BlockEditorProps = {
  block: ComposerBlock | null;
  animations?: AnimationPresetCapability[];
  onChange: (block: ComposerBlock) => void;
};

const labelFor = (key: string): string =>
  key
    .replace(/Template$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

export default function BlockEditor({block, animations = [], onChange}: BlockEditorProps) {
  if (!block) {
    return (
      <aside className="block-editor empty">
        <h3>Block Editor</h3>
        <p>Select a timeline block to edit its copy and timing.</p>
      </aside>
    );
  }

  const definition = getBlockDefinition(block.blockId);
  const duration = block.durationFrames ?? definition.defaultDurationFrames;

  const updateContent = (key: string, value: string) =>
    onChange({...block, content: {...block.content, [key]: value}});

  const updateDuration = (value: number) =>
    onChange({
      ...block,
      durationFrames: Math.max(24, Math.min(300, value)),
    });

  return (
    <aside className="block-editor">
      <div className="block-editor-title">
        <span className="block-icon">{definition.icon}</span>
        <div>
          <h3>{definition.name}</h3>
          <p>{definition.description}</p>
        </div>
      </div>

      <div className="form-grid">
        {Object.entries(block.content).map(([key, value]) => (
          <label key={key}>
            <span>{labelFor(key)}</span>
            <input
              type="text"
              value={value}
              onChange={(event) => updateContent(key, event.target.value)}
            />
          </label>
        ))}

        <div className="wide-field">
          <AnimationControls
            animations={animations}
            value={block.animation}
            onChange={(animation) => onChange({...block, animation})}
          />
        </div>

        <label>
          <span>Duration Frames</span>
          <input
            type="range"
            min="24"
            max="300"
            value={duration}
            onChange={(event) => updateDuration(Number(event.target.value))}
          />
          <input
            type="number"
            min="24"
            max="300"
            value={duration}
            onChange={(event) => updateDuration(Number(event.target.value))}
          />
        </label>
      </div>
    </aside>
  );
}
