import {describe, expect, it} from 'vitest';
import type {StylePresetCapability} from '@vary/shared/capabilities/types';
import {stylePresetCapabilities} from '@vary/shared/capabilities/styles';
import {stylePresetToTemplatePatch} from './stylePresets';

describe('stylePresetToTemplatePatch', () => {
  it('maps preset colors to brand settings', () => {
    const patch = stylePresetToTemplatePatch(stylePresetCapabilities[0]);

    expect(patch).toEqual({
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#FF6B5B',
      backgroundColor: '#F7FAFC',
      backgroundType: 'gradient',
    });
  });

  it('maps solid treatment to solid background type', () => {
    const webinar = stylePresetCapabilities.find((style) => style.id === 'webinar-dark');

    expect(webinar).toBeDefined();
    expect(stylePresetToTemplatePatch(webinar!).backgroundType).toBe('solid');
  });

  it('does not include media or logo fields in the patch', () => {
    const style: StylePresetCapability = {
      ...stylePresetCapabilities[0],
      colors: {
        primary: '#000000',
        secondary: '#111111',
        accent: '#222222',
        background: '#333333',
      },
    };

    expect(stylePresetToTemplatePatch(style)).not.toHaveProperty('logoUrl');
    expect(stylePresetToTemplatePatch(style)).not.toHaveProperty('backgroundImageUrl');
    expect(stylePresetToTemplatePatch(style)).not.toHaveProperty('productImageUrl');
  });
});
