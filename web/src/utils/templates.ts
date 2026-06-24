import type {TemplateDefinition} from '../api/client';

export const frontendTemplates: TemplateDefinition[] = [
  {
    id: 'InsuranceAd',
    name: 'Insurance Ad',
    description: 'Personalized quote ads for local insurance campaigns.',
    useCase: 'Insurance, Finance',
    durationInFrames: 450,
    fps: 30,
    width: 1920,
    height: 1080,
    category: 'ad',
    placeholders: ['age', 'gender', 'location', 'company'],
    copyFields: [
      {id: 'headlineTemplate', label: 'Headline', default: 'Are you a {{age}} year old {{gender}} in {{location}}?'},
      {id: 'subheadlineTemplate', label: 'Subheadline', default: 'Get covered today with {{company}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Get a Quote Today'},
    ],
    defaults: {
      headlineTemplate: 'Are you a {{age}} year old {{gender}} in {{location}}?',
      subheadlineTemplate: 'Get covered today with {{company}}',
      ctaText: 'Get a Quote Today',
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      logoUrl: '',
      backgroundType: 'gradient',
      backgroundColor: '#1A365D',
      backgroundImageUrl: '',
    },
  },
  {
    id: 'ProductLaunch',
    name: 'Product Launch',
    description: 'Showcase a new product with punchy feature highlights.',
    useCase: 'SaaS, Product, Startup',
    durationInFrames: 450,
    fps: 30,
    width: 1920,
    height: 1080,
    category: 'product',
    placeholders: ['product_name', 'tagline', 'feature1', 'feature2', 'feature3', 'company'],
    copyFields: [
      {id: 'headlineTemplate', label: 'Headline', default: 'Introducing {{product_name}}'},
      {id: 'taglineTemplate', label: 'Tagline', default: '{{tagline}}'},
      {id: 'feature1Template', label: 'Feature 1', default: '{{feature1}}'},
      {id: 'feature2Template', label: 'Feature 2', default: '{{feature2}}'},
      {id: 'feature3Template', label: 'Feature 3', default: '{{feature3}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Get Started Today'},
    ],
    defaults: {
      headlineTemplate: 'Introducing {{product_name}}',
      taglineTemplate: '{{tagline}}',
      feature1Template: '{{feature1}}',
      feature2Template: '{{feature2}}',
      feature3Template: '{{feature3}}',
      ctaText: 'Get Started Today',
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#FF6B5B',
      logoUrl: '',
      backgroundType: 'gradient',
      backgroundColor: '#1A365D',
      backgroundImageUrl: '',
      productImageUrl: '',
    },
  },
  {
    id: 'RealEstate',
    name: 'Real Estate',
    description: 'Property showcase videos for listings and agents.',
    useCase: 'Real Estate, Property',
    durationInFrames: 450,
    fps: 30,
    width: 1920,
    height: 1080,
    category: 'property',
    placeholders: ['property_name', 'tagline', 'price', 'bedrooms', 'bathrooms', 'sqft', 'location', 'agent'],
    copyFields: [
      {id: 'headlineTemplate', label: 'Property Name', default: '{{property_name}}'},
      {id: 'taglineTemplate', label: 'Tagline', default: '{{tagline}}'},
      {id: 'priceTemplate', label: 'Price', default: '{{price}}'},
      {id: 'specsLine', label: 'Specs Line', default: '{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft'},
      {id: 'locationLine', label: 'Location', default: '{{location}}'},
      {id: 'ctaText', label: 'Call to Action', default: 'Schedule a Viewing'},
    ],
    defaults: {
      headlineTemplate: '{{property_name}}',
      taglineTemplate: '{{tagline}}',
      priceTemplate: '{{price}}',
      specsLine: '{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft',
      locationLine: '{{location}}',
      ctaText: 'Schedule a Viewing',
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#38A169',
      logoUrl: '',
      backgroundType: 'gradient',
      backgroundColor: '#1A365D',
      backgroundImageUrl: '',
      propertyImageUrl: '',
    },
  },
  {
    id: 'SocialClip',
    name: 'Social Clip',
    description: 'Short-form social ads with bold hooks and fast CTA pacing.',
    useCase: 'Social, Creator, DTC',
    durationInFrames: 450,
    fps: 30,
    width: 1920,
    height: 1080,
    category: 'social',
    placeholders: ['hook', 'body', 'cta', 'brand'],
    copyFields: [
      {id: 'hookTemplate', label: 'Hook', default: '{{hook}}'},
      {id: 'bodyTemplate', label: 'Body', default: '{{body}}'},
      {id: 'ctaText', label: 'Call to Action', default: '{{cta}}'},
    ],
    defaults: {
      hookTemplate: '{{hook}}',
      bodyTemplate: '{{body}}',
      ctaText: '{{cta}}',
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#9F7AEA',
      logoUrl: '',
      backgroundType: 'gradient',
      backgroundColor: '#1A365D',
      backgroundImageUrl: '',
    },
  },
];

export const getFrontendTemplate = (templateId: string): TemplateDefinition =>
  frontendTemplates.find((template) => template.id === templateId) ??
  frontendTemplates[0];

export const templateIconFor = (templateId: string): string => {
  if (templateId === 'ProductLaunch') {
    return 'PL';
  }
  if (templateId === 'RealEstate') {
    return 'RE';
  }
  if (templateId === 'SocialClip') {
    return 'SC';
  }
  return 'IA';
};
