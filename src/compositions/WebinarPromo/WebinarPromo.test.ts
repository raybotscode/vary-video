import {describe, expect, it} from 'vitest';
import {
  compositionSchemaFor,
  webinarPromoSchema,
} from '../../templates/registry';
import {
  defaultWebinarPromoProps,
  webinarPromoCompositionSchema,
} from './schema';

describe('WebinarPromo schema', () => {
  it('parses an empty object into all defaults', () => {
    const props = webinarPromoSchema.parse({});
    expect(props.eventTitleTemplate).toBe('Build a repeatable content engine');
    expect(props.hostNameTemplate).toBe('Hosted by {{hostName}}');
    expect(props.eventDateTemplate).toBe('{{eventDate}}');
    expect(props.eventTimeTemplate).toBe('{{eventTime}}');
    expect(props.audienceTemplate).toBe('For {{audience}}');
    expect(props.keyTakeawayTemplate).toBe('{{keyTakeaway}}');
    expect(props.ctaText).toBe('Reserve your seat');
    expect(props.brandName).toBe('{{brandName}}');
    expect(props.primaryColor).toBe('#2563eb');
    expect(props.accentColor).toBe('#14b8a6');
    expect(props.backgroundColor).toBe('#0f172a');
    expect(props.textColor).toBe('#f8fafc');
    expect(props.seed).toBe('webinar-promo');
  });

  it('fills omitted fields with defaults when given partial input', () => {
    const props = webinarPromoSchema.parse({ctaText: 'Register now'});
    expect(props.ctaText).toBe('Register now');
    expect(props.eventTitleTemplate).toBe('Build a repeatable content engine');
    expect(props.hostNameTemplate).toBe('Hosted by {{hostName}}');
  });

  it('provides webinar-specific default data', () => {
    const props = webinarPromoSchema.parse({});
    expect(props.data.eventTitle).toBe('Build a repeatable content engine');
    expect(props.data.hostName).toBe('Maya Chen');
    expect(props.data.eventDate).toBe('August 22');
    expect(props.data.eventTime).toBe('11:00 AM PT');
    expect(props.data.audience).toBe('growth teams');
    expect(props.data.brandName).toBe('Northstar Labs');
  });

  it('exports composition schema metadata with the right id and defaults', () => {
    expect(webinarPromoCompositionSchema.id).toBe('WebinarPromo');
    expect(webinarPromoCompositionSchema.name).toBe('Webinar Promo');
    expect(webinarPromoCompositionSchema.durationInFrames).toBe(450);
    expect(webinarPromoCompositionSchema.fps).toBe(30);
    expect(webinarPromoCompositionSchema.width).toBe(1920);
    expect(webinarPromoCompositionSchema.height).toBe(1080);
    expect(webinarPromoCompositionSchema.defaults).toEqual(
      defaultWebinarPromoProps,
    );
  });

  it('matches the registry-derived composition schema', () => {
    expect(webinarPromoCompositionSchema).toEqual(
      compositionSchemaFor('WebinarPromo'),
    );
  });
});
