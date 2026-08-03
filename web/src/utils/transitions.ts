import type {
  AnimationEasing,
  BlockTransitionConfig,
  TransitionDirection,
  TransitionType,
} from '@vary/shared/capabilities/types';

export const transitionTypes: TransitionType[] = ['crossfade', 'slide', 'zoom', 'wipe'];
export const transitionDirections: TransitionDirection[] = ['left', 'right', 'up', 'down'];
export const transitionEasings: Exclude<AnimationEasing, 'spring'>[] = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
];

export const defaultTransitionConfig: Required<
  Pick<BlockTransitionConfig, 'type' | 'durationFrames' | 'direction' | 'easing'>
> = {
  type: 'crossfade',
  durationFrames: 12,
  direction: 'left',
  easing: 'ease-out',
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isTransitionType = (value: unknown): value is TransitionType =>
  typeof value === 'string' && transitionTypes.includes(value as TransitionType);

const isTransitionDirection = (value: unknown): value is TransitionDirection =>
  typeof value === 'string' && transitionDirections.includes(value as TransitionDirection);

const isTransitionEasing = (value: unknown): value is Exclude<AnimationEasing, 'spring'> =>
  typeof value === 'string' && transitionEasings.includes(value as Exclude<AnimationEasing, 'spring'>);

export const normalizeTransitionConfig = (
  config: BlockTransitionConfig | undefined,
): BlockTransitionConfig => {
  const type = isTransitionType(config?.type) ? config.type : defaultTransitionConfig.type;
  const durationFrames = clamp(
    Math.round(config?.durationFrames ?? defaultTransitionConfig.durationFrames),
    0,
    60,
  );
  const easing = isTransitionEasing(config?.easing)
    ? config.easing
    : defaultTransitionConfig.easing;

  const normalized: BlockTransitionConfig = {type, durationFrames, easing};

  if (type === 'slide' || type === 'wipe') {
    normalized.direction = isTransitionDirection(config?.direction)
      ? config.direction
      : defaultTransitionConfig.direction;
  }

  return normalized;
};
