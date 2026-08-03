import type {StylePresetCapability} from './types';

/**
 * Style preset metadata. METADATA ONLY in Phase 2 — prompt-to-template
 * (Phase 7) and the AI capability registry consume these. They map to
 * colour palettes, typography and background treatments by name so the AI
 * references presets instead of inventing hex codes.
 */
export const stylePresetCapabilities: StylePresetCapability[] = [
  {
    id: 'clean-brand',
    name: 'Clean Brand',
    description: 'Neutral surfaces, strong brand primary, minimal decoration.',
    colors: {primary: '#1A365D', secondary: '#3182CE', accent: '#FF6B5B', background: '#F7FAFC'},
    typography: {fontFamily: 'Inter'},
    backgroundTreatment: 'gradient',
    defaultAnimations: ['none'],
    suitableIndustries: ['SaaS', 'corporate', 'insurance', 'professional services'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['clean', 'corporate', 'default'],
  },
  {
    id: 'bold-social',
    name: 'Bold Social',
    description: 'High-contrast, punchy colors for short-form social.',
    colors: {primary: '#111827', secondary: '#6366F1', accent: '#F43F5E', background: '#0B1020'},
    typography: {fontFamily: 'Inter'},
    backgroundTreatment: 'gradient',
    defaultAnimations: ['none'],
    suitableIndustries: ['social', 'creator', 'DTC', 'gaming'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['social', 'bold', 'contrast'],
  },
  {
    id: 'property-premium',
    name: 'Property Premium',
    description: 'Sophisticated palette for real-estate listings.',
    colors: {primary: '#1F2937', secondary: '#115E59', accent: '#B45309', background: '#FAFAF9'},
    typography: {fontFamily: 'Inter'},
    backgroundTreatment: 'gradient',
    defaultAnimations: ['none'],
    suitableIndustries: ['real-estate', 'property', 'luxury'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['property', 'premium', 'earthy'],
  },
  {
    id: 'webinar-dark',
    name: 'Webinar Dark',
    description: 'Dark stage background for events and webinars.',
    colors: {primary: '#2563EB', secondary: '#14B8A6', accent: '#F8FAFC', background: '#0F172A'},
    typography: {fontFamily: 'Inter'},
    backgroundTreatment: 'solid',
    defaultAnimations: ['none'],
    suitableIndustries: ['b2b', 'webinars', 'events', 'thought-leadership'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['dark', 'event', 'webinar'],
  },
];

export const stylePresetById = (id: string): StylePresetCapability | undefined =>
  stylePresetCapabilities.find((preset) => preset.id === id);

export const getEnabledStylePresets = (): StylePresetCapability[] =>
  stylePresetCapabilities.filter((preset) => preset.status === 'enabled');
