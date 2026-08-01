import {describe, expect, it} from 'vitest';
import {defaultVariantsForTemplate} from './placeholder';
import {getFrontendTemplate} from './templates';

const webinarPlaceholders = [
  'eventTitle',
  'hostName',
  'eventDate',
  'eventTime',
  'audience',
  'keyTakeaway',
  'ctaText',
  'brandName',
];

describe('defaultVariantsForTemplate', () => {
  it('returns exactly two webinar-specific variants for WebinarPromo', () => {
    const variants = defaultVariantsForTemplate('WebinarPromo');
    expect(variants).toHaveLength(2);
    expect(variants[0].eventTitle).toBe('Build a repeatable content engine');
    expect(variants[1].eventTitle).toBe('From demo to deal: closing the loop');
  });

  it('includes every WebinarPromo placeholder key in each variant', () => {
    const variants = defaultVariantsForTemplate('WebinarPromo');
    for (const placeholder of webinarPlaceholders) {
      expect(variants[0], placeholder).toHaveProperty(placeholder);
      expect(variants[1], placeholder).toHaveProperty(placeholder);
    }
  });

  it('has a frontend template entry with matching placeholders', () => {
    const template = getFrontendTemplate('WebinarPromo');
    expect(template.id).toBe('WebinarPromo');
    expect(template.placeholders).toEqual(webinarPlaceholders);
    expect(template.category).toBe('social');
  });

  it('falls back to InsuranceAd defaults for unknown templates', () => {
    const variants = defaultVariantsForTemplate('NotARealTemplate');
    expect(variants[0]).toHaveProperty('age');
    expect(variants[0]).toHaveProperty('gender');
    expect(variants[0]).toHaveProperty('location');
    expect(variants[0]).toHaveProperty('company');
  });
});
