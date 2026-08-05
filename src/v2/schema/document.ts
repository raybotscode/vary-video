/**
 * V2 Document Schema — the canonical template document model.
 *
 * This is the single source of truth for the entire platform.
 * Editor, renderer, API, and AI all operate on this document.
 *
 * Key design decisions:
 * - Normalized coordinates (0-1) for position and size
 * - Frame-based timing (not seconds)
 * - Responsive overrides per aspect ratio
 * - JSON-serializable, versioned, strictly validated
 */

import {z} from 'zod';

// ─── Aspect Ratios ────────────────────────────────────────────────

export const aspectRatioSchema = z.enum(['16:9', '9:16', '1:1']);
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const ASPECT_RATIOS: AspectRatio[] = ['16:9', '9:16', '1:1'];

/** Canvas dimensions for each aspect ratio (at 1920 base width) */
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

// ─── Transform (normalized 0-1 coordinates) ──────────────────────

export const transformSchema = z.object({
  /** Anchor X position (0-1, where 0=left, 0.5=center, 1=right) */
  x: z.number().min(0).max(1).default(0.5),
  /** Anchor Y position (0-1, where 0=top, 0.5=center, 1=bottom) */
  y: z.number().min(0).max(1).default(0.5),
  /** Width as proportion of canvas width (0-1). null = auto */
  width: z.number().min(0).max(1).nullable().default(0.8),
  /** Height as proportion of canvas height (0-1). null = auto */
  height: z.number().min(0).max(1).nullable().default(null),
  /** Rotation in degrees */
  rotation: z.number().min(-360).max(360).default(0),
  /** Anchor point X (0-1 within element, 0=left edge, 0.5=center, 1=right) */
  anchorX: z.number().min(0).max(1).default(0.5),
  /** Anchor point Y (0-1 within element, 0=top edge, 0.5=center, 1=bottom) */
  anchorY: z.number().min(0).max(1).default(0.5),
  /** Z-index for layering */
  zIndex: z.number().int().min(0).max(1000).default(10),
  /** Opacity (0-1) */
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
  /** Font size override for text elements (in canvas px at 1920 base) */
  fontSize: z.number().min(8).max(400).optional(),
});
export type ResponsiveOverride = z.infer<typeof responsiveOverrideSchema>;

// ─── Timing ───────────────────────────────────────────────────────

export const timingSchema = z.object({
  /** Start frame within the scene (0-indexed) */
  startFrame: z.number().int().min(0).default(0),
  /** End frame within the scene (exclusive). null = scene end */
  endFrame: z.number().int().min(0).nullable().default(null),
});
export type Timing = z.infer<typeof timingSchema>;

// ─── Element Props (per type) ─────────────────────────────────────

export const textPropsSchema = z.object({
  content: z.string().default('{{headline}}'),
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
  /** Asset ID (from R2) or merge tag {{imageUrl}} */
  src: z.string().default('{{imageUrl}}'),
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

export const shapeTypeSchema = z.enum(['rectangle', 'circle', 'line']);
export type ShapeType = z.infer<typeof shapeTypeSchema>;

export const shapePropsSchema = z.object({
  shapeType: shapeTypeSchema.default('rectangle'),
  fill: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3182CE'),
  stroke: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().default(null),
  strokeWidth: z.number().min(0).max(50).default(0),
  borderRadius: z.number().min(0).max(500).default(0),
});
export type ShapeProps = z.infer<typeof shapePropsSchema>;

// ─── Element ──────────────────────────────────────────────────────

export const elementTypeSchema = z.enum(['text', 'image', 'shape']);
export type ElementType = z.infer<typeof elementTypeSchema>;

export const elementSchema = z.object({
  /** Unique ID within the scene */
  id: z.string().min(1).max(100),
  /** Element type */
  type: elementTypeSchema,
  /** Human-readable name (shown in layers panel) */
  name: z.string().max(100).default('Element'),
  /** Whether element is visible */
  visible: z.boolean().default(true),
  /** Whether element is locked (no drag/resize) */
  locked: z.boolean().default(false),
  /** Timing within the scene */
  timing: timingSchema.default((): z.infer<typeof timingSchema> => ({startFrame: 0, endFrame: null})),
  /** Transform (position, size, rotation) */
  transform: transformSchema.default((): z.infer<typeof transformSchema> => ({x: 0.5, y: 0.5, width: 0.8, height: null, rotation: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 10, opacity: 1})),
  /** Responsive overrides per aspect ratio */
  responsiveOverrides: z.object({
    '16:9': responsiveOverrideSchema.optional(),
    '9:16': responsiveOverrideSchema.optional(),
    '1:1': responsiveOverrideSchema.optional(),
  }).default(() => ({})),
  /** Type-specific props (text, image, or shape) */
  props: z.record(z.string(), z.unknown()).default({}),
  /** Entry and exit animations */
  animation: z.object({
    in: elementAnimationSchema.optional(),
    out: elementAnimationSchema.optional(),
  }).default({}),
});
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
  /** Unique ID within the document */
  id: z.string().min(1).max(100),
  /** Human-readable scene name */
  name: z.string().max(100).default('Scene'),
  /** Duration in frames */
  durationFrames: z.number().int().min(1).max(9000).default(90),
  /** Scene background */
  background: backgroundSchema.default({type: 'gradient', color1: '#FFFFFF', color2: '#F7FAFC', angle: 135}),
  /** Elements in this scene */
  elements: z.array(elementSchema).default([]),
});
export type V2Scene = z.infer<typeof sceneSchema>;

// ─── Merge Tag ────────────────────────────────────────────────────

export const mergeTagTypeSchema = z.enum([
  'text',
  'number',
  'currency',
  'color',
  'image',
  'boolean',
  'url',
  'date',
]);
export type MergeTagType = z.infer<typeof mergeTagTypeSchema>;

export const mergeTagSchema = z.object({
  /** Tag key (matches {{key}} in element content/props) */
  key: z.string().min(1).max(50).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  /** Tag type for validation */
  type: mergeTagTypeSchema,
  /** Human-readable label */
  label: z.string().max(100),
  /** Default value */
  defaultValue: z.string().default(''),
  /** Whether this tag is required */
  required: z.boolean().default(false),
});
export type MergeTag = z.infer<typeof mergeTagSchema>;

// ─── V2 Document ──────────────────────────────────────────────────

export const V2_DOCUMENT_VERSION = 2;

export const v2DocumentSchema = z.object({
  /** Schema version for migrations */
  schemaVersion: z.literal(V2_DOCUMENT_VERSION),
  /** Unique template ID */
  id: z.string().min(1).max(100),
  /** Template name */
  name: z.string().min(1).max(200),
  /** Template description */
  description: z.string().max(1000).default(''),
  /** Frames per second */
  fps: z.number().int().min(1).max(120).default(30),
  /** Default aspect ratio */
  defaultAspectRatio: aspectRatioSchema.default('16:9'),
  /** Supported aspect ratios */
  supportedAspectRatios: z.array(aspectRatioSchema).min(1).default(['16:9', '9:16', '1:1']),
  /** Scenes in order */
  scenes: z.array(sceneSchema).min(1),
  /** Merge tag definitions */
  mergeTags: z.array(mergeTagSchema).default([]),
  /** Additional metadata */
  metadata: z.record(z.string(), z.unknown()).default({}),
  /** Creation timestamp (ISO 8601) */
  createdAt: z.string().datetime().optional(),
  /** Last update timestamp (ISO 8601) */
  updatedAt: z.string().datetime().optional(),
});
export type V2Document = z.infer<typeof v2DocumentSchema>;

// ─── Validation Helpers ───────────────────────────────────────────

/** Validate a V2 document. Returns typed result. */
export function validateDocument(data: unknown): V2Document {
  return v2DocumentSchema.parse(data);
}

/** Safe validation that returns success/error without throwing. */
export function safeValidateDocument(data: unknown):
  | {success: true; data: V2Document}
  | {success: false; error: z.ZodError} {
  const result = v2DocumentSchema.safeParse(data);
  if (result.success) return {success: true, data: result.data};
  return {success: false, error: result.error};
}

/** Check if a value is a valid V2 document (type guard). */
export function isV2Document(data: unknown): data is V2Document {
  return v2DocumentSchema.safeParse(data).success;
}
