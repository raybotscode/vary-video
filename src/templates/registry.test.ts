import {describe, expect, it} from 'vitest';
import {
  defaultWebinarPromoProps,
  getAllTemplates,
  getTemplate,
  webinarPromoSchema,
} from './registry';

describe('template registry', () => {
  it('includes WebinarPromo in getAllTemplates', () => {
    const ids = getAllTemplates().map((template) => template.id);
    expect(ids).toContain('WebinarPromo');
  });

  it('produces WebinarPromo default props by parsing an empty object', () => {
    const props = webinarPromoSchema.parse({});
    expect(props.eventTitleTemplate).toBe('Build a repeatable content engine');
    expect(props.ctaText).toBe('Reserve your seat');
    expect(props.primaryColor).toBe('#2563eb');
    expect(props.backgroundColor).toBe('#0f172a');
    expect(defaultWebinarPromoProps.eventTitleTemplate).toBe(
      'Build a repeatable content engine',
    );
  });

  it('defines the WebinarPromo registry entry with expected metadata', () => {
    const template = getTemplate('WebinarPromo');
    expect(template.name).toBe('Webinar Promo');
    expect(template.category).toBe('social');
    expect(template.placeholders).toEqual([
      'eventTitle',
      'hostName',
      'eventDate',
      'eventTime',
      'audience',
      'keyTakeaway',
      'ctaText',
      'brandName',
      'brand_color',
      'secondary_color',
      'accent_color',
      'background_color',
      'logo_url',
      'background_image_url',
      'person2_url',
      'speaker_image_url',
    ]);
    expect(template.blockSequence).toEqual([
      'text-overlay',
      'data-callout',
      'brand-frame',
    ]);
  });

  it('gives WebinarPromo the standard dimensions', () => {
    const template = getTemplate('WebinarPromo');
    expect(template.durationInFrames).toBe(450);
    expect(template.fps).toBe(30);
    expect(template.width).toBe(1920);
    expect(template.height).toBe(1080);
  });

  it('keeps every WebinarPromo copy field aligned with a placeholder', () => {
    const template = getTemplate('WebinarPromo');
    const placeholderSet = new Set(template.placeholders);

    for (const field of template.copyFields) {
      const key = field.id.replace(/Template$/, '');
      expect(placeholderSet.has(key), `copy field '${field.id}' should map to placeholder '${key}'`).toBe(true);
    }
  });

  it('parses partial input with defaults for omitted fields', () => {
    const props = webinarPromoSchema.parse({
      eventTitleTemplate: 'Custom title',
    });
    expect(props.eventTitleTemplate).toBe('Custom title');
    expect(props.hostNameTemplate).toBe('Hosted by {{hostName}}');
    expect(props.eventTimeTemplate).toBe('{{eventTime}}');
    expect(props.audienceTemplate).toBe('For {{audience}}');
  });
});
