import {describe, it, expect} from 'vitest';
import {z} from 'zod';

// Test the preview request schema and resolution logic
describe('Preview endpoint', () => {
  const previewRequestSchema = z.object({
    template: z.record(z.string(), z.unknown()),
    compositionId: z.string().default('SceneBlockPlayer'),
    frame: z.number().int().min(0).default(0),
    variant: z.record(z.string(), z.string()).default({}),
  });

  it('accepts quick template payload (no blocks/brandSettings)', () => {
    const result = previewRequestSchema.safeParse({
      compositionId: 'InsuranceAd',
      template: {
        brandColor: '#1A365D',
        headlineTemplate: 'Hello',
        ctaText: 'Click Here',
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.compositionId).toBe('InsuranceAd');
      expect(result.data.frame).toBe(0);
      expect(result.data.variant).toEqual({});
    }
  });

  it('accepts composer payload (with blocks/brandSettings)', () => {
    const result = previewRequestSchema.safeParse({
      compositionId: 'SceneBlockPlayer',
      template: {
        fps: 30,
        width: 1080,
        height: 1920,
        brandSettings: {brandColor: '#000'},
        blocks: [{blockId: 'brand-frame', content: {}, durationFrames: 90}],
      },
    });
    expect(result.success).toBe(true);
  });

  it('defaults frame to 0 and variant to empty', () => {
    const result = previewRequestSchema.safeParse({
      template: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frame).toBe(0);
      expect(result.data.variant).toEqual({});
      expect(result.data.compositionId).toBe('SceneBlockPlayer');
    }
  });

  it('rejects negative frame numbers', () => {
    const result = previewRequestSchema.safeParse({
      template: {},
      frame: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer frames', () => {
    const result = previewRequestSchema.safeParse({
      template: {},
      frame: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('Preview resolution cap', () => {
  const capResolution = (width: number, height: number, maxLongEdge = 720) => {
    const longEdge = Math.max(width, height);
    if (longEdge <= maxLongEdge) return {width, height};
    const scale = maxLongEdge / longEdge;
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  };

  it('caps landscape at 720px wide', () => {
    const result = capResolution(1920, 1080);
    expect(result.width).toBe(720);
    expect(result.height).toBe(405);
  });

  it('caps portrait at 720px tall', () => {
    const result = capResolution(1080, 1920);
    expect(result.width).toBe(405);
    expect(result.height).toBe(720);
  });

  it('caps square at 720x720', () => {
    const result = capResolution(1080, 1080);
    expect(result.width).toBe(720);
    expect(result.height).toBe(720);
  });

  it('does not upscale small resolutions', () => {
    const result = capResolution(480, 360);
    expect(result.width).toBe(480);
    expect(result.height).toBe(360);
  });

  it('preserves aspect ratio for 4:5', () => {
    const result = capResolution(1080, 1350);
    expect(result.width).toBe(576);
    expect(result.height).toBe(720);
  });
});
