/**
 * V2 Document Schema — the canonical template document model.
 *
 * Uses discriminated unions for element types (text/image/shape).
 * Each element type has its own strongly-typed props schema.
 *
 * Key design decisions:
 * - Normalized coordinates (0-1) for position and size
 * - Frame-based timing (not seconds)
 * - Responsive overrides per aspect ratio
 * - JSON-serializable, versioned, strictly validated
 * - Discriminated unions for type-safe element props
 */

import {z} from 'zod';
import {bindableTextSchema, bindableValueSchema} from './bindable';

// ─── Aspect Ratios ────────────────────────────────────────────────

export const aspectRatioSchema = z.enum(['16:9', '9:16', '1:1']);
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1'];

export const ASPECT_DIMENSIONS: Record<AspectRatio, {width: number; height: number}> = {
  '16:9': {width: 1920, height: 1080},
  '9:16': {width: 1080, height: 1920},
  '1:1': {width: 1920, height: 1920},
};

// ─── Easing ───────────────────────────────────────────────────────

export const easingSchema = z.enum([
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-in-back',
  'ease-out-back',
  'ease-in-elastic',
  'ease-out-elastic',
  'bounce',
]);
export type Easing = z.infer<typeof easingSchema>;

// ─── Animation Presets ────────────────────────────────────────────

export const animationPresetSchema = z.enum([
  'none',
  'fade-in',
  'fade-out',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'scale-in',
  'scale-out',
  'zoom-in',
  'zoom-out',
  'bounce-in',
  'rotate-in',
]);
export type AnimationPreset = z.infer<typeof animationPresetSchema>;

// ─── Element Animation ────────────────────────────────────────────

export const elementAnimationSchema = z.object({
  preset: animationPresetSchema,
  durationFrames: z.number().int().min(1).max(300).default(15),
  delayFrames: z.number().int().min(0).max(600).default(0),
  easing: easingSchema.default('ease-out'),
  intensity: z.number().min(0.1).max(3).default(1),
});
export type ElementAnimation = z.infer<typeof elementAnimationSchema>;

export const elementAnimationPairSchema = z.object({
  in: elementAnimationSchema.optional(),
  out: elementAnimationSchema.optional(),
});
export type ElementAnimationPair = z.infer<typeof elementAnimationPairSchema>;

// ─── Transform (normalized 0-1 coordinates) ──────────────────────

export const transformSchema = z.object({
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
  width: z.number().min(0).max(1).nullable().default(0.8),
  height: z.number().min(0).max(1).nullable().default(null),
  rotation: z.number().min(-360).max(360).default(0),
  anchorX: z.number().min(0).max(1).default(0.5),
  anchorY: z.number().min(0).max(1).default(0.5),
  zIndex: z.number().int().min(0).max(1000).default(10),
  opacity: z.number().min(0).max(1).default(1),
});
export type Transform = z.infer<typeof transformSchema>;

// ─── Responsive Override ──────────────────────────────────────────

export const responsiveOverrideSchema = z.object({
  x: z.number().min(0).max(1).optional(),
  y: z.number().min(0).max(1).optional(),
  width: z.number().min(0).max(1).nullable().optional(),
  height: z.number().min(0).max(1).nullable().optional(),
  rotation: z.number().min(-360).max(360).optional(),
  anchorX: z.number().min(0).max(1).optional(),
  anchorY: z.number().min(0).max(1).optional(),
  zIndex: z.number().int().min(0).max(1000).optional(),
  opacity: z.number().min(0).max(1).optional(),
  fontSize: z.number().min(8).max(400).optional(),
});
export type ResponsiveOverride = z.infer<typeof responsiveOverrideSchema>;

export const responsiveOverridesSchema = z.object({
  '16:9': responsiveOverrideSchema.optional(),
  '9:16': responsiveOverrideSchema.optional(),
  '1:1': responsiveOverrideSchema.optional(),
}).default(() => ({}));
export type ResponsiveOverrides = z.infer<typeof responsiveOverridesSchema>;

// ─── Timing ───────────────────────────────────────────────────────

export const timingSchema = z.object({
  startFrame: z.number().int().min(0).default(0),
  endFrame: z.number().int().min(0).nullable().default(null),
});
export type Timing = z.infer<typeof timingSchema>;

// ─── Element Props (per type) ─────────────────────────────────────

export const textPropsSchema = z.object({
  content: z.union([z.string(), bindableTextSchema]).default('{{headline}}'),
  fontFamily: z.string().default('Inter'),
  fontSize: z.number().min(8).max(400).default(72),
  fontWeight: z.number().int().min(100).max(900).default(700),
  fontStyle: z.enum(['normal', 'italic']).default('normal'),
  lineHeight: z.number().min(0.5).max(3).default(1.2),
  letterSpacing: z.number().min(-10).max(20).default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#1A365D'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).default('middle'),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).default('none'),
  maxLines: z.number().int().min(1).max(20).nullable().default(null),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
  padding: z.number().min(0).max(200).default(0),
  borderRadius: z.number().min(0).max(200).default(0),
});
export type TextProps = z.infer<typeof textPropsSchema>;

export const imagePropsSchema = z.object({
  src: z.union([z.string(), bindableValueSchema]).default('{{imageUrl}}'),
  fit: z.enum(['cover', 'contain', 'fill']).default('cover'),
  objectPositionX: z.number().min(0).max(1).default(0.5),
  objectPositionY: z.number().min(0).max(1).default(0.5),
  borderRadius: z.number().min(0).max(200).default(0),
  overlayColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
  overlayOpacity: z.number().min(0).max(1).default(0),
  blur: z.number().min(0).max(50).default(0),
  shadow: z.boolean().default(false),
});
export type ImageProps = z.infer<typeof imagePropsSchema>;

export const shapeTypeSchema = z.enum(['rectangle', 'rounded-rect', 'circle', 'line', 'star', 'triangle', 'diamond', 'hexagon']);
export type ShapeType = z.infer<typeof shapeTypeSchema>;

export const shapePropsSchema = z.object({
  shapeType: shapeTypeSchema.default('rectangle'),
  fill: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/), bindableValueSchema]).default('#3182CE'),
  stroke: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(), bindableValueSchema]).nullable().default(null),
  strokeWidth: z.number().min(0).max(50).default(0),
  borderRadius: z.number().min(0).max(500).default(0),
});
export type ShapeProps = z.infer<typeof shapePropsSchema>;

// ─── Base Element ─────────────────────────────────────────────────

const baseElementFields = {
  id: z.string().min(1).max(100),
  name: z.string().max(100).default('Element'),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
  timing: timingSchema.default((): z.infer<typeof timingSchema> => ({startFrame: 0, endFrame: null})),
  transform: transformSchema.default((): z.infer<typeof transformSchema> => ({
    x: 0.5, y: 0.5, width: 0.8, height: null,
    rotation: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 10, opacity: 1,
  })),
  responsiveOverrides: responsiveOverridesSchema,
  animation: elementAnimationPairSchema.default(() => ({})),
};

// ─── Discriminated Union Elements ─────────────────────────────────

export const textElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('text'),
  props: textPropsSchema.default(() => textPropsSchema.parse({})),
});
export type TextElement = z.infer<typeof textElementSchema>;

export const imageElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('image'),
  props: imagePropsSchema.default(() => imagePropsSchema.parse({})),
});
export type ImageElement = z.infer<typeof imageElementSchema>;

export const shapeElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('shape'),
  props: shapePropsSchema.default(() => shapePropsSchema.parse({})),
});
export type ShapeElement = z.infer<typeof shapeElementSchema>;

export const elementSchema = z.discriminatedUnion('type', [
  textElementSchema,
  imageElementSchema,
  shapeElementSchema,
]);
export type V2Element = z.infer<typeof elementSchema>;

// ─── Background ───────────────────────────────────────────────────

export const backgroundSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('solid'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  }),
  z.object({
    type: z.literal('gradient'),
    color1: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    color2: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    angle: z.number().min(0).max(360).default(135),
  }),
  z.object({
    type: z.literal('image'),
    src: z.string(),
    opacity: z.number().min(0).max(1).default(0.16),
  }),
]);
export type Background = z.infer<typeof backgroundSchema>;

// ─── Scene ────────────────────────────────────────────────────────

export const sceneSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(100).default('Scene'),
  durationFrames: z.number().int().min(1).max(9000).default(90),
  background: backgroundSchema.default({type: 'gradient', color1: '#FFFFFF', color2: '#F7FAFC', angle: 135}),
  elements: z.array(elementSchema).default([]),
});
export type V2Scene = z.infer<typeof sceneSchema>;

// ─── Merge Tag ────────────────────────────────────────────────────

export const mergeTagTypeSchema = z.enum([
  'text', 'number', 'currency', 'color', 'image', 'boolean', 'url', 'date',
]);
export type MergeTagType = z.infer<typeof mergeTagTypeSchema>;

export const mergeTagSchema = z.object({
  id: z.string().min(1).max(50).default(() => `tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`),
  key: z.string().min(1).max(50).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: mergeTagTypeSchema,
  label: z.string().max(100),
  defaultValue: z.string().default(''),
  required: z.boolean().default(false),
  description: z.string().max(500).default(''),
  format: z.string().max(100).optional(),
});
export type MergeTag = z.infer<typeof mergeTagSchema>;

// ─── V2 Document ──────────────────────────────────────────────────

export const V2_DOCUMENT_VERSION = 3;

export const v2DocumentSchema = z.object({
  schemaVersion: z.literal(V2_DOCUMENT_VERSION),
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  fps: z.number().int().min(1).max(120).default(30),
  defaultAspectRatio: aspectRatioSchema.default('16:9'),
  supportedAspectRatios: z.array(aspectRatioSchema).min(1).default(['16:9', '9:16', '1:1']),
  scenes: z.array(sceneSchema).min(1),
  mergeTags: z.array(mergeTagSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type V2Document = z.infer<typeof v2DocumentSchema>;

// ─── Validation Helpers ───────────────────────────────────────────

export function validateDocument(data: unknown): V2Document {
  return v2DocumentSchema.parse(data);
}

export function safeValidateDocument(data: unknown):
  | {success: true; data: V2Document}
  | {success: false; error: z.ZodError} {
  const result = v2DocumentSchema.safeParse(data);
  if (result.success) return {success: true, data: result.data};
  return {success: false, error: result.error};
}

export function isV2Document(data: unknown): data is V2Document {
  return v2DocumentSchema.safeParse(data).success;
}
