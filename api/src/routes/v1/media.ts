import {Router} from 'express';
import {z} from 'zod';
import {validateUrlLocally, validateMediaUrlRemote} from '../../services/mediaValidation';
import {ACCEPTED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES} from '../../../../src/shared/capabilities/media';

export const mediaRouter = Router();

const validateRequestSchema = z.object({
  url: z.string().url(),
});

const batchValidateRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(50),
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

  const {url} = parsed.data;

  // Local validation (fast, no network)
  const localErrors = await validateUrlLocally(url);
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
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
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

  const {urls} = parsed.data;

  const results = await Promise.all(
    urls.map((url) =>
      validateMediaUrlRemote(url, {
        acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
        maxBytes: MAX_IMAGE_BYTES,
      }).then((r) => ({
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
    mimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    maxMB: MAX_IMAGE_BYTES / (1024 * 1024),
  });
});
