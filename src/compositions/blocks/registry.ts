import type React from 'react';
import {DataCallout} from './DataCallout';
import {TextOverlay} from './TextOverlay';
import {blockAdapters} from './adapters';

export type SceneBlockCategory =
  | 'intro'
  | 'feature'
  | 'cta'
  | 'detail'
  | 'hook'
  | 'body'
  | 'outro';

export type BrandSettings = {
  brandColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundImageUrl?: string;
};

export type BlockRenderProps = {
  frame: number;
  fps: number;
  width: number;
  height: number;
  content: Record<string, string>;
  brand: BrandSettings;
  data: Record<string, string>;
  startFrame?: number;
};

export type SceneBlockDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SceneBlockCategory;
  defaultDurationFrames: number;
  compatibleSchemas: string[];
  needsBrandSettings: boolean;
  defaultContent: Record<string, string>;
};

const definitions: SceneBlockDefinition[] = [
  {
    id: 'product-intro',
    name: 'Product Intro',
    description: 'Launch headline with product visual.',
    icon: 'PL',
    category: 'intro',
    defaultDurationFrames: 120,
    compatibleSchemas: ['ProductLaunch'],
    needsBrandSettings: true,
    defaultContent: {
      headlineTemplate: 'Introducing {{product_name}}',
      taglineTemplate: '{{tagline}}',
    },
  },
  {
    id: 'features-grid',
    name: 'Features Grid',
    description: 'Three-column feature highlights.',
    icon: 'FG',
    category: 'feature',
    defaultDurationFrames: 140,
    compatibleSchemas: ['ProductLaunch'],
    needsBrandSettings: true,
    defaultContent: {
      feature1Template: '{{feature1}}',
      feature2Template: '{{feature2}}',
      feature3Template: '{{feature3}}',
    },
  },
  {
    id: 'pricing-card',
    name: 'Pricing Card',
    description: 'Centered offer and CTA card.',
    icon: 'PC',
    category: 'cta',
    defaultDurationFrames: 80,
    compatibleSchemas: ['ProductLaunch'],
    needsBrandSettings: true,
    defaultContent: {
      taglineTemplate: '{{tagline}}',
      ctaText: 'Get Started Today',
    },
  },
  {
    id: 'property-hero',
    name: 'Property Hero',
    description: 'Listing headline, image, and price.',
    icon: 'PH',
    category: 'intro',
    defaultDurationFrames: 150,
    compatibleSchemas: ['RealEstate'],
    needsBrandSettings: true,
    defaultContent: {
      headlineTemplate: '{{property_name}}',
      taglineTemplate: '{{tagline}}',
      priceTemplate: '{{price}}',
    },
  },
  {
    id: 'property-details',
    name: 'Property Details',
    description: 'Specs, location, and agent line.',
    icon: 'PD',
    category: 'detail',
    defaultDurationFrames: 140,
    compatibleSchemas: ['RealEstate'],
    needsBrandSettings: true,
    defaultContent: {
      specsLine: '{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft',
      locationLine: '{{location}}',
    },
  },
  {
    id: 'agent-cta',
    name: 'Agent CTA',
    description: 'Agent-branded call to action.',
    icon: 'AC',
    category: 'cta',
    defaultDurationFrames: 50,
    compatibleSchemas: ['RealEstate'],
    needsBrandSettings: true,
    defaultContent: {
      ctaText: 'Schedule a Viewing',
    },
  },
  {
    id: 'social-hook',
    name: 'Social Hook',
    description: 'Bold opening hook.',
    icon: 'SH',
    category: 'hook',
    defaultDurationFrames: 100,
    compatibleSchemas: ['SocialClip'],
    needsBrandSettings: true,
    defaultContent: {
      hookTemplate: '{{hook}}',
    },
  },
  {
    id: 'social-body',
    name: 'Social Body',
    description: 'Short-form body copy scene.',
    icon: 'SB',
    category: 'body',
    defaultDurationFrames: 150,
    compatibleSchemas: ['SocialClip'],
    needsBrandSettings: true,
    defaultContent: {
      bodyTemplate: '{{body}}',
    },
  },
  {
    id: 'social-outro',
    name: 'Social Outro',
    description: 'Fast closing CTA.',
    icon: 'SO',
    category: 'outro',
    defaultDurationFrames: 90,
    compatibleSchemas: ['SocialClip'],
    needsBrandSettings: true,
    defaultContent: {
      ctaText: '{{cta}}',
    },
  },
  {
    id: 'brand-frame',
    name: 'Brand Frame',
    description: 'Reusable branded end frame.',
    icon: 'BF',
    category: 'outro',
    defaultDurationFrames: 90,
    compatibleSchemas: ['any'],
    needsBrandSettings: true,
    defaultContent: {
      ctaText: 'Get Started Today',
    },
  },
  {
    id: 'text-overlay',
    name: 'Text Overlay',
    description: 'Centered text over a branded background.',
    icon: 'TO',
    category: 'body',
    defaultDurationFrames: 120,
    compatibleSchemas: ['any'],
    needsBrandSettings: true,
    defaultContent: {
      headline: '{{headline}}',
      backgroundColor: '#F7FAFC',
    },
  },
  {
    id: 'data-callout',
    name: 'Data Callout',
    description: 'Large value with a supporting label.',
    icon: 'DC',
    category: 'feature',
    defaultDurationFrames: 120,
    compatibleSchemas: ['any'],
    needsBrandSettings: true,
    defaultContent: {
      value: '{{value}}',
      label: '{{label}}',
    },
  },
];

export const blockRegistry: Record<string, SceneBlockDefinition> =
  Object.fromEntries(definitions.map((block) => [block.id, block]));

export const blockRenderers: Record<string, React.FC<BlockRenderProps>> = {
  ...blockAdapters,
  'text-overlay': TextOverlay,
  'data-callout': DataCallout,
};

export function getBlock(id: string): SceneBlockDefinition {
  const block = blockRegistry[id];
  if (!block) {
    throw new Error(`Unknown scene block: ${id}`);
  }

  return block;
}

export function getAllBlocks(): SceneBlockDefinition[] {
  return definitions;
}

export function getBlocksByCategory(category: string): SceneBlockDefinition[] {
  return definitions.filter((block) => block.category === category);
}
