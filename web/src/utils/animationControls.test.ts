import {describe, expect, it} from 'vitest';
import {animationPresetCapabilities} from '@vary/shared/capabilities/animations';
import {
  animationOptionsForDirection,
  easingOptionsForPreset,
  normalizeAnimationSettings,
} from './animationControls';

describe('animationControls', () => {
  it('filters entry and exit options by direction while keeping none', () => {
    expect(animationOptionsForDirection(animationPresetCapabilities, 'in').map((preset) => preset.id)).toEqual([
      'none',
      'fade-in',
      'slide-in-left',
      'slide-in-right',
      'slide-in-up',
      'slide-in-down',
      'zoom-in',
      'bounce-in',
    ]);
    expect(animationOptionsForDirection(animationPresetCapabilities, 'out').map((preset) => preset.id)).toEqual([
      'none',
      'fade-out',
    ]);
  });

  it('normalizes config ranges and removes none animations', () => {
    const normalized = normalizeAnimationSettings(
      {
        entry: {presetId: 'slide-in-left', durationFrames: 90, intensity: 2, easing: 'spring'},
        exit: {presetId: 'none', durationFrames: 12},
      },
      animationPresetCapabilities,
    );

    expect(normalized).toEqual({
      entry: {
        presetId: 'slide-in-left',
        durationFrames: 60,
        intensity: 1,
        easing: 'spring',
      },
      exit: undefined,
    });
  });

  it('omits zero durations so optional defaults can apply', () => {
    const normalized = normalizeAnimationSettings(
      {entry: {presetId: 'fade-in', durationFrames: 0}},
      animationPresetCapabilities,
    );

    expect(normalized?.entry).toEqual({presetId: 'fade-in', easing: 'ease-out'});
  });

  it('limits bounce-in easing to spring', () => {
    const bounce = animationPresetCapabilities.find((preset) => preset.id === 'bounce-in');

    expect(easingOptionsForPreset(bounce)).toEqual(['spring']);
  });
});
