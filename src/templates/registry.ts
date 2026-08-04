import {z, type ZodType} from 'zod';
import {templateCapabilities} from '../shared/capabilities/templates';
import {sceneBlockPlayerSchema as sceneBlockPlayerTemplateSchema} from '../compositions/SceneBlockPlayer/schema';
import {
  defaultInsuranceAdProps,
  insuranceAdSchema,
} from '../compositions/InsuranceAd/schema';

export type TemplateCategory = 'ad' | 'social' | 'property' | 'product';

export type TemplateCopyField = {
  id: string;
  label: string;
  default: string;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  useCase: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  schema: ZodType<any>;
  defaultProps: Record<string, unknown>;
  placeholders: string[];
  copyFields: TemplateCopyField[];
  category: TemplateCategory;
  blockSequence: string[];
};

const commonBackgroundFields = {
  brandColor: z.string().default('#1A365D'),
  secondaryColor: z.string().default('#3182CE'),
  logoUrl: z.string().default(''),
  backgroundType: z.enum(['solid', 'gradient', 'image']).default('gradient'),
  backgroundColor: z.string().default('#1A365D'),
  backgroundImageUrl: z.string().optional(),
};

// Canonical SceneBlockPlayer schema — imported from the composition schema so
// this registry cannot drift from runtime validation (includes blockId
// known-block validation). Kept under this name for API validation compat.
export {sceneBlockPlayerTemplateSchema};

export const productLaunchSchema = z.object({
  headlineTemplate: z.string().default('Introducing {{product_name}}'),
  taglineTemplate: z.string().default('{{tagline}}'),
  feature1Template: z.string().default('{{feature1}}'),
  feature2Template: z.string().default('{{feature2}}'),
  feature3Template: z.string().default('{{feature3}}'),
  data: z.record(z.string(), z.string()).default({
    product_name: 'Vary Studio',
    tagline: 'Launch campaign videos in minutes',
    feature1: 'Personalized copy at scale',
    feature2: 'On-brand motion templates',
    feature3: 'Batch renders for every segment',
    company: 'Vary.video',
  }),
  ctaText: z.string().default('Get Started Today'),
  ...commonBackgroundFields,
  accentColor: z.string().default('#FF6B5B'),
  productImageUrl: z.string().optional(),
  image1Url: z.string().optional(),
  image2Url: z.string().optional(),
});

export type ProductLaunchProps = z.infer<typeof productLaunchSchema>;

export const defaultProductLaunchProps: ProductLaunchProps =
  productLaunchSchema.parse({});

export const realEstateSchema = z.object({
  headlineTemplate: z.string().default('{{property_name}}'),
  taglineTemplate: z.string().default('{{tagline}}'),
  priceTemplate: z.string().default('{{price}}'),
  specsLine: z
    .string()
    .default('{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft'),
  locationLine: z.string().default('{{location}}'),
  data: z.record(z.string(), z.string()).default({
    property_name: 'The Elm Residence',
    tagline: 'Light-filled family living near the city',
    price: '€745,000',
    bedrooms: '4',
    bathrooms: '3',
    sqft: '2,180',
    location: 'Rathmines, Dublin',
    agent: 'Maeve Kelly',
  }),
  ctaText: z.string().default('Schedule a Viewing'),
  ...commonBackgroundFields,
  accentColor: z.string().default('#38A169'),
  propertyImageUrl: z.string().optional(),
  image1Url: z.string().optional(),
  person1Url: z.string().optional(),
});

export type RealEstateProps = z.infer<typeof realEstateSchema>;

export const defaultRealEstateProps: RealEstateProps = realEstateSchema.parse({});

export const socialClipSchema = z.object({
  hookTemplate: z.string().default('{{hook}}'),
  bodyTemplate: z.string().default('{{body}}'),
  data: z.record(z.string(), z.string()).default({
    hook: 'Stop making one ad for every audience',
    body: 'Turn one idea into personalized clips for every campaign segment.',
    cta: 'Create your batch',
    brand: 'Vary.video',
  }),
  ctaText: z.string().default('{{cta}}'),
  ...commonBackgroundFields,
  accentColor: z.string().default('#9F7AEA'),
});

export type SocialClipProps = z.infer<typeof socialClipSchema>;

export const defaultSocialClipProps: SocialClipProps = socialClipSchema.parse({});

export const webinarPromoSchema = z.object({
  eventTitleTemplate: z.string().default('Build a repeatable content engine'),
  hostNameTemplate: z.string().default('Hosted by {{hostName}}'),
  eventDateTemplate: z.string().default('{{eventDate}}'),
  eventTimeTemplate: z.string().default('{{eventTime}}'),
  audienceTemplate: z.string().default('For {{audience}}'),
  keyTakeawayTemplate: z.string().default('{{keyTakeaway}}'),
  ctaText: z.string().default('Reserve your seat'),
  brandName: z.string().default('{{brandName}}'),
  data: z.record(z.string(), z.string()).default({
    eventTitle: 'Build a repeatable content engine',
    hostName: 'Maya Chen',
    eventDate: 'August 22',
    eventTime: '11:00 AM PT',
    audience: 'growth teams',
    keyTakeaway: 'Turn one live session into a month of campaigns',
    ctaText: 'Reserve your seat',
    brandName: 'Northstar Labs',
  }),
  primaryColor: z.string().default('#2563eb'),
  accentColor: z.string().default('#14b8a6'),
  backgroundColor: z.string().default('#0f172a'),
  textColor: z.string().default('#f8fafc'),
  seed: z.string().default('webinar-promo'),
});

export type WebinarPromoProps = z.infer<typeof webinarPromoSchema>;

export const defaultWebinarPromoProps: WebinarPromoProps =
  webinarPromoSchema.parse({});

// ── Testimonial ──────────────────────────────────────────────────

export const testimonialSchema = z.object({
  quoteTemplate: z.string().default('{{quote}}'),
  customerNameTemplate: z.string().default('{{customer_name}}'),
  customerTitleTemplate: z.string().default('{{customer_title}}'),
  ctaText: z.string().default('See More Reviews'),
  data: z.record(z.string(), z.string()).default({
    quote: 'This product changed how we work. Absolutely recommend it.',
    customer_name: 'Sarah Johnson',
    customer_title: 'Head of Marketing, Acme Corp',
    company: 'Acme Corp',
  }),
  ...commonBackgroundFields,
  accentColor: z.string().default('#10B981'),
  person1Url: z.string().optional(),
});

export type TestimonialProps = z.infer<typeof testimonialSchema>;

export const defaultTestimonialProps: TestimonialProps = testimonialSchema.parse({});

// ── Event Promo ──────────────────────────────────────────────────

export const eventPromoSchema = z.object({
  eventNameTemplate: z.string().default('{{event_name}}'),
  eventDateTemplate: z.string().default('{{event_date}}'),
  eventLocationTemplate: z.string().default('{{event_location}}'),
  highlightTemplate: z.string().default('{{highlight}}'),
  ctaText: z.string().default('Get Tickets'),
  data: z.record(z.string(), z.string()).default({
    event_name: 'Design Summit 2026',
    event_date: 'September 15-16',
    event_location: 'Dublin, Ireland',
    highlight: '50+ speakers, 2 days of workshops',
    cta: 'Get Tickets',
  }),
  ...commonBackgroundFields,
  accentColor: z.string().default('#F59E0B'),
  image1Url: z.string().optional(),
});

export type EventPromoProps = z.infer<typeof eventPromoSchema>;

export const defaultEventPromoProps: EventPromoProps = eventPromoSchema.parse({});

// ── YouTube Intro ────────────────────────────────────────────────

export const youTubeIntroSchema = z.object({
  channelNameTemplate: z.string().default('{{channel_name}}'),
  seriesNameTemplate: z.string().default('{{series_name}}'),
  episodeTitleTemplate: z.string().default('{{episode_title}}'),
  hookTemplate: z.string().default('{{hook}}'),
  ctaText: z.string().default('Subscribe'),
  data: z.record(z.string(), z.string()).default({
    channel_name: 'Tech Insights',
    series_name: 'Build Log',
    episode_title: 'Episode 1: Getting Started',
    hook: 'Building something amazing from scratch',
  }),
  ...commonBackgroundFields,
  accentColor: z.string().default('#EF4444'),
  image1Url: z.string().optional(),
});

export type YouTubeIntroProps = z.infer<typeof youTubeIntroSchema>;

export const defaultYouTubeIntroProps: YouTubeIntroProps = youTubeIntroSchema.parse({});

// ── Dimensions & Registry ────────────────────────────────────────

const dimensions = {
  durationInFrames: 450,
  fps: 30,
  width: 1920,
  height: 1080,
};

/** Runtime-only attachments: Zod schema + Remotion default props per template. */
const runtimeAttachments: Record<
  string,
  {schema: ZodType<any>; defaultProps: Record<string, unknown>}
> = {
  InsuranceAd: {
    schema: insuranceAdSchema,
    defaultProps: defaultInsuranceAdProps,
  },
  ProductLaunch: {
    schema: productLaunchSchema,
    defaultProps: defaultProductLaunchProps,
  },
  RealEstate: {
    schema: realEstateSchema,
    defaultProps: defaultRealEstateProps,
  },
  SocialClip: {
    schema: socialClipSchema,
    defaultProps: defaultSocialClipProps,
  },
  WebinarPromo: {
    schema: webinarPromoSchema,
    defaultProps: defaultWebinarPromoProps,
  },
  Testimonial: {
    schema: testimonialSchema,
    defaultProps: defaultTestimonialProps,
  },
  EventPromo: {
    schema: eventPromoSchema,
    defaultProps: defaultEventPromoProps,
  },
  YouTubeIntro: {
    schema: youTubeIntroSchema,
    defaultProps: defaultYouTubeIntroProps,
  },
};

export const templateRegistry: Record<string, TemplateDefinition> =
  Object.fromEntries(
    templateCapabilities.map((capability) => {
      const runtime = runtimeAttachments[capability.id];
      if (!runtime) {
        throw new Error(`Missing runtime attachment for template ${capability.id}`);
      }

      return [
        capability.id,
        {
          id: capability.id,
          name: capability.name,
          description: capability.description,
          useCase: capability.useCase,
          ...dimensions,
          schema: runtime.schema,
          defaultProps: runtime.defaultProps,
          placeholders: [
            ...capability.requiredPlaceholders,
            ...capability.optionalPlaceholders,
          ],
          copyFields: capability.copyFields,
          category: capability.category,
          blockSequence: capability.defaultBlocks,
        },
      ];
    }),
  );

export const getTemplate = (id: string): TemplateDefinition => {
  const template = templateRegistry[id];
  if (!template) {
    throw new Error(`Unknown template: ${id}`);
  }

  return template;
};

export const getAllTemplates = (): TemplateDefinition[] =>
  Object.values(templateRegistry);

export const getTemplatePlaceholders = (id: string): string[] =>
  getTemplate(id).placeholders;

export const getBlockSequence = (templateId: string): string[] =>
  getTemplate(templateId).blockSequence;

export const getSchemaForTemplate = (id: string): ZodType<any> => {
  if (id === 'SceneBlockPlayer') {
    return sceneBlockPlayerTemplateSchema;
  }

  return getTemplate(id).schema;
};

export const makeDefaultProps = (
  id: string,
  variant: Record<string, string>,
): any => {
  const template = getTemplate(id);
  return template.schema.parse({
    ...template.defaultProps,
    data: variant,
  });
};

export const compositionSchemaFor = (id: string) => {
  const template = getTemplate(id);
  const defaults = template.defaultProps;

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    useCase: template.useCase,
    durationInFrames: template.durationInFrames,
    fps: template.fps,
    width: template.width,
    height: template.height,
    defaults,
    defaultProps: defaults,
    placeholders: template.placeholders,
    copyFields: template.copyFields,
    category: template.category,
    blockSequence: template.blockSequence,
  };
};
