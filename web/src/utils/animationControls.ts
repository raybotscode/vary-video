import type {
  AnimationEasing,
  AnimationPresetCapability,
  BlockAnimationConfig,
  BlockAnimationSettings,
} from '@vary/shared/capabilities/types';

export type AnimationDirection = 'in' | 'out';

export const defaultAnimationDurationFrames = 12;
export const defaultAnimationIntensity = 0.35;
export const defaultAnimationEasing: AnimationEasing = 'ease-out';

const easingOptions: AnimationEasing[] = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'spring',
];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isKnownEasing = (value: unknown): value is AnimationEasing =>
  typeof value === 'string' && easingOptions.includes(value as AnimationEasing);

export const animationOptionsForDirection = (
  animations: AnimationPresetCapability[],
  direction: AnimationDirection,
): AnimationPresetCapability[] =>
  animations.filter((animation) => animation.id === 'none' || animation.direction === direction);

export const easingOptionsForPreset = (
  preset: AnimationPresetCapability | undefined,
): AnimationEasing[] => {
  if (preset?.id === 'bounce-in') {
    return ['spring'];
  }

  if (!preset?.parameters.easing) {
    return [];
  }

  return easingOptions;
};

export const normalizeAnimationConfig = (
  config: BlockAnimationConfig | undefined,
  preset: AnimationPresetCapability | undefined,
): BlockAnimationConfig | undefined => {
  if (!config || config.presetId === 'none') {
    return undefined;
  }

  const normalized: BlockAnimationConfig = {presetId: config.presetId};

  if (preset?.parameters.durationFrames) {
    const duration = clamp(Math.round(config.durationFrames ?? defaultAnimationDurationFrames), 0, 60);
    if (duration > 0) {
      normalized.durationFrames = duration;
    }
  }

  if (preset?.parameters.intensity) {
    normalized.intensity = clamp(config.intensity ?? defaultAnimationIntensity, 0, 1);
  }

  const allowedEasings = easingOptionsForPreset(preset);
  if (allowedEasings.length > 0) {
    normalized.easing = isKnownEasing(config.easing) && allowedEasings.includes(config.easing)
      ? config.easing
      : preset?.id === 'bounce-in'
        ? 'spring'
        : defaultAnimationEasing;
  }

  return normalized;
};

export const normalizeAnimationSettings = (
  settings: BlockAnimationSettings | undefined,
  animations: AnimationPresetCapability[],
): BlockAnimationSettings | undefined => {
  const entry = normalizeAnimationConfig(
    settings?.entry,
    animations.find((animation) => animation.id === settings?.entry?.presetId),
  );
  const exit = normalizeAnimationConfig(
    settings?.exit,
    animations.find((animation) => animation.id === settings?.exit?.presetId),
  );

  if (!entry && !exit) {
    return undefined;
  }

  return {entry, exit};
};
