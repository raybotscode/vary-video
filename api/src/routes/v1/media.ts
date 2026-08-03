import {Router} from 'express';
import {z} from 'zod';
import {validateUrlLocally, validateMediaUrlRemote} from '../../services/mediaValidation';

export const mediaRouter = Router();

const validateRequestSchema = z.object({
  url: z.string().url(),
  acceptedMimeTypes: z.array(z.string()).optional(),
  maxBytes: z.number().int().positive().optional(),
});

const batchValidateRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
  acceptedMimeTypes: z.array(z.string()).optional(),
  maxBytes: z.number().int().positive().optional(),
});

/**
 * POST /api/v1/media/validate
 * Validate a single media URL with local + remote checks.
 */
mediaRouter.post('/validate', async (req, res) => {
  const parsed = validateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const {url, acceptedMimeTypes, maxBytes} = parsed.data;

  // Local validation (fast, no network)
  const localErrors = validateUrlLocally(url);
  if (localErrors.length > 0) {
    res.json({
      valid: false,
      url,
      errors: localErrors,
    });
    return;
  }

  // Remote validation (HEAD request)
  const result = await validateMediaUrlRemote(url, {
    acceptedMimeTypes,
    maxBytes,
  });

  res.json(result);
});

/**
 * POST /api/v1/media/validate-batch
 * Validate multiple media URLs. Returns per-URL results.
 */
mediaRouter.post('/validate-batch', async (req, res) => {
  const parsed = batchValidateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const {urls, acceptedMimeTypes, maxBytes} = parsed.data;

  const results = await Promise.all(
    urls.map((url) =>
      validateMediaUrlRemote(url, {acceptedMimeTypes, maxBytes}).then((r) => ({
        url: r.url,
        valid: r.valid,
        errors: r.errors,
        metadata: r.metadata,
      })),
    ),
  );

  res.json({
    results,
    summary: {
      total: results.length,
      valid: results.filter((r) => r.valid).length,
      invalid: results.filter((r) => !r.valid).length,
    },
  });
});

/**
 * GET /api/v1/media/accepted-types
 * Returns the list of accepted MIME types and max file size.
 */
mediaRouter.get('/accepted-types', (_req, res) => {
  res.json({
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    maxBytes: 10 * 1024 * 1024,
    maxMB: 10,
  });
});
