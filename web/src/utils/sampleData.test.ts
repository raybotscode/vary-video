import {describe, expect, it} from 'vitest';
import {sampleDataMap, getSampleDataUrl, getSampleDataLabel} from './sampleData';

describe('sampleDataMap', () => {
  it('covers all non-generic templates', () => {
    const expected = ['InsuranceAd', 'ProductLaunch', 'RealEstate', 'SocialClip', 'WebinarPromo', 'Testimonial', 'EventPromo', 'YouTubeIntro'];
    expect(Object.keys(sampleDataMap).sort()).toEqual(expected.sort());
  });

  it('each entry has filename and label', () => {
    for (const [id, entry] of Object.entries(sampleDataMap)) {
      expect(entry.filename).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe('getSampleDataUrl', () => {
  it('returns null for unknown templates', () => {
    expect(getSampleDataUrl('NonExistent')).toBeNull();
  });

  it('returns correct URL for known templates', () => {
    expect(getSampleDataUrl('RealEstate')).toBe('/samples/real-estate.csv');
    expect(getSampleDataUrl('ProductLaunch')).toBe('/samples/product-launch.csv');
    expect(getSampleDataUrl('SocialClip')).toBe('/samples/social-clip.csv');
    expect(getSampleDataUrl('InsuranceAd')).toBe('/samples/insurance-ad.csv');
    expect(getSampleDataUrl('WebinarPromo')).toBe('/samples/webinar-promo.csv');
    expect(getSampleDataUrl('Testimonial')).toBe('/samples/testimonial.csv');
    expect(getSampleDataUrl('EventPromo')).toBe('/samples/event-promo.csv');
    expect(getSampleDataUrl('YouTubeIntro')).toBe('/samples/youtube-intro.csv');
  });
});

describe('getSampleDataLabel', () => {
  it('returns null for unknown templates', () => {
    expect(getSampleDataLabel('NonExistent')).toBeNull();
  });

  it('returns correct label for known templates', () => {
    expect(getSampleDataLabel('RealEstate')).toBe('Sample Properties');
    expect(getSampleDataLabel('Testimonial')).toBe('Sample Testimonials');
    expect(getSampleDataLabel('EventPromo')).toBe('Sample Events');
    expect(getSampleDataLabel('YouTubeIntro')).toBe('Sample YouTube Intros');
  });
});
