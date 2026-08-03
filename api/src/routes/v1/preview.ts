import {Router} from 'express';
import {z} from 'zod';
import {renderStill, selectComposition} from '@remotion/renderer';
import {getBundleUrl, makeInputProps} from '../../services/renderer';
import {compositionIdSchema} from '../../validation/composition';

export const previewRouter = Router();

const previewRequestSchema = z.object({
  template: z.record(z.string(), z.unknown()),
  compositionId: compositionIdSchema.default('SceneBlockPlayer'),
  frame: z.number().int().min(0).default(0),
  variant: z.record(z.string(), z.string()).default({}),
});

/** Cap resolution at 720px on longest edge, preserve aspect ratio */
const capResolution = (width: number, height: number, maxLongEdge = 720) => {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) return {width, height};
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

previewRouter.post('/', async (req, res) => {
  const parsed = previewRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid preview request',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const {template, compositionId, frame, variant} = parsed.data;

  try {
    const serveUrl = await getBundleUrl();
    const inputProps = makeInputProps(compositionId, template, variant);

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
      logLevel: 'warn',
    });

    const {width, height} = capResolution(
      (composition.width as number) || 1920,
      (composition.height as number) || 1080,
    );

    const result = await renderStill({
      serveUrl,
      composition: {
        ...composition,
        width,
        height,
        durationInFrames: 1,
      },
      frame: Math.min(frame, composition.durationInFrames - 1),
      inputProps,
      imageFormat: 'jpeg',
      jpegQuality: 60,
      logLevel: 'warn',
    });

    const buffer = Buffer.isBuffer(result) ? result
      : result && typeof result === 'object' && 'buffer' in result
        ? (result as {buffer: Buffer}).buffer
        : result;

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Preview render failed';
    console.error('[preview]', message);
    res.status(500).json({error: message});
  }
});
