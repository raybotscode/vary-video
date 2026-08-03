import {describe, expect, it} from 'vitest';
import {sceneBlockPlayerSchema} from './schema';

const validProps = {
  blocks: [
    {blockId: 'product-intro', content: {headlineTemplate: 'Hi {{name}}'}},
    {blockId: 'brand-frame', content: {ctaText: 'Get started'}},
  ],
  brandSettings: {},
};

describe('sceneBlockPlayerSchema', () => {
  it('accepts a valid existing block sequence', () => {
    const result = sceneBlockPlayerSchema.safeParse(validProps);
    expect(result.success).toBe(true);
  });

  it('rejects an unknown block ID', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{blockId: 'not-a-real-block', content: {}}],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain('Unknown or disabled block id');
    }
  });

  it('rejects an empty blocks array', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [],
    });
    expect(result.success).toBe(false);
  });

  it('validates transitionFrames minimum', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [
        {blockId: 'product-intro', content: {}, transitionFrames: -1},
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all default template block sequences', () => {
    const sequences = [
      ['product-intro', 'features-grid', 'pricing-card', 'brand-frame'],
      ['property-hero', 'property-details', 'agent-cta', 'brand-frame'],
      ['social-hook', 'social-body', 'social-outro', 'brand-frame'],
      ['text-overlay', 'data-callout', 'brand-frame'],
    ];
    for (const blocks of sequences) {
      const result = sceneBlockPlayerSchema.safeParse({
        blocks: blocks.map((blockId) => ({blockId, content: {}})),
        brandSettings: {},
      });
      expect(result.success).toBe(true);
    }
  });
});
