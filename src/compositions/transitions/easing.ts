import {Easing} from 'remotion';
import type {AnimationEasing} from '../../shared/capabilities/types';

/**
 * Resolve transition easing. Defaults to ease-in-out for transitions.
 */
export const resolveTransitionEasing = (easing?: AnimationEasing) => {
  switch (easing) {
    case 'linear':
      return Easing.linear;
    case 'ease-in':
      return Easing.in(Easing.bezier(0.4, 0, 1, 1));
    case 'ease-out':
      return Easing.out(Easing.bezier(0, 0, 0.2, 1));
    case 'ease-in-out':
    case 'spring':
    default:
      return Easing.inOut(Easing.bezier(0.4, 0, 0.2, 1));
  }
};
