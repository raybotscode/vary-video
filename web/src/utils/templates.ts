import type {TemplateDefinition} from '../api/client';
import {templateCapabilities} from '@vary/shared/capabilities/templates';

/**
 * Frontend template registry — now a thin adapter over the canonical shared
 * capability metadata (src/shared/capabilities/templates.ts).
 *
 * No hand-maintained duplication here anymore: IDs, names, descriptions,
 * placeholders, copy fields and default blocks all come from the shared
 * source of truth. The frontend TemplateDefinition shape adds duration/fps/
 * width/height defaults that the shared metadata doesn't carry (those are
 * Remotion-runtime concerns owned by src/templates/registry.ts).
 */

const FRONTEND_DEFAULTS: Record<string, {durationInFrames: number; fps: number; width: number; height: number}> = {
  InsuranceAd: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  ProductLaunch: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  RealEstate: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  SocialClip: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  WebinarPromo: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  Testimonial: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  EventPromo: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  YouTubeIntro: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
};

const toFrontendDefinition = (template: (typeof templateCapabilities)[number]): TemplateDefinition => {
  const runtime = FRONTEND_DEFAULTS[template.id] ?? {durationInFrames: 450, fps: 30, width: 1920, height: 1080};

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    useCase: template.useCase,
    ...runtime,
    category: template.category,
    placeholders: [...template.requiredPlaceholders, ...template.optionalPlaceholders],
    copyFields: template.copyFields,
    defaults: {
      // Frontend template defaults: copy fields + brand defaults.
      ...Object.fromEntries(
        template.copyFields.map((field) => [field.id, field.default]),
      ),
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#FF6B5B',
      logoUrl: '',
      backgroundType: 'gradient',
      backgroundColor: '#1A365D',
      backgroundImageUrl: '',
    },
    blockSequence: template.defaultBlocks,
  };
};

export const frontendTemplates: TemplateDefinition[] = templateCapabilities.map(toFrontendDefinition);

export const getFrontendTemplate = (id: string): TemplateDefinition => {
  const template = frontendTemplates.find((candidate) => candidate.id === id);
  if (!template) {
    throw new Error(`Unknown frontend template: ${id}`);
  }
  return template;
};

const TEMPLATE_ICONS: Record<string, string> = {
  InsuranceAd: 'IA',
  ProductLaunch: 'PL',
  RealEstate: 'RE',
  SocialClip: 'SC',
  WebinarPromo: 'WB',
  Testimonial: 'TM',
  EventPromo: 'EV',
  YouTubeIntro: 'YT',
};

export const templateIconFor = (id: string): string => TEMPLATE_ICONS[id] ?? id.slice(0, 2).toUpperCase();
