import type {TemplateDefinition} from '../api/client';
import type {BlockCapability, TemplateCapability} from '@vary/shared/capabilities/types';

/**
 * Maps canonical capability records to the existing frontend UI shapes during
 * the migration window. Once the whole UI reads capabilities directly, these
 * adapters shrink to no-ops and can be removed.
 */

const FRONTEND_RUNTIME: Record<
  string,
  {durationInFrames: number; fps: number; width: number; height: number}
> = {
  InsuranceAd: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  ProductLaunch: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  RealEstate: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  SocialClip: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
  WebinarPromo: {durationInFrames: 450, fps: 30, width: 1920, height: 1080},
};

export const templateCapabilityToFrontend = (
  template: TemplateCapability,
): TemplateDefinition => {
  const runtime = FRONTEND_RUNTIME[template.id] ?? {
    durationInFrames: 450,
    fps: 30,
    width: 1920,
    height: 1080,
  };

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    useCase: template.useCase,
    ...runtime,
    category: template.category,
    placeholders: [
      ...template.requiredPlaceholders,
      ...template.optionalPlaceholders,
    ],
    copyFields: template.copyFields,
    defaults: {
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

export const templateCapabilitiesToFrontend = (
  templates: TemplateCapability[],
): TemplateDefinition[] => templates.map(templateCapabilityToFrontend);

export type FrontendSceneBlockDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BlockCapability['category'];
  defaultDurationFrames: number;
  compatibleSchemas: string[];
  needsBrandSettings: boolean;
  defaultContent: Record<string, string>;
};

export const blockCapabilityToFrontend = (
  block: BlockCapability,
): FrontendSceneBlockDefinition => ({
  id: block.id,
  name: block.name,
  description: block.description,
  icon: block.icon,
  category: block.category,
  defaultDurationFrames: block.defaultDurationFrames,
  compatibleSchemas: block.compatibleSchemas,
  needsBrandSettings: block.requiredBrandSettings.length > 0,
  defaultContent: Object.fromEntries(
    block.contentFields.map((field) => [field.key, field.placeholder ?? '']),
  ),
});

export const blockCapabilitiesToFrontend = (
  blocks: BlockCapability[],
): FrontendSceneBlockDefinition[] => blocks.map(blockCapabilityToFrontend);
