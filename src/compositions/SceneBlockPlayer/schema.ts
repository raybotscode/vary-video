import {z} from 'zod';
import {getBlock} from '../blocks/registry';

const blockSequenceItemSchema = z.object({
  blockId: z.string().min(1),
  content: z.record(z.string(), z.string()).default({}),
  durationFrames: z.number().int().positive().optional(),
  transitionFrames: z.number().int().min(0).optional(),
});

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
  data: z.record(z.string(), z.string()).default({}),
});

export type SceneBlockPlayerProps = z.infer<typeof sceneBlockPlayerSchema>;
export type SceneBlockSequenceItem = z.infer<typeof blockSequenceItemSchema>;

export const defaultSceneBlockPlayerProps: SceneBlockPlayerProps =
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
