import type {TransitionType, TransitionDirection, AnimationEasing} from '../../shared/capabilities/types';

export type TransitionLayer = 'current' | 'next';

export type TransitionStyleArgs = {
  type: TransitionType;
  layer: TransitionLayer;
  progress: number;
  width: number;
  height: number;
  direction?: TransitionDirection;
  intensity?: number;
  easing?: AnimationEasing;
};

export type TransitionStyle = {
  opacity?: number;
  transform?: string;
  clipPath?: string;
};
