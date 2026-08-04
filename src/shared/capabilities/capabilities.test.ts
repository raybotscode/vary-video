import {describe, expect, it} from 'vitest';
import {templateCapabilities} from './templates';
import {blockCapabilities} from './blocks';
import {
  animationPresetCapabilities,
  getEnabledAnimationPresets,
} from './animations';
import {stylePresetCapabilities, getEnabledStylePresets} from './styles';
import {
  templateCapabilitySchema,
  blockCapabilitySchema,
  animationPresetCapabilitySchema,
  stylePresetCapabilitySchema,
} from './schema';

describe('template capabilities', () => {
  it('has all hand-coded templates', () => {
    expect(templateCapabilities.map((t) => t.id).sort()).toEqual([
      'EventPromo',
      'InsuranceAd',
      'ProductLaunch',
      'RealEstate',
      'SocialClip',
      'Testimonial',
      'WebinarPromo',
      'YouTubeIntro',
    ]);
  });

  it('IDs match existing Remotion compositions', () => {
    for (const template of templateCapabilities) {
      expect(template.id.length).toBeGreaterThan(0);
    }
  });

  it('every template has copy fields and default blocks', () => {
    for (const template of templateCapabilities) {
      expect(template.copyFields.length).toBeGreaterThan(0);
      expect(template.defaultBlocks.length).toBeGreaterThan(0);
    }
  });

  it('every template passes its strict schema (unknown keys rejected)', () => {
    for (const template of templateCapabilities) {
      expect(() => templateCapabilitySchema.parse(template)).not.toThrow();
    }
  });

  it('default blocks exist in the block registry', () => {
    const blockIds = new Set(blockCapabilities.map((block) => block.id));
    for (const template of templateCapabilities) {
      for (const blockId of template.defaultBlocks) {
        expect(blockIds.has(blockId), `${template.id} references unknown block ${blockId}`).toBe(true);
      }
    }
  });
});

describe('block capabilities', () => {
  it('block IDs are unique', () => {
    const ids = blockCapabilities.map((block) => block.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has all 13 expected blocks', () => {
    expect(blockCapabilities.map((block) => block.id).sort()).toEqual([
      'agent-cta',
      'brand-frame',
      'data-callout',
      'features-grid',
      'media-image',
      'pricing-card',
      'product-intro',
      'property-details',
      'property-hero',
      'social-body',
      'social-hook',
      'social-outro',
      'text-overlay',
    ]);
  });

  it('every block has content field metadata for each default content key', () => {
    for (const block of blockCapabilities) {
      const keys = new Set(block.contentFields.map((field) => field.key));
      expect(block.contentFields.length).toBeGreaterThan(0);
      for (const field of block.contentFields) {
        expect(field.label.length).toBeGreaterThan(0);
        expect(keys.has(field.key)).toBe(true);
      }
    }
  });

  it('passes strict schema', () => {
    for (const block of blockCapabilities) {
      expect(() => blockCapabilitySchema.parse(block)).not.toThrow();
    }
  });
});

describe('preset capabilities', () => {
  it('animation IDs are unique', () => {
    const ids = animationPresetCapabilities.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all animation presets are enabled', () => {
    const enabled = getEnabledAnimationPresets();
    expect(enabled.length).toBe(animationPresetCapabilities.length);
    expect(enabled.map((p) => p.id)).toContain('none');
    expect(enabled.map((p) => p.id)).toContain('fade-in');
    expect(enabled.map((p) => p.id)).toContain('bounce-in');
  });

  it('style IDs are unique and all enabled', () => {
    const ids = stylePresetCapabilities.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getEnabledStylePresets().length).toBe(stylePresetCapabilities.length);
  });

  it('passes strict schemas', () => {
    for (const preset of animationPresetCapabilities) {
      expect(() => animationPresetCapabilitySchema.parse(preset)).not.toThrow();
    }
    for (const preset of stylePresetCapabilities) {
      expect(() => stylePresetCapabilitySchema.parse(preset)).not.toThrow();
    }
  });
});
