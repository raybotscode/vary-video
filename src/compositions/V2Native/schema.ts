import {z} from 'zod';
import {v2DocumentSchema} from '../../v2/schema/document';
import type {V2Document} from '../../v2/schema/document';

/**
 * Props accepted by the V2Native Remotion composition.
 *
 * - document: The full V2Document JSON object (the canonical v2 schema)
 * - data:      Pre-resolved merge tag values (key = tag key, value = resolved string)
 * - width/height/fps: Dynamic dimensions set by calculateMetadata
 */
export const v2NativeSchema = z.object({
  document: v2DocumentSchema,
  data: z.record(z.string(), z.string()).default({}),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().int().positive().default(30),
});

export type V2NativeProps = z.infer<typeof v2NativeSchema>;

/**
 * Build a minimal valid V2Document for testing defaults.
 */
export function getDefaultV2NativeProps(): V2NativeProps {
  return v2NativeSchema.parse({
    document: {
      schemaVersion: 3,
      id: 'default',
      name: 'Default V2 Document',
      fps: 30,
      defaultAspectRatio: '16:9',
      scenes: [
        {
          id: 'scene-1',
          name: 'Scene 1',
          durationFrames: 90,
          background: {type: 'solid', color: '#FFFFFF'},
          elements: [
            {
              id: 'el-1',
              name: 'Hello Text',
              type: 'text' as const,
              visible: true,
              locked: false,
              props: {
                content: 'Hello V2Native!',
                fontSize: 72,
                color: '#1A365D',
              },
            },
          ],
        },
      ],
    },
  });
}

/**
 * Compute total duration from a V2Document by summing scene durations.
 */
export function getV2DocumentDuration(document: V2Document): number {
  return document.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
}
