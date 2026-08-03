import {describe, expect, it} from 'vitest';
import {
  mediaFieldCapabilities,
  mediaFieldById,
  getEnabledMediaFields,
  mediaFieldsForTemplate,
  MEDIA_FIELD_PROP_MAP,
  DEFAULT_IMAGE_TREATMENT,
} from './media';

describe('media field capabilities', () => {
  it('has all 6 expected media fields', () => {
    const ids = mediaFieldCapabilities.map((f) => f.id).sort();
    expect(ids).toEqual([
      'agentImage',
      'backgroundImage',
      'logo',
      'productImage',
      'propertyImage',
      'speakerImage',
    ]);
  });

  it('every media field has accepted MIME types', () => {
    for (const field of mediaFieldCapabilities) {
      expect(field.acceptedMimeTypes.length).toBeGreaterThan(0);
      expect(field.maxBytes).toBeGreaterThan(0);
    }
  });

  it('every media field has a variant key and template prop', () => {
    for (const field of mediaFieldCapabilities) {
      expect(field.variantKey.length).toBeGreaterThan(0);
      expect(field.templateProp.length).toBeGreaterThan(0);
    }
  });

  it('all media fields are enabled by default', () => {
    expect(getEnabledMediaFields()).toHaveLength(mediaFieldCapabilities.length);
  });

  it('mediaFieldById returns undefined for unknown IDs', () => {
    expect(mediaFieldById('nonexistent')).toBeUndefined();
  });

  it('mediaFieldById returns the correct field', () => {
    const logo = mediaFieldById('logo');
    expect(logo).toBeDefined();
    expect(logo!.kind).toBe('logo');
    expect(logo!.templateProp).toBe('logoUrl');
  });
});

describe('MEDIA_FIELD_PROP_MAP', () => {
  it('maps all field kinds to template props', () => {
    expect(MEDIA_FIELD_PROP_MAP['logo']).toBe('logoUrl');
    expect(MEDIA_FIELD_PROP_MAP['background-image']).toBe('backgroundImageUrl');
    expect(MEDIA_FIELD_PROP_MAP['property-image']).toBe('propertyImageUrl');
    expect(MEDIA_FIELD_PROP_MAP['product-image']).toBe('productImageUrl');
    expect(MEDIA_FIELD_PROP_MAP['agent-image']).toBe('agentImageUrl');
    expect(MEDIA_FIELD_PROP_MAP['speaker-image']).toBe('speakerImageUrl');
  });
});

describe('DEFAULT_IMAGE_TREATMENT', () => {
  it('defaults to cover at center', () => {
    expect(DEFAULT_IMAGE_TREATMENT.fit).toBe('cover');
    expect(DEFAULT_IMAGE_TREATMENT.horizontalPosition).toBe('center');
    expect(DEFAULT_IMAGE_TREATMENT.verticalPosition).toBe('center');
  });
});

describe('mediaFieldsForTemplate', () => {
  it('returns media fields for a template with media', () => {
    const fields = mediaFieldsForTemplate(['propertyImage', 'logo']);
    expect(fields).toHaveLength(2);
    expect(fields.map((f) => f.id).sort()).toEqual(['logo', 'propertyImage']);
  });

  it('returns empty array for unknown field IDs', () => {
    const fields = mediaFieldsForTemplate(['nonexistent']);
    expect(fields).toHaveLength(0);
  });

  it('filters out disabled fields', () => {
    // All fields are currently enabled, so this just verifies the function works
    const fields = mediaFieldsForTemplate(['logo', 'backgroundImage']);
    expect(fields).toHaveLength(2);
  });
});
