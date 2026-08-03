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

/**
 * GET /api/v1/media/search
 * Proxy to Pixabay API for stock media search.
 */
const searchRequestSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['images', 'video']).default('images'),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(3).max(100).default(20),
});

mediaRouter.get('/search', async (req, res) => {
  const parsed = searchRequestSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid search parameters',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const {getCached, setCache, buildCacheKey} = await import('../../services/pixabayCache');
  const {searchPixabay} = await import('../../services/pixabay');

  const params = parsed.data;
  const cacheKey = buildCacheKey(params);

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const result = await searchPixabay(params);
    setCache(cacheKey, result);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pixabay search failed';
    if (message.includes('PIXABAY_API_KEY')) {
      res.status(500).json({error: message});
    } else {
      res.status(502).json({error: `Pixabay API error: ${message}`});
    }
  }
});
