import {Easing} from 'remotion';
import type {AnimationEasing} from '../../shared/capabilities/types';

/**
 * Resolve an AnimationEasing ID to a Remotion easing function.
 * Used by interpolate() for deterministic animation curves.
 *
 * 'spring' is handled specially by preset functions (uses spring() instead
 * of interpolate()), so this returns ease-out as a fallback for spring.
 */
export const resolveEasing = (easing?: AnimationEasing) => {
  switch (easing) {
    case 'linear':
      return Easing.linear;
    case 'ease-in':
      return Easing.in(Easing.bezier(0.4, 0, 1, 1));
    case 'ease-out':
      return Easing.out(Easing.bezier(0, 0, 0.2, 1));
    case 'ease-in-out':
    case 'spring': // spring uses its own function; this is the interpolation fallback
      return Easing.inOut(Easing.bezier(0.4, 0, 0.2, 1));
    default:
      return Easing.out(Easing.bezier(0, 0, 0.2, 1));
  }
};
