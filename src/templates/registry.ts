import {z, type ZodType} from 'zod';
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

export const sceneBlockPlayerTemplateSchema = z.object({
  blocks: z.array(
    z.object({
      blockId: z.string().min(1),
      content: z.record(z.string(), z.string()).default({}),
      durationFrames: z.number().int().positive().optional(),
      transitionFrames: z.number().int().min(0).optional(),
    }),
  ).min(1),
  brandSettings: z.object({
    brandColor: z.string().default('#1A365D'),
    secondaryColor: z.string().default('#3182CE'),
    accentColor: z.string().default('#FF6B5B'),
    logoUrl: z.string().default(''),
    backgroundType: z.enum(['solid', 'gradient', 'image']).default('gradient'),
    backgroundColor: z.string().default('#F7FAFC'),
    backgroundImageUrl: z.string().optional(),
  }),
  fps: z.number().int().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  data: z.record(z.string(), z.string()).default({}),
});

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

const dimensions = {
  durationInFrames: 450,
  fps: 30,
  width: 1920,
  height: 1080,
};

export const templateRegistry: Record<string, TemplateDefinition> = {
  InsuranceAd: {
    id: 'InsuranceAd',
    name: 'Insurance Ad',
    description: 'Personalized quote ads for local insurance campaigns.',
    useCase: 'Insurance, Finance',
    ...dimensions,
    schema: insuranceAdSchema,
    defaultProps: defaultInsuranceAdProps,
    placeholders: ['age', 'gender', 'location', 'company'],
    copyFields: [
      {
        id: 'headlineTemplate',
        label: 'Headline',
        default: defaultInsuranceAdProps.headlineTemplate,
      },
      {
        id: 'subheadlineTemplate',
        label: 'Subheadline',
        default: defaultInsuranceAdProps.subheadlineTemplate,
      },
      {
        id: 'ctaText',
        label: 'Call to Action',
        default: defaultInsuranceAdProps.ctaText,
      },
    ],
    category: 'ad',
    blockSequence: ['product-intro', 'features-grid', 'pricing-card', 'brand-frame'],
  },
  ProductLaunch: {
    id: 'ProductLaunch',
    name: 'Product Launch',
    description: 'Showcase a new product with punchy feature highlights.',
    useCase: 'SaaS, Product, Startup',
    ...dimensions,
    schema: productLaunchSchema,
    defaultProps: defaultProductLaunchProps,
    placeholders: [
      'product_name',
      'tagline',
      'feature1',
      'feature2',
      'feature3',
      'company',
    ],
    copyFields: [
      {id: 'headlineTemplate', label: 'Headline', default: 'Introducing {{product_name}}'},
      {id: 'taglineTemplate', label: 'Tagline', default: '{{tagline}}'},
      {id: 'feature1Template', label: 'Feature 1', default: '{{feature1}}'},
      {id: 'feature2Template', label: 'Feature 2', default: '{{feature2}}'},
      {id: 'feature3Template', label: 'Feature 3', default: '{{feature3}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Get Started Today'},
    ],
    category: 'product',
    blockSequence: ['product-intro', 'features-grid', 'pricing-card', 'brand-frame'],
  },
  RealEstate: {
    id: 'RealEstate',
    name: 'Real Estate',
    description: 'Property showcase videos for listings and agents.',
    useCase: 'Real Estate, Property',
    ...dimensions,
    schema: realEstateSchema,
    defaultProps: defaultRealEstateProps,
    placeholders: [
      'property_name',
      'tagline',
      'price',
      'bedrooms',
      'bathrooms',
      'sqft',
      'location',
      'agent',
    ],
    copyFields: [
      {id: 'headlineTemplate', label: 'Property Name', default: '{{property_name}}'},
      {id: 'taglineTemplate', label: 'Tagline', default: '{{tagline}}'},
      {id: 'priceTemplate', label: 'Price', default: '{{price}}'},
      {
        id: 'specsLine',
        label: 'Specs Line',
        default: '{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft',
      },
      {id: 'locationLine', label: 'Location', default: '{{location}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Schedule a Viewing'},
    ],
    category: 'property',
    blockSequence: ['property-hero', 'property-details', 'agent-cta', 'brand-frame'],
  },
  SocialClip: {
    id: 'SocialClip',
    name: 'Social Clip',
    description: 'Short-form social ads with bold hooks and fast CTA pacing.',
    useCase: 'Social, Creator, DTC',
    ...dimensions,
    schema: socialClipSchema,
    defaultProps: defaultSocialClipProps,
    placeholders: ['hook', 'body', 'cta', 'brand'],
    copyFields: [
      {id: 'hookTemplate', label: 'Hook', default: '{{hook}}'},
      {id: 'bodyTemplate', label: 'Body', default: '{{body}}'},
      {id: 'ctaText', label: 'Call to Action', default: '{{cta}}'},
    ],
    category: 'social',
    blockSequence: ['social-hook', 'social-body', 'social-outro', 'brand-frame'],
  },
};

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
