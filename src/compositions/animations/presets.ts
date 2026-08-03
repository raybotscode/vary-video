import {interpolate, spring} from 'remotion';
import type {AnimationEasing} from '../../shared/capabilities/types';
import type {AnimationStyle} from './types';
import {resolveEasing} from './easing';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type AnimationArgs = {
  presetId: string;
  frame: number;
  fps: number;
  width: number;
  height: number;
  durationFrames?: number;
  intensity?: number;
  easing?: AnimationEasing;
};

/**
 * Compute CSS animation style for a given preset at a given frame.
 * Returns {opacity?, transform?} to be applied as a wrapper div style.
 *
 * All presets use deterministic interpolate() except bounce-in which uses spring().
 */
export const getAnimationStyle = (args: AnimationArgs): AnimationStyle => {
  const {
    presetId,
    frame,
    fps,
    width,
    height,
    durationFrames: rawDuration,
    intensity: rawIntensity,
    easing,
  } = args;

  const duration = Math.max(1, rawDuration ?? 12);
  const intensity = clamp01(rawIntensity ?? 0.35);
  const easingFn = resolveEasing(easing);

  switch (presetId) {
    case 'none':
      return {};

    case 'fade-in': {
      const opacity = interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      return {opacity};
    }

    case 'fade-out': {
      const opacity = interpolate(frame, [0, duration], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      return {opacity};
    }

    case 'slide-in-left': {
      const progress = interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      const translateX = (1 - progress) * -width * intensity;
      return {
        opacity: progress,
        transform: `translateX(${translateX}px)`,
      };
    }

    case 'slide-in-right': {
      const progress = interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      const translateX = (1 - progress) * width * intensity;
      return {
        opacity: progress,
        transform: `translateX(${translateX}px)`,
      };
    }

    case 'slide-in-up': {
      const progress = interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      const translateY = (1 - progress) * height * intensity;
      return {
        opacity: progress,
        transform: `translateY(${translateY}px)`,
      };
    }

    case 'slide-in-down': {
      const progress = interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      const translateY = (1 - progress) * -height * intensity;
      return {
        opacity: progress,
        transform: `translateY(${translateY}px)`,
      };
    }

    case 'zoom-in': {
      const progress = interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easingFn,
      });
      const scale = 1 - (1 - progress) * intensity * 0.35;
      return {
        opacity: progress,
        transform: `scale(${scale})`,
      };
    }

    case 'bounce-in': {
      // Spring-based: overshoots slightly then settles
      const springValue = spring({
        frame,
        fps,
        config: {
          damping: Math.max(5, 12 - intensity * 8),
          stiffness: 80 + intensity * 40,
          mass: 0.8,
        },
      });
      // Clamp to 0..1.08 to prevent excessive overshoot
      const clamped = Math.min(1.08, Math.max(0, springValue));
      const opacity = interpolate(springValue, [0, 0.6], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return {
        opacity,
        transform: `scale(${clamped})`,
      };
    }

    default:
      return {};
  }
};
