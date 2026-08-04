import {describe, expect, it} from 'vitest';
import {sampleDataMap, getSampleDataUrl, getSampleDataLabel} from './sampleData';

describe('sampleDataMap', () => {
  it('covers all non-generic templates', () => {
    const expected = ['InsuranceAd', 'ProductLaunch', 'RealEstate', 'SocialClip', 'WebinarPromo'];
    expect(Object.keys(sampleDataMap).sort()).toEqual(expected.sort());
  });

  it('each entry has filename and label', () => {
    for (const [id, entry] of Object.entries(sampleDataMap)) {
      expect(entry.filename).toBeTruthy();
      expect(entry.filename).toMatch(/\.csv$/);
      expect(entry.label).toBeTruthy();
    }
  });
});

describe('getSampleDataUrl', () => {
  it('returns correct URL for known templates', () => {
    expect(getSampleDataUrl('RealEstate')).toBe('/samples/real-estate.csv');
    expect(getSampleDataUrl('ProductLaunch')).toBe('/samples/product-launch.csv');
    expect(getSampleDataUrl('SocialClip')).toBe('/samples/social-clip.csv');
    expect(getSampleDataUrl('InsuranceAd')).toBe('/samples/insurance-ad.csv');
    expect(getSampleDataUrl('WebinarPromo')).toBe('/samples/webinar-promo.csv');
  });

  it('returns null for unknown template', () => {
    expect(getSampleDataUrl('SceneBlockPlayer')).toBeNull();
    expect(getSampleDataUrl('NonExistent')).toBeNull();
    expect(getSampleDataUrl('')).toBeNull();
  });
});

describe('getSampleDataLabel', () => {
  it('returns label for known templates', () => {
    expect(getSampleDataLabel('RealEstate')).toBe('Sample Properties');
    expect(getSampleDataLabel('ProductLaunch')).toBe('Sample Products');
  });

  it('returns null for unknown template', () => {
    expect(getSampleDataLabel('SceneBlockPlayer')).toBeNull();
  });
});
