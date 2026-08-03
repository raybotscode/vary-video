import type {TemplateCapability} from './types';

/**
 * Canonical template metadata — the single source of truth.
 * Imported by:
 * - `src/templates/registry.ts` (attaches Zod schema + Remotion runtime props)
 * - `web/src/utils/templates.ts` (re-exports for UI compatibility)
 * - `/api/v1/capabilities` (machine-readable registry)
 *
 * Keep this JSON-safe: no Zod schemas, no Remotion imports, no default props
 * that pull in render code. Runtime concerns attach in `src/templates/registry.ts`.
 */
export const templateCapabilities: TemplateCapability[] = [
  {
    id: 'InsuranceAd',
    name: 'Insurance Ad',
    description: 'Personalized quote ads for local insurance campaigns.',
    category: 'ad',
    useCase: 'Insurance, Finance',
    supportedFormats: ['16:9', '1:1', '9:16', '4:5'],
    requiredPlaceholders: ['age', 'gender', 'location', 'company'],
    optionalPlaceholders: [],
    copyFields: [
      {id: 'headlineTemplate', label: 'Headline', default: 'Are you a {{age}} year old {{gender}} in {{location}}?'},
      {id: 'subheadlineTemplate', label: 'Subheadline', default: 'Get covered today with {{company}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Get a Quote Today'},
    ],
    defaultBlocks: ['product-intro', 'features-grid', 'pricing-card', 'brand-frame'],
    previewImage: null,
    version: '1.0.0',
    status: 'enabled',
    tags: ['insurance', 'finance', 'quote', 'local'],
  },
  {
    id: 'ProductLaunch',
    name: 'Product Launch',
    description: 'Showcase a new product with punchy feature highlights.',
    category: 'product',
    useCase: 'SaaS, Product, Startup',
    supportedFormats: ['16:9', '1:1', '9:16', '4:5'],
    requiredPlaceholders: ['product_name', 'tagline', 'feature1', 'feature2', 'feature3', 'company'],
    optionalPlaceholders: [],
    copyFields: [
      {id: 'headlineTemplate', label: 'Headline', default: 'Introducing {{product_name}}'},
      {id: 'taglineTemplate', label: 'Tagline', default: '{{tagline}}'},
      {id: 'feature1Template', label: 'Feature 1', default: '{{feature1}}'},
      {id: 'feature2Template', label: 'Feature 2', default: '{{feature2}}'},
      {id: 'feature3Template', label: 'Feature 3', default: '{{feature3}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Get Started Today'},
    ],
    defaultBlocks: ['product-intro', 'features-grid', 'pricing-card', 'brand-frame'],
    previewImage: null,
    version: '1.0.0',
    status: 'enabled',
    tags: ['saas', 'product', 'startup', 'launch'],
  },
  {
    id: 'RealEstate',
    name: 'Real Estate',
    description: 'Property showcase videos for listings and agents.',
    category: 'property',
    useCase: 'Real Estate, Property',
    supportedFormats: ['16:9', '1:1', '9:16', '4:5'],
    requiredPlaceholders: ['property_name', 'tagline', 'price', 'bedrooms', 'bathrooms', 'sqft', 'location', 'agent'],
    optionalPlaceholders: [],
    copyFields: [
      {id: 'headlineTemplate', label: 'Property Name', default: '{{property_name}}'},
      {id: 'taglineTemplate', label: 'Tagline', default: '{{tagline}}'},
      {id: 'priceTemplate', label: 'Price', default: '{{price}}'},
      {id: 'specsLine', label: 'Specs Line', default: '{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft'},
      {id: 'locationLine', label: 'Location', default: '{{location}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Schedule a Viewing'},
    ],
    defaultBlocks: ['property-hero', 'property-details', 'agent-cta', 'brand-frame'],
    previewImage: null,
    version: '1.0.0',
    status: 'enabled',
    tags: ['real-estate', 'property', 'listing', 'agent'],
  },
  {
    id: 'SocialClip',
    name: 'Social Clip',
    description: 'Short-form social ads with bold hooks and fast CTA pacing.',
    category: 'social',
    useCase: 'Social, Creator, DTC',
    supportedFormats: ['16:9', '1:1', '9:16', '4:5'],
    requiredPlaceholders: ['hook', 'body', 'cta', 'brand'],
    optionalPlaceholders: [],
    copyFields: [
      {id: 'hookTemplate', label: 'Hook', default: '{{hook}}'},
      {id: 'bodyTemplate', label: 'Body', default: '{{body}}'},
      {id: 'ctaText', label: 'Call to Action', default: '{{cta}}'},
    ],
    defaultBlocks: ['social-hook', 'social-body', 'social-outro', 'brand-frame'],
    previewImage: null,
    version: '1.0.0',
    status: 'enabled',
    tags: ['social', 'creator', 'dtc', 'short-form'],
  },
  {
    id: 'WebinarPromo',
    name: 'Webinar Promo',
    description: 'Promote live webinars, product demos, and online workshops.',
    category: 'social',
    useCase: 'B2B, Webinars, Events, Thought Leadership',
    supportedFormats: ['16:9', '1:1', '9:16', '4:5'],
    requiredPlaceholders: ['eventTitle', 'hostName', 'eventDate', 'eventTime', 'audience', 'keyTakeaway', 'ctaText', 'brandName'],
    optionalPlaceholders: [],
    copyFields: [
      {id: 'eventTitleTemplate', label: 'Event Title', default: 'Build a repeatable content engine'},
      {id: 'hostNameTemplate', label: 'Host Name', default: 'Hosted by {{hostName}}'},
      {id: 'eventDateTemplate', label: 'Event Date', default: '{{eventDate}}'},
      {id: 'eventTimeTemplate', label: 'Event Time', default: '{{eventTime}}'},
      {id: 'audienceTemplate', label: 'Audience', default: 'For {{audience}}'},
      {id: 'keyTakeawayTemplate', label: 'Key Takeaway', default: '{{keyTakeaway}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Reserve your seat'},
      {id: 'brandName', label: 'Brand Name', default: '{{brandName}}'},
    ],
    defaultBlocks: ['text-overlay', 'data-callout', 'brand-frame'],
    previewImage: null,
    version: '1.0.0',
    status: 'enabled',
    tags: ['webinar', 'b2b', 'event', 'promo'],
  },
];

export const templateCapabilityById = (id: string): TemplateCapability | undefined =>
  templateCapabilities.find((template) => template.id === id);
