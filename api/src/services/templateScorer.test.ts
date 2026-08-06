import {describe, expect, it} from 'vitest';
import {scoreTemplates, type ScoredTemplate} from './templateScorer';

describe('templateScorer', () => {
  it('scores real estate prompts highest for RealEstate template', () => {
    const results = scoreTemplates('make a real estate video for a house in Dublin');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].template.id).toBe('RealEstate');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('scores product prompts highest for ProductLaunch template', () => {
    const results = scoreTemplates('product launch video for a new SaaS app');
    expect(results[0].template.id).toBe('ProductLaunch');
  });

  it('scores social prompts highest for SocialClip template', () => {
    const results = scoreTemplates('short social media clip with a bold hook');
    expect(results[0].template.id).toBe('SocialClip');
  });

  it('scores insurance prompts highest for InsuranceAd template', () => {
    const results = scoreTemplates('insurance quote ad for Dublin');
    expect(results[0].template.id).toBe('InsuranceAd');
  });

  it('scores webinar prompts highest for WebinarPromo template', () => {
    const results = scoreTemplates('webinar promo for a B2B event');
    expect(results[0].template.id).toBe('WebinarPromo');
  });

  it('returns at most limit results', () => {
    const results = scoreTemplates('video', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns all templates when prompt is empty', () => {
    const results = scoreTemplates('', 20);
    expect(results.length).toBe(5); // all 5 enabled templates
  });

  it('includes matched keywords in results', () => {
    const results = scoreTemplates('property listing video');
    expect(results[0].matchedKeywords.length).toBeGreaterThan(0);
  });

  it('handles generic prompts gracefully', () => {
    const results = scoreTemplates('make a cool video');
    // Should still return results, just with lower scores
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThanOrEqual(0);
  });
});
