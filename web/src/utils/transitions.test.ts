import {describe, expect, it} from 'vitest';
import {normalizeTransitionConfig} from './transitions';

describe('normalizeTransitionConfig', () => {
  it('uses defaults for missing transition config', () => {
    expect(normalizeTransitionConfig(undefined)).toEqual({
      type: 'crossfade',
      durationFrames: 12,
      easing: 'ease-out',
    });
  });

  it('keeps direction for slide and wipe only', () => {
    expect(normalizeTransitionConfig({type: 'slide', direction: 'up'})).toMatchObject({
      type: 'slide',
      direction: 'up',
    });
    expect(normalizeTransitionConfig({type: 'zoom', direction: 'up'})).not.toHaveProperty('direction');
  });

  it('clamps duration to the UI range and rejects spring easing', () => {
    expect(normalizeTransitionConfig({
      type: 'wipe',
      durationFrames: 90,
      direction: 'right',
      easing: 'spring',
    })).toEqual({
      type: 'wipe',
      durationFrames: 60,
      direction: 'right',
      easing: 'ease-out',
    });
  });
});
