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

  it('accepts animation entry and exit config', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        animation: {
          entry: {presetId: 'fade-in', durationFrames: 12, intensity: 0.5, easing: 'ease-out'},
          exit: {presetId: 'fade-out', durationFrames: 8},
        },
      }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts transition config', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        transition: {type: 'slide', durationFrames: 15, direction: 'left', easing: 'ease-in-out'},
      }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts backward-compatible transitionFrames alongside new transition', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        transitionFrames: 12,
        transition: {type: 'crossfade', durationFrames: 15},
      }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid easing value', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        animation: {entry: {presetId: 'fade-in', easing: 'invalid-easing'}},
      }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid transition type', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        transition: {type: 'invalid', durationFrames: 12},
      }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative animation duration', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        animation: {entry: {presetId: 'fade-in', durationFrames: -1}},
      }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects intensity outside 0..1 for animation', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      blocks: [{
        blockId: 'product-intro',
        content: {},
        animation: {entry: {presetId: 'zoom-in', intensity: 1.5}},
      }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid audio config', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/job1/music.mp3'},
    });
    expect(result.success).toBe(true);
  });

  it('defaults audio volume to 0.3', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/test.mp3'},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audio?.volume).toBe(0.3);
    }
  });

  it('defaults audio fadeIn to 2 and fadeOut to 2', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/test.mp3'},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audio?.fadeIn).toBe(2);
      expect(result.data.audio?.fadeOut).toBe(2);
    }
  });

  it('rejects audio volume > 1', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/test.mp3', volume: 1.5},
    });
    expect(result.success).toBe(false);
  });

  it('rejects audio volume < 0', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/test.mp3', volume: -0.1},
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative audio fadeIn', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/test.mp3', fadeIn: -1},
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative audio startOffset', () => {
    const result = sceneBlockPlayerSchema.safeParse({
      ...validProps,
      audio: {src: '/audio/test.mp3', startOffset: -5},
    });
    expect(result.success).toBe(false);
  });

  it('accepts block-only payloads without audio', () => {
    const result = sceneBlockPlayerSchema.safeParse(validProps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audio).toBeUndefined();
    }
  });
});
