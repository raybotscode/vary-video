import {describe, expect, it} from 'vitest';
import {
  resolvePlaceholders,
  resolvePlaceholderFields,
  extractPlaceholders,
  extractPlaceholdersFromFields,
  resolveAllPlaceholders,
} from './placeholders';

describe('resolvePlaceholders', () => {
  it('resolves simple placeholders', () => {
    expect(resolvePlaceholders('Hello {{name}}!', {name: 'World'})).toBe('Hello World!');
  });

  it('resolves multiple placeholders', () => {
    expect(
      resolvePlaceholders('{{greeting}} {{name}}!', {greeting: 'Hi', name: 'Ray'}),
    ).toBe('Hi Ray!');
  });

  it('preserves unknown tokens in preserve mode (default)', () => {
    expect(resolvePlaceholders('Hello {{unknown}}!', {})).toBe('Hello {{unknown}}!');
  });

  it('empties unknown tokens in empty mode', () => {
    expect(resolvePlaceholders('Hello {{unknown}}!', {}, {missing: 'empty'})).toBe('Hello !');
  });

  it('handles whitespace inside braces', () => {
    expect(resolvePlaceholders('{{ name }}', {name: 'Ray'})).toBe('Ray');
  });

  it('resolves brand color placeholders', () => {
    const data = {brand_color: '#FF0000', secondary_color: '#00FF00'};
    expect(resolvePlaceholders('{{brand_color}}', data)).toBe('#FF0000');
    expect(resolvePlaceholders('{{secondary_color}}', data)).toBe('#00FF00');
  });

  it('resolves media URL placeholders', () => {
    const data = {
      logo_url: 'https://example.com/logo.png',
      property_image_url: 'https://example.com/property.jpg',
    };
    expect(resolvePlaceholders('{{logo_url}}', data)).toBe('https://example.com/logo.png');
    expect(resolvePlaceholders('{{property_image_url}}', data)).toBe(
      'https://example.com/property.jpg',
    );
  });
});

describe('resolvePlaceholderFields', () => {
  it('resolves specified fields only', () => {
    const input = {
      headline: '{{name}} is great',
      tagline: '{{tagline}}',
      other: '{{name}} untouched',
    };
    const data = {name: 'Vary', tagline: 'Video at scale'};
    const result = resolvePlaceholderFields(input, data, ['headline', 'tagline']);
    expect(result.headline).toBe('Vary is great');
    expect(result.tagline).toBe('Video at scale');
    expect(result.other).toBe('{{name}} untouched'); // not in fieldNames
  });

  it('returns original object for non-string fields', () => {
    const input = {count: 42, label: '{{name}}'};
    const result = resolvePlaceholderFields(input, {name: 'Test'}, ['count', 'label']);
    expect(result.count).toBe(42);
    expect(result.label).toBe('Test');
  });
});

describe('extractPlaceholders', () => {
  it('extracts single placeholder', () => {
    expect(extractPlaceholders('Hello {{name}}!')).toEqual(['name']);
  });

  it('extracts multiple unique placeholders', () => {
    expect(extractPlaceholders('{{a}} and {{b}} and {{a}}')).toEqual(['a', 'b']);
  });

  it('returns empty for no placeholders', () => {
    expect(extractPlaceholders('No placeholders here')).toEqual([]);
  });

  it('handles whitespace in keys', () => {
    expect(extractPlaceholders('{{ key }}')).toEqual(['key']);
  });
});

describe('extractPlaceholdersFromFields', () => {
  it('extracts from multiple fields', () => {
    const input = {
      headline: '{{product_name}} launch',
      tagline: '{{tagline}} by {{company}}',
      other: '{{ignored}}',
    };
    const result = extractPlaceholdersFromFields(input, ['headline', 'tagline']);
    expect(result.sort()).toEqual(['company', 'product_name', 'tagline']);
  });
});

describe('resolveAllPlaceholders', () => {
  it('resolves all string values', () => {
    const input = {
      color: '{{brand_color}}',
      url: '{{logo_url}}',
      count: 42,
    };
    const data = {brand_color: '#FFF', logo_url: 'https://example.com/logo.png'};
    const result = resolveAllPlaceholders(input, data);
    expect(result.color).toBe('#FFF');
    expect(result.url).toBe('https://example.com/logo.png');
    expect(result.count).toBe(42);
  });
});
