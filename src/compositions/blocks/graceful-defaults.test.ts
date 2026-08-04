import {describe, expect, it} from 'vitest';
import {isBlockContentEmpty} from './emptyCheck';
import {blockCapabilities} from '../../shared/capabilities/blocks';

describe('isBlockContentEmpty', () => {
  const data = {headline: 'Hello World', tagline: 'A tagline', hook: 'Hook text'};

  it('returns false when essential field has data', () => {
    const content = {headline: '{{headline}}'};
    expect(isBlockContentEmpty('text-overlay', content, data)).toBe(false);
  });

  it('returns true when essential field resolves to empty', () => {
    const content = {headline: '{{missing_field}}'};
    expect(isBlockContentEmpty('text-overlay', content, data)).toBe(true);
  });

  it('returns true when essential field is empty string', () => {
    const content = {headline: ''};
    expect(isBlockContentEmpty('text-overlay', content, data)).toBe(true);
  });

  it('returns false when no essential fields are defined (brand-frame)', () => {
    // brand-frame has no essential fields — CTA has a static default
    const content = {ctaText: ''};
    expect(isBlockContentEmpty('brand-frame', content, data)).toBe(false);
  });

  it('returns false for unknown block id', () => {
    expect(isBlockContentEmpty('nonexistent', {}, data)).toBe(false);
  });

  it('returns false when data provides the value', () => {
    const content = {headline: '{{headline}}'};
    expect(isBlockContentEmpty('text-overlay', content, {headline: 'Hi'})).toBe(false);
  });

  it('handles whitespace-only resolved values as empty', () => {
    const content = {headline: '   '};
    expect(isBlockContentEmpty('text-overlay', content, data)).toBe(true);
  });

  it('checks media-image essential field (imageUrl)', () => {
    const content = {imageUrl: '{{image_url}}'};
    expect(isBlockContentEmpty('media-image', content, {})).toBe(true);
    expect(isBlockContentEmpty('media-image', content, {image_url: 'https://example.com/img.jpg'})).toBe(false);
  });

  it('checks data-callout essential field (value)', () => {
    const content = {value: '{{stat}}', label: '{{stat_label}}'};
    expect(isBlockContentEmpty('data-callout', content, {})).toBe(true);
    expect(isBlockContentEmpty('data-callout', content, {stat: '$500K'})).toBe(false);
  });

  it('only checks essential fields — non-essential empty fields do not hide block', () => {
    const content = {hookTemplate: '{{hook}}'};
    expect(isBlockContentEmpty('social-hook', content, {hook: 'Real hook'})).toBe(false);
  });
});

describe('block capabilities essential flags', () => {
  it('all blocks with text content have at least one essential field', () => {
    const textBlocks = blockCapabilities.filter((b) =>
      b.contentFields.some((f) => f.type === 'text'),
    );

    for (const block of textBlocks) {
      const essentialFields = block.contentFields.filter((f) => f.essential);
      // brand-frame is exempt — it has a static CTA default
      if (block.id === 'brand-frame') continue;
      expect(
        essentialFields.length,
        `Block "${block.id}" should have at least one essential text field`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('media-image has imageUrl as essential', () => {
    const mediaImage = blockCapabilities.find((b) => b.id === 'media-image');
    expect(mediaImage).toBeDefined();
    const imageUrlField = mediaImage!.contentFields.find((f) => f.key === 'imageUrl');
    expect(imageUrlField?.essential).toBe(true);
  });
});
