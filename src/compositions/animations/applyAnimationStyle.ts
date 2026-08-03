import type {AnimationStyle} from './types';

/**
 * Merge multiple AnimationStyle objects into one.
 * - Opacity values are MULTIPLIED (0.5 * 0.5 = 0.25)
 * - Transform strings are CONCATENATED
 *
 * This lets entry/exit animations and transitions compose without
 * overwriting each other's transforms.
 */
export const mergeMotionStyles = (...styles: AnimationStyle[]): AnimationStyle => {
  let opacity = 1;
  const transforms: string[] = [];

  for (const style of styles) {
    const styleOpacity = style.opacity;
    if (typeof styleOpacity === 'number') {
      opacity *= styleOpacity;
    }
    if (style.transform) {
      transforms.push(style.transform);
    }
  }

  const result: AnimationStyle = {};
  if (opacity !== 1) {
    result.opacity = opacity;
  }
  if (transforms.length > 0) {
    result.transform = transforms.join(' ');
  }
  return result;
};
