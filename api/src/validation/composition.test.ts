import {describe, expect, it} from 'vitest';
import {
  compositionIdSchema,
  isKnownCompositionId,
  knownCompositionIds,
  validateTemplateForComposition,
} from './composition';

describe('render API composition id validation', () => {
  it('accepts the existing InsuranceAd composition', () => {
    expect(isKnownCompositionId('InsuranceAd')).toBe(true);
    expect(compositionIdSchema.safeParse('InsuranceAd').success).toBe(true);
  });

  it('accepts the new WebinarPromo composition', () => {
    expect(isKnownCompositionId('WebinarPromo')).toBe(true);
    expect(compositionIdSchema.safeParse('WebinarPromo').success).toBe(true);
  });

  it('includes all registry templates plus SceneBlockPlayer', () => {
    expect(knownCompositionIds).toContain('InsuranceAd');
    expect(knownCompositionIds).toContain('ProductLaunch');
    expect(knownCompositionIds).toContain('RealEstate');
    expect(knownCompositionIds).toContain('SocialClip');
    expect(knownCompositionIds).toContain('WebinarPromo');
    expect(knownCompositionIds).toContain('SceneBlockPlayer');
  });

  it('rejects unknown composition ids', () => {
    expect(isKnownCompositionId('NotATemplate')).toBe(false);
    expect(compositionIdSchema.safeParse('NotATemplate').success).toBe(false);
    expect(compositionIdSchema.safeParse('').success).toBe(false);
  });
});

describe('validateTemplateForComposition', () => {
  it('accepts a valid WebinarPromo template with variant data', () => {
    const result = validateTemplateForComposition(
      'WebinarPromo',
      {eventTitleTemplate: 'Custom title'},
      {eventTitle: 'Custom title', hostName: 'Ada'},
    );
    expect(result.success).toBe(true);
  });

  it('rejects a WebinarPromo template with an invalid field type', () => {
    const result = validateTemplateForComposition(
      'WebinarPromo',
      {eventTitleTemplate: 12345},
      {},
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('still accepts a valid InsuranceAd template', () => {
    const result = validateTemplateForComposition(
      'InsuranceAd',
      {headlineTemplate: 'Are you a {{age}} year old {{gender}}?'},
      {age: '52', gender: 'man', location: 'Dublin', company: 'Vary Cover'},
    );
    expect(result.success).toBe(true);
  });

  it('rejects an InsuranceAd template with an invalid field type', () => {
    const result = validateTemplateForComposition(
      'InsuranceAd',
      {headlineTemplate: 9876},
      {},
    );
    expect(result.success).toBe(false);
  });

  it('accepts SceneBlockPlayer with a block sequence', () => {
    const result = validateTemplateForComposition(
      'SceneBlockPlayer',
      {
        blocks: [
          {blockId: 'text-overlay', content: {headline: 'Hello'}},
          {blockId: 'brand-frame', content: {ctaText: 'Go'}},
        ],
        brandSettings: {},
        fps: 30,
        width: 1920,
        height: 1080,
      },
      {},
    );
    expect(result.success).toBe(true);
  });

  it('rejects SceneBlockPlayer with an unknown block id before render', () => {
    const result = validateTemplateForComposition(
      'SceneBlockPlayer',
      {
        blocks: [
          {blockId: 'not-a-real-block', content: {}},
        ],
        brandSettings: {},
      },
      {},
    );
    expect(result.success).toBe(false);
  });
});
