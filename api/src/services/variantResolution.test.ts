import {describe, expect, it} from 'vitest';
import {
  extractVariantBrandSettings,
  resolveBrandSettings,
  resolveVariantProps,
  validateVariantMedia,
  validateBatchVariants,
} from './variantResolution';

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
      property_image_url: 'https://example.com/property.jpg',
    };
    const result = extractVariantBrandSettings(variant);
    expect(result.logoUrl).toBe('https://example.com/logo.png');
    expect(result.propertyImageUrl).toBe('https://example.com/property.jpg');
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
    const result = resolveVariantProps(template, variant);
    expect(result.brandSettings).toEqual({brandColor: '#FF0000'});
    expect(result.data).toEqual(variant);
  });

  it('handles template without brand settings', () => {
    const template = {compositionId: 'Test'};
    const variant = {brand_color: '#FF0000'};
    const result = resolveVariantProps(template, variant);
    expect(result.brandSettings).toEqual({brandColor: '#FF0000'});
  });
});

describe('validateVariantMedia', () => {
  it('passes for valid URLs', () => {
    const variant = {logo_url: 'https://example.com/logo.png'};
    const errors = validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(0);
  });

  it('passes for empty optional fields', () => {
    const variant = {};
    const errors = validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(0);
  });

  it('fails for missing required fields', () => {
    const variant = {};
    const errors = validateVariantMedia(variant, ['propertyImage']);
    // propertyImage is optional by default, so no error
    expect(errors).toHaveLength(0);
  });

  it('fails for invalid URL scheme', () => {
    const variant = {logo_url: 'ftp://example.com/logo.png'};
    const errors = validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('invalid URL scheme');
  });

  it('fails for localhost URLs', () => {
    const variant = {logo_url: 'http://localhost:3000/logo.png'};
    const errors = validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('localhost');
  });

  it('fails for 127.0.0.1 URLs', () => {
    const variant = {logo_url: 'http://127.0.0.1:3000/logo.png'};
    const errors = validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('localhost');
  });

  it('fails for invalid URLs', () => {
    const variant = {logo_url: 'not-a-url'};
    const errors = validateVariantMedia(variant, ['logo']);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('invalid URL');
  });
});

describe('validateBatchVariants', () => {
  it('returns empty map for all valid variants', () => {
    const variants = [
      {logo_url: 'https://example.com/logo1.png'},
      {logo_url: 'https://example.com/logo2.png'},
    ];
    const errors = validateBatchVariants(variants, ['logo']);
    expect(errors.size).toBe(0);
  });

  it('returns errors for invalid variants', () => {
    const variants = [
      {logo_url: 'https://example.com/logo.png'},
      {logo_url: 'ftp://invalid.com/logo.png'},
      {logo_url: 'http://localhost:3000/logo.png'},
    ];
    const errors = validateBatchVariants(variants, ['logo']);
    expect(errors.size).toBe(2);
    expect(errors.has(1)).toBe(true);
    expect(errors.has(2)).toBe(true);
    expect(errors.get(1)).toHaveLength(1);
    expect(errors.get(2)).toHaveLength(1);
  });

  it('returns empty map for empty media field IDs', () => {
    const variants = [{logo_url: 'invalid'}];
    const errors = validateBatchVariants(variants, []);
    expect(errors.size).toBe(0);
  });
});
