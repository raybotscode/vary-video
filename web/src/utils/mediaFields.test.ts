import {describe, expect, it} from 'vitest';
import {
  getMediaColumnsForTemplate,
  getDefaultMediaValues,
  getDefaultTreatmentForField,
  hasMediaValues,
  validateMediaUrlClient,
} from './mediaFields';

describe('getMediaColumnsForTemplate', () => {
  it('returns empty for no media fields', () => {
    expect(getMediaColumnsForTemplate([])).toHaveLength(0);
  });

  it('returns columns for real estate template', () => {
    const columns = getMediaColumnsForTemplate([
      'image1',
      'person1',
      'logo',
      'backgroundImage',
    ]);
    expect(columns).toHaveLength(4);
    expect(columns.map((c) => c.id).sort()).toEqual([
      'backgroundImage',
      'image1',
      'logo',
      'person1',
    ]);
  });

  it('each column has required fields', () => {
    const columns = getMediaColumnsForTemplate(['logo']);
    expect(columns[0].label).toBe('Logo');
    expect(columns[0].variantKey).toBe('logo_url');
    expect(columns[0].templateProp).toBe('logoUrl');
  });
});

describe('getDefaultMediaValues', () => {
  it('returns empty values for media fields', () => {
    const values = getDefaultMediaValues(['logo', 'backgroundImage']);
    expect(values.logo_url).toBe('');
    expect(values.background_image_url).toBe('');
  });
});

describe('getDefaultTreatmentForField', () => {
  it('returns default treatment for logo', () => {
    const treatment = getDefaultTreatmentForField('logo');
    expect(treatment.fit).toBe('contain');
  });

  it('returns cover for image field', () => {
    const treatment = getDefaultTreatmentForField('image1');
    expect(treatment.fit).toBe('cover');
  });
});

describe('hasMediaValues', () => {
  it('returns false for empty variant', () => {
    expect(hasMediaValues({}, ['logo'])).toBe(false);
  });

  it('returns true for variant with media', () => {
    expect(
      hasMediaValues({logo_url: 'https://example.com/logo.png'}, ['logo']),
    ).toBe(true);
  });
});

describe('validateMediaUrlClient', () => {
  it('passes for empty string', () => {
    expect(validateMediaUrlClient('')).toBeNull();
  });

  it('passes for valid HTTPS URL', () => {
    expect(validateMediaUrlClient('https://example.com/img.png')).toBeNull();
  });

  it('fails for FTP scheme', () => {
    expect(validateMediaUrlClient('ftp://example.com/img.png')).toContain(
      'Invalid URL scheme',
    );
  });

  it('fails for localhost', () => {
    expect(validateMediaUrlClient('http://localhost:3000/img.png')).toContain(
      'Localhost',
    );
  });

  it('fails for invalid URL', () => {
    expect(validateMediaUrlClient('not-a-url')).toContain('Invalid URL');
  });
});
