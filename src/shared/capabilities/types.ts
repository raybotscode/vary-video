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
  /** Media field IDs this template supports (e.g. ['image1', 'logo']). */
  mediaFields?: string[];
  /** Tenant-aware future field — reserved for Phase 5/10, not populated now. */
  owner?: CapabilityOwner;
};

export type ImageFitMode = 'cover' | 'contain' | 'fit-width' | 'fit-height';
export type ImageHorizontalPosition = 'left' | 'center' | 'right';
export type ImageVerticalPosition = 'top' | 'center' | 'bottom';

export type ImageFocalPoint = {
  x: number; // 0..1
  y: number; // 0..1
};

export type GradientOverlay = {
  enabled: boolean;
  from: string;
  to: string;
  direction: 'to-top' | 'to-bottom' | 'to-left' | 'to-right';
  opacity: number; // 0..1
};

export type ImageTreatment = {
  fit: ImageFitMode;
  focalPoint?: ImageFocalPoint;
  horizontalPosition?: ImageHorizontalPosition;
  verticalPosition?: ImageVerticalPosition;
  darkOverlay?: number; // 0..1
  blur?: number; // px, clamp 0..24
  gradientOverlay?: GradientOverlay;
};

export type BlockContentField = {
  key: string;
  label: string;
  type: 'text' | 'url' | 'color' | 'number' | 'image' | 'image-treatment';
  placeholder?: string;
  /** When true, the block is hidden if this field resolves to an empty string. */
  essential?: boolean;
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
  /** Media field IDs this block renders (e.g. ['image1', 'image2']). */
  mediaFields?: string[];
  /** Block exposes image treatment controls outside content fields. */
  supportsImageTreatment?: boolean;
  /** Default image treatment for media rendered by this block. */
  defaultImageTreatment?: ImageTreatment;
  /** Tenant-aware future field — reserved for Phase 5/10, not populated now. */
  owner?: CapabilityOwner;
};

export type AnimationEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

export type BlockAnimationConfig = {
  presetId: string;
  durationFrames?: number;
  intensity?: number;
  easing?: AnimationEasing;
};

export type BlockAnimationSettings = {
  entry?: BlockAnimationConfig;
  exit?: BlockAnimationConfig;
};

export type TransitionType = 'crossfade' | 'slide' | 'zoom' | 'wipe';
export type TransitionDirection = 'left' | 'right' | 'up' | 'down';

export type BlockTransitionConfig = {
  type: TransitionType;
  durationFrames?: number;
  direction?: TransitionDirection;
  easing?: AnimationEasing;
  intensity?: number;
};

/**
 * Per-element layout overrides for block content fields.
 * Positions use percentages (0–100) of canvas width/height.
 * When absent for a field, the block renderer's hardcoded position is used.
 */
export type ElementAnimationConfig = {
  presetId: string;
  durationFrames: number; // 6–60
};

export type ElementLayout = {
  x: number;          // 0–100, percentage of canvas width
  y: number;          // 0–100, percentage of canvas height
  fontSize?: number;  // 12–200, px
  color?: string;     // hex color, e.g. "#1A365D"
  animation?: {
    entry?: ElementAnimationConfig;
    exit?: ElementAnimationConfig;
  };
};

export type AnimationPresetCapability = {
  id: string;
  name: string;
  description: string;
  direction?: 'in' | 'out';
  supportedPositions?: string[];
  parameters: {intensity?: boolean; durationFrames?: boolean; easing?: boolean};
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

import type {MediaFieldCapability} from './media';

export type CapabilityRegistry = {
  version: CapabilityVersion;
  templates: TemplateCapability[];
  blocks: BlockCapability[];
  animations: AnimationPresetCapability[];
  styles: StylePresetCapability[];
  media: MediaFieldCapability[];
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
  media: Array<{id: string; variantKey: string; required: boolean}>;
};
