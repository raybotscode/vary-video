import type {
  AnimationEasing,
  AnimationPresetCapability,
  BlockAnimationConfig,
  BlockAnimationSettings,
} from '@vary/shared/capabilities/types';
import {
  animationOptionsForDirection,
  defaultAnimationDurationFrames,
  defaultAnimationEasing,
  defaultAnimationIntensity,
  easingOptionsForPreset,
  normalizeAnimationSettings,
} from '../utils/animationControls';

type AnimationControlsProps = {
  animations: AnimationPresetCapability[];
  value?: BlockAnimationSettings;
  onChange: (value: BlockAnimationSettings | undefined) => void;
};

const labelForEasing = (easing: AnimationEasing): string =>
  easing
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

export default function AnimationControls({
  animations,
  value,
  onChange,
}: AnimationControlsProps) {
  const update = (key: 'entry' | 'exit', config: BlockAnimationConfig | undefined) => {
    const next = normalizeAnimationSettings({...value, [key]: config}, animations);
    onChange(next);
  };

  return (
    <section className="animation-controls">
      <div className="compact-heading">
        <h3>Animation</h3>
      </div>
      <AnimationPanel
        label="Entry"
        direction="in"
        animations={animations}
        value={value?.entry}
        onChange={(config) => update('entry', config)}
      />
      <AnimationPanel
        label="Exit"
        direction="out"
        animations={animations}
        value={value?.exit}
        onChange={(config) => update('exit', config)}
      />
    </section>
  );
}

function AnimationPanel({
  label,
  direction,
  animations,
  value,
  onChange,
}: {
  label: string;
  direction: 'in' | 'out';
  animations: AnimationPresetCapability[];
  value?: BlockAnimationConfig;
  onChange: (value: BlockAnimationConfig | undefined) => void;
}) {
  const options = animationOptionsForDirection(animations, direction);
  const selectedPresetId = value?.presetId ?? 'none';
  const selectedPreset = options.find((preset) => preset.id === selectedPresetId) ?? options[0];
  const easingOptions = easingOptionsForPreset(selectedPreset);
  const duration = value?.durationFrames ?? defaultAnimationDurationFrames;
  const intensity = value?.intensity ?? defaultAnimationIntensity;
  const easing = value?.easing ?? (selectedPreset?.id === 'bounce-in' ? 'spring' : defaultAnimationEasing);

  const patch = (patchValue: Partial<BlockAnimationConfig>) => {
    if (selectedPresetId === 'none' && !patchValue.presetId) {
      return;
    }
    onChange({presetId: selectedPresetId, durationFrames: duration, intensity, easing, ...patchValue});
  };

  return (
    <div className="animation-panel">
      <label>
        <span>{label}</span>
        <select
          value={selectedPresetId}
          onChange={(event) => {
            const presetId = event.target.value;
            if (presetId === 'none') {
              onChange(undefined);
              return;
            }
            const nextPreset = animations.find((preset) => preset.id === presetId);
            const nextEasing = nextPreset?.id === 'bounce-in' ? 'spring' : defaultAnimationEasing;
            onChange({
              presetId,
              durationFrames: defaultAnimationDurationFrames,
              intensity: defaultAnimationIntensity,
              easing: nextPreset?.parameters.easing ? nextEasing : undefined,
            });
          }}
        >
          {options.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </label>

      {selectedPresetId !== 'none' && selectedPreset && (
        <div className="motion-control-grid">
          {selectedPreset.parameters.durationFrames && (
            <label>
              <span>Duration: {duration} frames</span>
              <input
                type="range"
                min="0"
                max="60"
                value={duration}
                onChange={(event) => patch({durationFrames: Number(event.target.value)})}
              />
            </label>
          )}
          {selectedPreset.parameters.intensity && (
            <label>
              <span>Intensity: {intensity.toFixed(2)}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={intensity}
                onChange={(event) => patch({intensity: Number(event.target.value)})}
              />
            </label>
          )}
          {easingOptions.length > 0 && (
            <label>
              <span>Easing</span>
              <select
                value={easingOptions.includes(easing) ? easing : easingOptions[0]}
                onChange={(event) => patch({easing: event.target.value as AnimationEasing})}
              >
                {easingOptions.map((option) => (
                  <option key={option} value={option}>
                    {labelForEasing(option)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
