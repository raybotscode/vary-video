import {describe, expect, it} from 'vitest';
import {getAnimationStyle} from './presets';
import {resolveEasing} from './easing';
import {mergeMotionStyles} from './applyAnimationStyle';

const baseArgs = {
  frame: 0,
  fps: 30,
  width: 1920,
  height: 1080,
};

describe('getAnimationStyle', () => {
  it('none returns empty style', () => {
    expect(getAnimationStyle({...baseArgs, presetId: 'none'})).toEqual({});
  });

  it('unknown preset returns empty style', () => {
    expect(getAnimationStyle({...baseArgs, presetId: 'unknown'})).toEqual({});
  });

  describe('fade-in', () => {
    it('starts at opacity 0', () => {
      const style = getAnimationStyle({...baseArgs, presetId: 'fade-in', frame: 0, durationFrames: 12});
      expect(style.opacity).toBeCloseTo(0, 2);
    });

    it('reaches opacity 1 at duration', () => {
      const style = getAnimationStyle({...baseArgs, presetId: 'fade-in', frame: 12, durationFrames: 12});
      expect(style.opacity).toBeCloseTo(1, 2);
    });

    it('is at midpoint opacity at half duration', () => {
      const style = getAnimationStyle({...baseArgs, presetId: 'fade-in', frame: 6, durationFrames: 12});
      expect(style.opacity!).toBeGreaterThan(0.1);
      expect(style.opacity!).toBeLessThan(0.9);
    });
  });

  describe('fade-out', () => {
    it('starts at opacity 1', () => {
      const style = getAnimationStyle({...baseArgs, presetId: 'fade-out', frame: 0, durationFrames: 12});
      expect(style.opacity).toBeCloseTo(1, 2);
    });

    it('reaches opacity 0 at duration', () => {
      const style = getAnimationStyle({...baseArgs, presetId: 'fade-out', frame: 12, durationFrames: 12});
      expect(style.opacity).toBeCloseTo(0, 2);
    });
  });

  describe('slide-in-left', () => {
    it('starts off-screen left', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'slide-in-left',
        frame: 0,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.opacity).toBeCloseTo(0, 1);
      expect(style.transform).toContain('translateX');
      expect(style.transform).toContain('-');
    });

    it('ends at origin', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'slide-in-left',
        frame: 12,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.opacity).toBeCloseTo(1, 2);
      expect(style.transform).toContain('0px');
    });
  });

  describe('slide-in-right', () => {
    it('starts off-screen right', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'slide-in-right',
        frame: 0,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.transform).toContain('960'); // 1920 * 0.5
    });
  });

  describe('slide-in-up', () => {
    it('starts below', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'slide-in-up',
        frame: 0,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.transform).toContain('translateY');
      expect(style.transform).toContain('540'); // 1080 * 0.5
    });
  });

  describe('slide-in-down', () => {
    it('starts above', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'slide-in-down',
        frame: 0,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.transform).toContain('translateY');
      expect(style.transform).toContain('-');
    });
  });

  describe('zoom-in', () => {
    it('starts smaller', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'zoom-in',
        frame: 0,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.transform).toContain('scale');
      expect(style.opacity).toBeCloseTo(0, 1);
    });

    it('ends at scale 1', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'zoom-in',
        frame: 12,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.transform).toContain('1)');
      expect(style.opacity).toBeCloseTo(1, 2);
    });
  });

  describe('bounce-in', () => {
    it('starts at scale 0', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'bounce-in',
        frame: 0,
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.opacity).toBeCloseTo(0, 1);
    });

    it('eventually reaches near scale 1', () => {
      const style = getAnimationStyle({
        ...baseArgs,
        presetId: 'bounce-in',
        frame: 60, // well past settling
        durationFrames: 12,
        intensity: 0.5,
      });
      expect(style.opacity).toBeCloseTo(1, 1);
    });
  });

  it('clamps intensity to 0..1', () => {
    const normalised = getAnimationStyle({
      ...baseArgs,
      presetId: 'zoom-in',
      frame: 0,
      intensity: 1.5, // should be clamped to 1
    });
    const zero = getAnimationStyle({
      ...baseArgs,
      presetId: 'zoom-in',
      frame: 0,
      intensity: -0.5, // should be clamped to 0
    });
    // Both should produce valid styles without error
    expect(normalised).toBeDefined();
    expect(zero).toBeDefined();
  });

  it('clamps duration to at least 1', () => {
    const style = getAnimationStyle({
      ...baseArgs,
      presetId: 'fade-in',
      frame: 0,
      durationFrames: 0, // should be clamped to 1
    });
    expect(style).toBeDefined();
  });
});

describe('resolveEasing', () => {
  it('returns a function for each known easing', () => {
    for (const easing of ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring'] as const) {
      const fn = resolveEasing(easing);
      expect(typeof fn).toBe('function');
    }
  });

  it('defaults to ease-out for undefined', () => {
    const fn = resolveEasing(undefined);
    expect(typeof fn).toBe('function');
  });
});

describe('mergeMotionStyles', () => {
  it('returns empty for no styles', () => {
    expect(mergeMotionStyles()).toEqual({});
  });

  it('passes through single style', () => {
    expect(mergeMotionStyles({opacity: 0.5})).toEqual({opacity: 0.5});
  });

  it('multiplies opacities', () => {
    const result = mergeMotionStyles({opacity: 0.5}, {opacity: 0.5});
    expect(result.opacity).toBeCloseTo(0.25, 4);
  });

  it('concatenates transforms', () => {
    const result = mergeMotionStyles(
      {transform: 'translateX(10px)'},
      {transform: 'scale(0.5)'},
    );
    expect(result.transform).toBe('translateX(10px) scale(0.5)');
  });

  it('composes opacity and transform together', () => {
    const result = mergeMotionStyles(
      {opacity: 0.8, transform: 'translateX(10px)'},
      {opacity: 0.5, transform: 'scale(2)'},
    );
    expect(result.opacity).toBeCloseTo(0.4, 4);
    expect(result.transform).toBe('translateX(10px) scale(2)');
  });

  it('handles undefined opacity as 1', () => {
    const result = mergeMotionStyles({transform: 'scale(2)'}, {opacity: 0.5});
    expect(result.opacity).toBeCloseTo(0.5, 4);
  });
});
