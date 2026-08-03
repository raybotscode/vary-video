/**
 * Shared capability metadata for Vary.video.
 *
 * This module is JSON-safe metadata ONLY — no Remotion renderer imports,
 * no Node-only modules, no browser globals. It is imported by:
 * - the Remotion composition registry (root src/)
 * - the Express render API (api/)
 * - the Vite frontend (web/, via alias)
 *
 * Runtime Zod schemas and React block renderers stay in their own modules;
 * they reference these capability IDs rather than duplicating metadata.
 */

export type CapabilityStatus = 'enabled' | 'disabled' | 'deprecated';

export type OutputFormat = '16:9' | '1:1' | '9:16' | '4:5';

export type CapabilityOwner =
  | {ownerType: 'system'}
  | {ownerType: 'organisation'; organisationId: string};

export type TemplateCopyField = {
  id: string;
  label: string;
  default: string;
};

export type TemplateCapability = {
  id: string;
  name: string;
  description: string;
  category: 'ad' | 'social' | 'property' | 'product';
  useCase: string;
  supportedFormats: OutputFormat[];
  requiredPlaceholders: string[];
  optionalPlaceholders: string[];
  copyFields: TemplateCopyField[];
  defaultBlocks: string[];
  previewImage: string | null;
  version: string;
  status: CapabilityStatus;
  tags: string[];
  /** Tenant-aware future field — reserved for Phase 5/10, not populated now. */
  owner?: CapabilityOwner;
};

export type BlockContentField = {
  key: string;
  label: string;
  type: 'text' | 'url' | 'color' | 'number';
  placeholder?: string;
};

export type SceneBlockCategory =
  | 'intro'
  | 'feature'
  | 'cta'
  | 'detail'
  | 'hook'
  | 'body'
  | 'outro';

export type BlockCapability = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SceneBlockCategory;
  compatibleSchemas: string[];
  contentFields: BlockContentField[];
  defaultDurationFrames: number;
  requiredBrandSettings: string[];
  supportedAnimations: string[];
  version: string;
  status: CapabilityStatus;
  tags: string[];
  exampleUses: string[];
  /** Tenant-aware future field — reserved for Phase 5/10, not populated now. */
  owner?: CapabilityOwner;
};

export type AnimationPresetCapability = {
  id: string;
  name: string;
  description: string;
  direction?: 'in' | 'out';
  supportedPositions?: string[];
  parameters: {intensity?: boolean; durationFrames?: boolean};
  compatibleBlockTypes: string[];
  version: string;
  status: CapabilityStatus;
  tags: string[];
};

export type StylePresetCapability = {
  id: string;
  name: string;
  description: string;
  colors: {primary?: string; secondary?: string; accent?: string; background?: string};
  typography: {fontFamily?: string};
  backgroundTreatment: string;
  defaultAnimations: string[];
  suitableIndustries: string[];
  version: string;
  status: CapabilityStatus;
  tags: string[];
};

export type CapabilityVersion = {
  hash: string;
  generatedAt: string;
};

export type CapabilityRegistry = {
  version: CapabilityVersion;
  templates: TemplateCapability[];
  blocks: BlockCapability[];
  animations: AnimationPresetCapability[];
  styles: StylePresetCapability[];
};

/** Compact AI-facing summary. Omits large defaults; includes the essentials. */
export type CompactCapabilitySummary = {
  version: string;
  templates: Array<{id: string; name: string; requiredFields: string[]}>;
  blocks: Array<{
    id: string;
    name: string;
    category: SceneBlockCategory;
    contentFields: string[];
    compatibleSchemas: string[];
  }>;
  styles: string[];
  animations: string[];
};
