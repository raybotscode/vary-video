import {z} from 'zod';

/**
 * Strict Zod schemas for capability metadata.
 * Used to validate API responses and AI-generated specs — unknown keys are
 * rejected so drift between registries fails loudly instead of silently.
 */

export const capabilityStatusSchema = z.enum(['enabled', 'disabled', 'deprecated']);

export const outputFormatSchema = z.enum(['16:9', '1:1', '9:16', '4:5']);

// --- Media / image treatment schemas ---

export const imageFitModeSchema = z.enum(['cover', 'contain', 'fit-width', 'fit-height']);

export const imageFocalPointSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

export const gradientOverlaySchema = z
  .object({
    enabled: z.boolean(),
    from: z.string(),
    to: z.string(),
    direction: z.enum(['to-top', 'to-bottom', 'to-left', 'to-right']),
    opacity: z.number().min(0).max(1),
  })
  .strict();

export const imageTreatmentSchema = z
  .object({
    fit: imageFitModeSchema.default('cover'),
    focalPoint: imageFocalPointSchema.optional(),
    horizontalPosition: z.enum(['left', 'center', 'right']).optional(),
    verticalPosition: z.enum(['top', 'center', 'bottom']).optional(),
    darkOverlay: z.number().min(0).max(1).optional(),
    blur: z.number().min(0).max(24).optional(),
    gradientOverlay: gradientOverlaySchema.optional(),
  })
  .strict();

export const mediaFieldCapabilitySchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['logo', 'background-image', 'image1', 'image2', 'person1', 'person2']),
    label: z.string().min(1),
    description: z.string().min(1),
    variantKey: z.string().min(1),
    legacyVariantKeys: z.array(z.string().min(1)).optional(),
    templateProp: z.string().min(1),
    required: z.boolean(),
    acceptedMimeTypes: z.array(z.string().min(1)).min(1),
    maxBytes: z.number().int().positive(),
    defaultTreatment: imageTreatmentSchema,
    status: capabilityStatusSchema,
  })
  .strict();

// --- Template / block / animation / style schemas ---

export const templateCopyFieldSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    default: z.string(),
  })
  .strict();

export const templateCapabilitySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.enum(['ad', 'social', 'property', 'product']),
    useCase: z.string(),
    supportedFormats: z.array(outputFormatSchema).min(1),
    requiredPlaceholders: z.array(z.string()),
    optionalPlaceholders: z.array(z.string()),
    copyFields: z.array(templateCopyFieldSchema),
    defaultBlocks: z.array(z.string()),
    previewImage: z.string().nullable(),
    version: z.string(),
    status: capabilityStatusSchema,
    tags: z.array(z.string()),
    mediaFields: z.array(z.string()).optional(),
    owner: z
      .discriminatedUnion('ownerType', [
        z.object({ownerType: z.literal('system')}).strict(),
        z.object({ownerType: z.literal('organisation'), organisationId: z.string()}).strict(),
      ])
      .optional(),
  })
  .strict();

export const blockContentFieldSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'url', 'color', 'number', 'image', 'image-treatment']),
    placeholder: z.string().optional(),
  })
  .strict();

export const blockCapabilitySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().min(1),
    category: z.enum(['intro', 'feature', 'cta', 'detail', 'hook', 'body', 'outro']),
    compatibleSchemas: z.array(z.string()),
    contentFields: z.array(blockContentFieldSchema),
    defaultDurationFrames: z.number().int().positive(),
    requiredBrandSettings: z.array(z.string()),
    supportedAnimations: z.array(z.string()),
    version: z.string(),
    status: capabilityStatusSchema,
    tags: z.array(z.string()),
    exampleUses: z.array(z.string()),
    mediaFields: z.array(z.string()).optional(),
    supportsImageTreatment: z.boolean().optional(),
    defaultImageTreatment: imageTreatmentSchema.optional(),
    owner: z
      .discriminatedUnion('ownerType', [
        z.object({ownerType: z.literal('system')}).strict(),
        z.object({ownerType: z.literal('organisation'), organisationId: z.string()}).strict(),
      ])
      .optional(),
  })
  .strict();

export const animationPresetCapabilitySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    direction: z.enum(['in', 'out']).optional(),
    supportedPositions: z.array(z.string()).optional(),
    parameters: z.object({
      intensity: z.boolean().optional(),
      durationFrames: z.boolean().optional(),
    }),
    compatibleBlockTypes: z.array(z.string()),
    version: z.string(),
    status: capabilityStatusSchema,
    tags: z.array(z.string()),
  })
  .strict();

export const stylePresetCapabilitySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
    }),
    typography: z.object({fontFamily: z.string().optional()}),
    backgroundTreatment: z.string(),
    defaultAnimations: z.array(z.string()),
    suitableIndustries: z.array(z.string()),
    version: z.string(),
    status: capabilityStatusSchema,
    tags: z.array(z.string()),
  })
  .strict();

export const capabilityVersionSchema = z
  .object({
    hash: z.string().min(1),
    generatedAt: z.string(),
  })
  .strict();

export const capabilityRegistrySchema = z
  .object({
    version: capabilityVersionSchema,
    templates: z.array(templateCapabilitySchema),
    blocks: z.array(blockCapabilitySchema),
    animations: z.array(animationPresetCapabilitySchema),
    styles: z.array(stylePresetCapabilitySchema),
    media: z.array(mediaFieldCapabilitySchema),
  })
  .strict();

export const compactCapabilitySummarySchema = z
  .object({
    version: z.string().min(1),
    templates: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          requiredFields: z.array(z.string()),
        })
        .strict(),
    ),
    blocks: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          category: z.enum(['intro', 'feature', 'cta', 'detail', 'hook', 'body', 'outro']),
          contentFields: z.array(z.string()),
          compatibleSchemas: z.array(z.string()),
        })
        .strict(),
    ),
    styles: z.array(z.string()),
    animations: z.array(z.string()),
    media: z.array(
      z
        .object({
          id: z.string(),
          variantKey: z.string(),
          required: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();
