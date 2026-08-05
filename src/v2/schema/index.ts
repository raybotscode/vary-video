/**
 * V2 Schema — the canonical template document model.
 *
 * Export all schemas, types, and validation helpers.
 */

export {
  // Aspect ratios
  aspectRatioSchema,
  type AspectRatio,
  ASPECT_RATIOS,
  ASPECT_DIMENSIONS,

  // Easing
  easingSchema,
  type Easing,

  // Animation
  animationPresetSchema,
  type AnimationPreset,
  elementAnimationSchema,
  type ElementAnimation,

  // Transform
  transformSchema,
  type Transform,

  // Responsive
  responsiveOverrideSchema,
  type ResponsiveOverride,

  // Timing
  timingSchema,
  type Timing,

  // Element props
  textPropsSchema,
  type TextProps,
  imagePropsSchema,
  type ImageProps,
  shapePropsSchema,
  type ShapeProps,
  shapeTypeSchema,
  type ShapeType,

  // Element
  elementTypeSchema,
  type ElementType,
  elementSchema,
  type V2Element,

  // Background
  backgroundSchema,
  type Background,

  // Scene
  sceneSchema,
  type V2Scene,

  // Merge tags
  mergeTagTypeSchema,
  type MergeTagType,
  mergeTagSchema,
  type MergeTag,

  // Document
  V2_DOCUMENT_VERSION,
  v2DocumentSchema,
  type V2Document,

  // Validation
  validateDocument,
  safeValidateDocument,
  isV2Document,
} from './document';

export {
  // Migration
  migrateV1ToV2,
  convertV1Layout,
} from './migration';
