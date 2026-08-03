import {describe, expect, it} from 'vitest';
import {getTransitionStyle} from './presets';

const W = 1920;
const H = 1080;

describe('crossfade', () => {
  it('current block fades out', () => {
    expect(getTransitionStyle({type: 'crossfade', layer: 'current', progress: 0, width: W, height: H}).opacity).toBe(1);
    expect(getTransitionStyle({type: 'crossfade', layer: 'current', progress: 0.5, width: W, height: H}).opacity).toBeCloseTo(0.5);
    expect(getTransitionStyle({type: 'crossfade', layer: 'current', progress: 1, width: W, height: H}).opacity).toBe(0);
  });

  it('next block fades in', () => {
    expect(getTransitionStyle({type: 'crossfade', layer: 'next', progress: 0, width: W, height: H}).opacity).toBe(0);
    expect(getTransitionStyle({type: 'crossfade', layer: 'next', progress: 0.5, width: W, height: H}).opacity).toBeCloseTo(0.5);
    expect(getTransitionStyle({type: 'crossfade', layer: 'next', progress: 1, width: W, height: H}).opacity).toBe(1);
  });
});

describe('slide', () => {
  it('left: next enters from left, current exits right', () => {
    const nextStart = getTransitionStyle({type: 'slide', layer: 'next', progress: 0, width: W, height: H, direction: 'left'});
    expect(nextStart.transform).toContain('-1920');

    const currentEnd = getTransitionStyle({type: 'slide', layer: 'current', progress: 1, width: W, height: H, direction: 'left'});
    expect(currentEnd.transform).toContain('1920');
  });

  it('right: next enters from right', () => {
    const nextStart = getTransitionStyle({type: 'slide', layer: 'next', progress: 0, width: W, height: H, direction: 'right'});
    expect(nextStart.transform).toContain('1920');
  });

  it('up: next enters from top', () => {
    const nextStart = getTransitionStyle({type: 'slide', layer: 'next', progress: 0, width: W, height: H, direction: 'up'});
    expect(nextStart.transform).toContain('-1080');
  });

  it('down: next enters from bottom', () => {
    const nextStart = getTransitionStyle({type: 'slide', layer: 'next', progress: 0, width: W, height: H, direction: 'down'});
    expect(nextStart.transform).toContain('1080');
  });

  it('intensity reduces movement', () => {
    const full = getTransitionStyle({type: 'slide', layer: 'next', progress: 0, width: W, height: H, direction: 'left', intensity: 1});
    const half = getTransitionStyle({type: 'slide', layer: 'next', progress: 0, width: W, height: H, direction: 'left', intensity: 0.5});
    expect(half.transform).toContain('-960'); // 1920 * 0.5
    expect(full.transform).toContain('-1920');
  });
});

describe('zoom', () => {
  it('current scales up and fades', () => {
    const style = getTransitionStyle({type: 'zoom', layer: 'current', progress: 1, width: W, height: H, intensity: 1});
    expect(style.opacity).toBeCloseTo(0);
    expect(style.transform).toContain('scale');
  });

  it('next scales in and appears', () => {
    const style = getTransitionStyle({type: 'zoom', layer: 'next', progress: 1, width: W, height: H, intensity: 1});
    expect(style.opacity).toBeCloseTo(1);
    expect(style.transform).toContain('scale(1)');
  });
});

describe('wipe', () => {
  it('current block stays visible', () => {
    const style = getTransitionStyle({type: 'wipe', layer: 'current', progress: 0.5, width: W, height: H, direction: 'left'});
    expect(style).toEqual({});
  });

  it('next block revealed from left', () => {
    const start = getTransitionStyle({type: 'wipe', layer: 'next', progress: 0, width: W, height: H, direction: 'left'});
    expect(start.clipPath).toContain('inset(0 100% 0 0)');

    const mid = getTransitionStyle({type: 'wipe', layer: 'next', progress: 0.5, width: W, height: H, direction: 'left'});
    expect(mid.clipPath).toContain('inset(0 50% 0 0)');

    const end = getTransitionStyle({type: 'wipe', layer: 'next', progress: 1, width: W, height: H, direction: 'left'});
    expect(end.clipPath).toContain('inset(0 0% 0 0)');
  });

  it('directions produce different clip paths', () => {
    const left = getTransitionStyle({type: 'wipe', layer: 'next', progress: 0.5, width: W, height: H, direction: 'left'});
    const right = getTransitionStyle({type: 'wipe', layer: 'next', progress: 0.5, width: W, height: H, direction: 'right'});
    const up = getTransitionStyle({type: 'wipe', layer: 'next', progress: 0.5, width: W, height: H, direction: 'up'});
    const down = getTransitionStyle({type: 'wipe', layer: 'next', progress: 0.5, width: W, height: H, direction: 'down'});

    expect(left.clipPath).not.toBe(right.clipPath);
    expect(up.clipPath).not.toBe(down.clipPath);
  });
});

describe('clamping', () => {
  it('progress is clamped to 0..1', () => {
    const underflow = getTransitionStyle({type: 'crossfade', layer: 'current', progress: -0.5, width: W, height: H});
    const overflow = getTransitionStyle({type: 'crossfade', layer: 'current', progress: 1.5, width: W, height: H});
    expect(underflow.opacity).toBe(1);
    expect(overflow.opacity).toBe(0);
  });
});
