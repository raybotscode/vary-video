import {z} from 'zod';
import {getBlock} from '../blocks/registry';
import {assertKnownEnabledBlockIds} from '../../shared/capabilities/registry';
import {
  imageTreatmentSchema,
  blockAnimationSettingsSchema,
  blockTransitionConfigSchema,
  elementLayoutSchema,
} from '../../shared/capabilities/schema';

/**
 * Block ID validation: rejects unknown/disabled block IDs at schema-parse
 * time so invalid specs fail before reaching the renderer (previously they
 * failed mid-render inside getBlock).
 */
const blockIdSchema = z
  .string()
  .min(1)
  .refine(
    (blockId) => {
      try {
        assertKnownEnabledBlockIds([blockId]);
        return true;
      } catch {
        return false;
      }
    },
    {message: 'Unknown or disabled block id'},
  );

const blockSequenceItemSchema = z.object({
  blockId: blockIdSchema,
  content: z.record(z.string(), z.string()).default({}),
  layout: z.record(z.string(), elementLayoutSchema).optional(),
  imageTreatment: imageTreatmentSchema.optional(),
  animation: blockAnimationSettingsSchema.optional(),
  transition: blockTransitionConfigSchema.optional(),
  durationFrames: z.number().int().positive().optional(),
  transitionFrames: z.number().int().min(0).optional(),
});

export const audioConfigSchema = z.object({
  src: z.string().min(1),
  volume: z.number().min(0).max(1).default(0.3),
  fadeIn: z.number().min(0).default(2),
  fadeOut: z.number().min(0).default(2),
  loop: z.boolean().default(true),
  startOffset: z.number().min(0).default(0),
});

export type AudioConfig = z.infer<typeof audioConfigSchema>;

export const sceneBlockPlayerSchema = z.object({
  blocks: z.array(blockSequenceItemSchema).min(1),
  brandSettings: z.object({
    brandColor: z.string().default('#1A365D'),
    secondaryColor: z.string().default('#3182CE'),
    accentColor: z.string().default('#FF6B5B'),
    logoUrl: z.string().default(''),
    backgroundType: z.enum(['solid', 'gradient', 'image']).default('gradient'),
    backgroundColor: z.string().default('#F7FAFC'),
    backgroundImageUrl: z.string().optional(),
  }),
  fps: z.number().int().positive().default(30),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  audio: audioConfigSchema.optional(),
  data: z.record(z.string(), z.string()).default({}),
});

export type SceneBlockPlayerProps = z.infer<typeof sceneBlockPlayerSchema>;
export type SceneBlockSequenceItem = z.infer<typeof blockSequenceItemSchema>;

export const getDefaultSceneBlockPlayerProps = (): SceneBlockPlayerProps =>
  sceneBlockPlayerSchema.parse({
    blocks: [
      {blockId: 'product-intro', content: getBlock('product-intro').defaultContent},
      {blockId: 'features-grid', content: getBlock('features-grid').defaultContent},
      {blockId: 'pricing-card', content: getBlock('pricing-card').defaultContent},
      {blockId: 'brand-frame', content: getBlock('brand-frame').defaultContent},
    ],
    brandSettings: {},
  });

export const getBlockDuration = (block: SceneBlockSequenceItem): number =>
  block.durationFrames ?? getBlock(block.blockId).defaultDurationFrames;

export const getSequenceDuration = (
  blocks: SceneBlockSequenceItem[],
): number => blocks.reduce((sum, block) => sum + getBlockDuration(block), 0);
