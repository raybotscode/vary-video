import type {
  AnimationEasing,
  BlockTransitionConfig,
  TransitionDirection,
  TransitionType,
} from '@vary/shared/capabilities/types';
import {
  defaultTransitionConfig,
  normalizeTransitionConfig,
  transitionDirections,
  transitionEasings,
  transitionTypes,
} from '../utils/transitions';

type TransitionControlsProps = {
  value?: BlockTransitionConfig;
  onChange: (value: BlockTransitionConfig) => void;
};

const titleCase = (value: string): string =>
  value
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

export default function TransitionControls({value, onChange}: TransitionControlsProps) {
  const normalized = normalizeTransitionConfig(value);
  const update = (patch: Partial<BlockTransitionConfig>) =>
    onChange(normalizeTransitionConfig({...normalized, ...patch}));
  const showsDirection = normalized.type === 'slide' || normalized.type === 'wipe';

  return (
    <div className="transition-controls" aria-label="Transition controls">
      <div className="transition-control-header">
        <span>Transition</span>
        <small>{normalized.durationFrames ?? defaultTransitionConfig.durationFrames} frames</small>
      </div>
      <div className="transition-control-grid">
        <label>
          <span>Type</span>
          <select
            value={normalized.type}
            onChange={(event) => update({type: event.target.value as TransitionType})}
          >
            {transitionTypes.map((type) => (
              <option key={type} value={type}>
                {titleCase(type)}
              </option>
            ))}
          </select>
        </label>
        {showsDirection && (
          <label>
            <span>Direction</span>
            <select
              value={normalized.direction ?? defaultTransitionConfig.direction}
              onChange={(event) => update({direction: event.target.value as TransitionDirection})}
            >
              {transitionDirections.map((direction) => (
                <option key={direction} value={direction}>
                  {titleCase(direction)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>Duration</span>
          <input
            type="range"
            min="0"
            max="60"
            value={normalized.durationFrames ?? defaultTransitionConfig.durationFrames}
            onChange={(event) => update({durationFrames: Number(event.target.value)})}
          />
        </label>
        <label>
          <span>Easing</span>
          <select
            value={(normalized.easing ?? defaultTransitionConfig.easing) as string}
            onChange={(event) => update({easing: event.target.value as AnimationEasing})}
          >
            {transitionEasings.map((easing) => (
              <option key={easing} value={easing}>
                {titleCase(easing)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
