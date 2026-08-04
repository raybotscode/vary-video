import {Router} from 'express';
import {z} from 'zod';
import {renderStill, selectComposition} from '@remotion/renderer';
import {getBundleUrl, makeInputProps} from '../../services/renderer';
import {compositionIdSchema} from '../../validation/composition';

export const previewRouter = Router();

const SCALE_PRESETS = {
  full: 1920,
  medium: 720,
  fast: 480,
} as const;

type ScalePreset = keyof typeof SCALE_PRESETS;

const previewRequestSchema = z.object({
  template: z.record(z.string(), z.unknown()),
  compositionId: compositionIdSchema.default('SceneBlockPlayer'),
  frame: z.number().int().min(0).default(0),
  variant: z.record(z.string(), z.string()).default({}),
  scale: z.enum(['full', 'medium', 'fast']).default('medium'),
});

/** Cap resolution at the given max long edge, preserve aspect ratio */
const capResolution = (width: number, height: number, maxLongEdge: number) => {
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

  const {template, compositionId, frame, variant, scale} = parsed.data;
  const maxLongEdge = SCALE_PRESETS[scale];

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
      maxLongEdge,
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
      jpegQuality: scale === 'fast' ? 40 : 60,
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

    // Classify errors for better frontend UX
    const isTimeout = message.toLowerCase().includes('timeout');
    const isBundle = message.toLowerCase().includes('bundle') || message.toLowerCase().includes('compilation');
    const isSchema = message.toLowerCase().includes('schema') || message.toLowerCase().includes('parse');

    const errorResponse: Record<string, unknown> = {
      error: message,
      retryable: !isSchema,
      classification: isTimeout ? 'timeout' : isBundle ? 'bundle-error' : isSchema ? 'validation-error' : 'render-error',
    };

    res.status(isSchema ? 400 : 500).json(errorResponse);
  }
});
