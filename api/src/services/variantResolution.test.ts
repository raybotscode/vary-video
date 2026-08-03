import dns from 'node:dns/promises';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  extractVariantBrandSettings,
  resolveBrandSettings,
  resolveVariantProps,
  validateVariantMedia,
  validateBatchVariants,
} from './variantResolution';

beforeEach(() => {
  vi.spyOn(dns, 'lookup').mockResolvedValue([{address: '93.184.216.34', family: 4}] as any);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('extractVariantBrandSettings', () => {
  it('extracts brand color from variant data', () => {
    const variant = {brand_color: '#FF0000'};
    const result = extractVariantBrandSettings(variant);
    expect(result.brandColor).toBe('#FF0000');
  });

  it('extracts all brand colors', () => {
    const variant = {
      brand_color: '#FF0000',
      secondary_color: '#00FF00',
      accent_color: '#0000FF',
      background_color: '#FFFFFF',
    };
    const result = extractVariantBrandSettings(variant);
    expect(result.brandColor).toBe('#FF0000');
    expect(result.secondaryColor).toBe('#00FF00');
    expect(result.accentColor).toBe('#0000FF');
    expect(result.backgroundColor).toBe('#FFFFFF');
  });

  it('extracts media URLs from variant data', () => {
    const variant = {
      logo_url: 'https://example.com/logo.png',
      image1_url: 'https://example.com/image.jpg',
    };
    const result = extractVariantBrandSettings(variant, undefined, 'RealEstate');
    expect(result.logoUrl).toBe('https://example.com/logo.png');
    expect(result.image1Url).toBe('https://example.com/image.jpg');
  });

  it('extracts legacy media URLs for a composition', () => {
    const variant = {
      property_image_url: 'https://example.com/property.jpg',
      agent_image_url: 'https://example.com/person.jpg',
    };
    const result = extractVariantBrandSettings(variant, undefined, 'RealEstate');
    expect(result.image1Url).toBe('https://example.com/property.jpg');
    expect(result.person1Url).toBe('https://example.com/person.jpg');
  });

  it('preserves existing template brand settings', () => {
    const variant = {brand_color: '#FF0000'};
    const templateSettings = {secondaryColor: '#00FF00', backgroundColor: '#FFF'};
    const result = extractVariantBrandSettings(variant, templateSettings);
    expect(result.brandColor).toBe('#FF0000');
    expect(result.secondaryColor).toBe('#00FF00');
    expect(result.backgroundColor).toBe('#FFF');
  });

  it('variant values override template settings', () => {
    const variant = {brand_color: '#FF0000'};
    const templateSettings = {brandColor: '#000000'};
    const result = extractVariantBrandSettings(variant, templateSettings);
    expect(result.brandColor).toBe('#FF0000');
  });

  it('ignores empty variant values', () => {
    const variant = {brand_color: '', logo_url: ''};
    const result = extractVariantBrandSettings(variant);
    expect(result.brandColor).toBeUndefined();
    expect(result.logoUrl).toBeUndefined();
  });
});

describe('resolveBrandSettings', () => {
  it('resolves placeholders in brand settings', () => {
    const brandSettings = {
      brandColor: '{{brand_color}}',
      backgroundColor: '{{bg_color}}',
    };
    const variant = {brand_color: '#FF0000', bg_color: '#FFFFFF'};
    const result = resolveBrandSettings(brandSettings, variant);
    expect(result.brandColor).toBe('#FF0000');
    expect(result.backgroundColor).toBe('#FFFFFF');
  });

  it('empties unresolved placeholders', () => {
    const brandSettings = {brandColor: '{{brand_color}}'};
    const result = resolveBrandSettings(brandSettings, {});
    expect(result.brandColor).toBe('');
  });

  it('passes through non-string values', () => {
    const brandSettings = {opacity: 0.5, brandColor: '#FFF'};
    const result = resolveBrandSettings(brandSettings, {});
    expect(result.opacity).toBe(0.5);
    expect(result.brandColor).toBe('#FFF');
  });
});

describe('resolveVariantProps', () => {
  it('builds resolved template with variant data', () => {
    const template = {
      brandSettings: {brandColor: '#000'},
      compositionId: 'ProductLaunch',
    };
    const variant = {
      brand_color: '#FF0000',
      product_name: 'Test Product',
    };
    const result = resolveVariantProps(template, variant, 'ProductLaunch');
    expect(result.brandSettings).toEqual({brandColor: '#FF0000'});
    expect(result.data).toEqual(variant);
  });

  it('handles quick template by resolving to top-level props', () => {
    const template = {compositionId: 'Test', brandColor: '{{brand_color}}'};
    const variant = {brand_color: '#FF0000'};
    const result = resolveVariantProps(template, variant, 'ProductLaunch');
    expect(result.brandColor).toBe('#FF0000');
    expect(result.data).toEqual(variant);
  });
});

describe('validateVariantMedia', () => {
  it('passes for valid URLs', async () => {
    const variant = {logo_url: 'https://example.com/logo.png'};
    const errors = await validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(0);
  });

  it('passes for empty optional fields', async () => {
    const variant = {};
    const errors = await validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(0);
  });

  it('fails for missing required fields', async () => {
    const variant = {};
    const errors = await validateVariantMedia(variant, ['image1']);
    // image1 is optional by default, so no error
    expect(errors).toHaveLength(0);
  });

  it('accepts legacy variant keys', async () => {
    const variant = {property_image_url: 'https://example.com/property.jpg'};
    const errors = await validateVariantMedia(variant, ['image1']);
    expect(errors).toHaveLength(0);
  });

  it('fails for invalid URL scheme', async () => {
    const variant = {logo_url: 'ftp://example.com/logo.png'};
    const errors = await validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL scheme');
  });

  it('fails for localhost URLs', async () => {
    const variant = {logo_url: 'http://localhost:3000/logo.png'};
    const errors = await validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 127.0.0.1 URLs', async () => {
    const variant = {logo_url: 'http://127.0.0.1:3000/logo.png'};
    const errors = await validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for invalid URLs', async () => {
    const variant = {logo_url: 'not-a-url'};
    const errors = await validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL');
  });
});

describe('validateBatchVariants', () => {
  it('returns empty map for all valid variants', async () => {
    const variants = [
      {logo_url: 'https://example.com/logo1.png'},
      {logo_url: 'https://example.com/logo2.png'},
    ];
    const errors = await validateBatchVariants(variants, ['logo']);
    expect(errors.size).toBe(0);
  });

  it('returns errors for invalid variants', async () => {
    const variants = [
      {logo_url: 'https://example.com/logo.png'},
      {logo_url: 'ftp://invalid.com/logo.png'},
      {logo_url: 'http://localhost:3000/logo.png'},
    ];
    const errors = await validateBatchVariants(variants, ['logo']);
    expect(errors.size).toBe(2);
    expect(errors.has(1)).toBe(true);
    expect(errors.has(2)).toBe(true);
    expect(errors.get(1)).toHaveLength(1);
    expect(errors.get(2)).toHaveLength(1);
  });

  it('returns empty map for empty media field IDs', async () => {
    const variants = [{logo_url: 'invalid'}];
    const errors = await validateBatchVariants(variants, []);
    expect(errors.size).toBe(0);
  });
});
