import type {TransitionStyle, TransitionStyleArgs} from './types';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Compute CSS transition style for a given transition type at a given progress.
 * Progress is 0..1 where 0 = fully current block, 1 = fully next block.
 *
 * Returns {opacity?, transform?, clipPath?} to be applied as a wrapper div style.
 */
export const getTransitionStyle = (args: TransitionStyleArgs): TransitionStyle => {
  const {
    type,
    layer,
    progress,
    width,
    height,
    direction = 'left',
    intensity = 1,
  } = args;

  const p = clamp01(progress);

  switch (type) {
    case 'crossfade':
      return crossfade(layer, p);

    case 'slide':
      return slide(layer, p, width, height, direction, intensity);

    case 'zoom':
      return zoom(layer, p, intensity);

    case 'wipe':
      return wipe(layer, p, width, height, direction);

    default:
      return crossfade(layer, p);
  }
};

function crossfade(layer: 'current' | 'next', progress: number): TransitionStyle {
  return {
    opacity: layer === 'current' ? 1 - progress : progress,
  };
}

function slide(
  layer: 'current' | 'next',
  progress: number,
  width: number,
  height: number,
  direction: 'left' | 'right' | 'up' | 'down',
  intensity: number,
): TransitionStyle {
  const distance = direction === 'left' || direction === 'right' ? width : height;

  if (layer === 'next') {
    // Next block enters from the direction
    const startOffset = direction === 'left' ? -distance
      : direction === 'right' ? distance
      : direction === 'up' ? -distance
      : distance;

    const offset = startOffset * (1 - progress) * intensity;
    const translate = direction === 'left' || direction === 'right'
      ? `translateX(${offset}px)`
      : `translateY(${offset}px)`;

    return {transform: translate};
  }

  // Current block exits in the opposite direction
  const endOffset = direction === 'left' ? distance
    : direction === 'right' ? -distance
    : direction === 'up' ? distance
    : -distance;

  const offset = endOffset * progress * intensity;
  const translate = direction === 'left' || direction === 'right'
    ? `translateX(${offset}px)`
    : `translateY(${offset}px)`;

  return {transform: translate};
}

function zoom(
  layer: 'current' | 'next',
  progress: number,
  intensity: number,
): TransitionStyle {
  if (layer === 'current') {
    const scale = 1 + 0.08 * intensity * progress;
    return {
      opacity: 1 - progress,
      transform: `scale(${scale})`,
    };
  }

  const scale = 1 - 0.12 * intensity * (1 - progress);
  return {
    opacity: progress,
    transform: `scale(${scale})`,
  };
}

function wipe(
  layer: 'current' | 'next',
  progress: number,
  width: number,
  height: number,
  direction: 'left' | 'right' | 'up' | 'down',
): TransitionStyle {
  if (layer === 'current') {
    // Current block stays fully visible underneath
    return {};
  }

  // Next block is revealed via clipPath
  const p = progress * 100;

  switch (direction) {
    case 'left':
      return {clipPath: `inset(0 ${100 - p}% 0 0)`};
    case 'right':
      return {clipPath: `inset(0 0 0 ${100 - p}%)`};
    case 'up':
      return {clipPath: `inset(0 0 ${100 - p}% 0)`};
    case 'down':
      return {clipPath: `inset(${100 - p}% 0 0 0)`};
    default:
      return {clipPath: `inset(0 ${100 - p}% 0 0)`};
  }
}
