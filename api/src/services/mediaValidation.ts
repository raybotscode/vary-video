/**
 * Server-side media URL validation and remote probing.
 *
 * Validates external image URLs by checking:
 * - URL scheme (http/https only)
 * - Hostname (blocks localhost, private IPs)
 * - HTTP HEAD response (MIME type, content length, redirect safety)
 * - Download size limits
 *
 * Used by /api/v1/media/validate and /api/render/batch.
 */

import {ACCEPTED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES} from '../../../src/shared/capabilities/media';

export type MediaValidationResult = {
  valid: boolean;
  url: string;
  errors: string[];
  metadata?: {
    contentType?: string;
    contentLength?: number;
    finalUrl?: string;
    statusCode?: number;
  };
};

/**
 * Check if a hostname is a private/internal IP address.
 * Blocks: 127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, ::1, fc00::/7
 */
const isPrivateHostname = (hostname: string): boolean => {
  // Strip brackets from IPv6 addresses: [::1] → ::1
  const clean = hostname.replace(/^\[|\]$/g, '');

  // localhost variants
  if (clean === 'localhost' || clean === '::1' || clean === '0.0.0.0') {
    return true;
  }

  // IPv4 private ranges
  const ipv4Match = clean.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    // 127.0.0.0/8
    if (a === 127) return true;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true;
  }

  // IPv6 private ranges (fc00::/7, fe80::/10)
  if (clean.startsWith('fc') || clean.startsWith('fd') ||
      clean.startsWith('fe8') || clean.startsWith('fe9') ||
      clean.startsWith('fea') || clean.startsWith('feb')) {
    return true;
  }

  return false;
};

/**
 * Validate a URL's scheme and hostname without making HTTP requests.
 * Returns errors if the URL is invalid or points to a private host.
 */
export const validateUrlLocally = (urlString: string): string[] => {
  const errors: string[] = [];

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    errors.push(`Invalid URL: '${urlString}'`);
    return errors;
  }

  // Scheme check
  if (!['http:', 'https:'].includes(url.protocol)) {
    errors.push(`Invalid URL scheme '${url.protocol}' — must be http or https`);
  }

  // Hostname check
  if (isPrivateHostname(url.hostname)) {
    errors.push(`Private/internal addresses are not allowed: '${url.hostname}'`);
  }

  return errors;
};

/**
 * Validate a media URL by performing an HTTP HEAD request.
 * Checks MIME type, content length, redirect safety, and download limits.
 */
export const validateMediaUrlRemote = async (
  urlString: string,
  options?: {
    timeoutMs?: number;
    maxBytes?: number;
    acceptedMimeTypes?: string[];
  },
): Promise<MediaValidationResult> => {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const maxBytes = options?.maxBytes ?? MAX_IMAGE_BYTES;
  const acceptedTypes = options?.acceptedMimeTypes ?? ACCEPTED_IMAGE_MIME_TYPES;

  // Local validation first
  const localErrors = validateUrlLocally(urlString);
  if (localErrors.length > 0) {
    return {valid: false, url: urlString, errors: localErrors};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(urlString, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    const errors: string[] = [];
    const contentType = response.headers.get('content-type') ?? undefined;
    const contentLength = response.headers.get('content-length');
    const finalUrl = response.url;
    const statusCode = response.status;

    // Status check
    if (!response.ok) {
      errors.push(`HTTP ${response.status}: ${response.statusText || 'request failed'}`);
    }

    // MIME type check (only if content-type header is present)
    if (contentType) {
      const mimeType = contentType.split(';')[0].trim().toLowerCase();
      if (!acceptedTypes.includes(mimeType)) {
        errors.push(`Unsupported MIME type '${mimeType}' — accepted: ${acceptedTypes.join(', ')}`);
      }
    }

    // Content length check
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      if (!isNaN(bytes) && bytes > maxBytes) {
        const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
        const actualMB = (bytes / (1024 * 1024)).toFixed(1);
        errors.push(`File too large: ${actualMB}MB (max ${maxMB}MB)`);
      }
    }

    // Redirect safety check — ensure final URL is still safe
    if (finalUrl && finalUrl !== urlString) {
      const redirectErrors = validateUrlLocally(finalUrl);
      errors.push(...redirectErrors);
      if (redirectErrors.length === 0) {
        // Check for protocol downgrade (https → http)
        const originalScheme = new URL(urlString).protocol;
        const finalScheme = new URL(finalUrl).protocol;
        if (originalScheme === 'https:' && finalScheme === 'http:') {
          errors.push('Redirect downgraded from HTTPS to HTTP — insecure redirect blocked');
        }
      }
    }

    return {
      valid: errors.length === 0,
      url: urlString,
      errors,
      metadata: {
        contentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : undefined,
        finalUrl,
        statusCode,
      },
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        valid: false,
        url: urlString,
        errors: [`Request timed out after ${timeoutMs}ms`],
      };
    }

    return {
      valid: false,
      url: urlString,
      errors: [`Network error: ${error instanceof Error ? error.message : 'unknown'}`],
    };
  }
};

/**
 * Validate multiple media URLs in parallel.
 * Returns a map of URL → validation result.
 */
export const validateMediaUrlsBatch = async (
  urls: string[],
  options?: {
    timeoutMs?: number;
    maxBytes?: number;
    acceptedMimeTypes?: string[];
    concurrency?: number;
  },
): Promise<Map<string, MediaValidationResult>> => {
  const concurrency = options?.concurrency ?? 5;
  const results = new Map<string, MediaValidationResult>();

  // Process in chunks to avoid overwhelming the network
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map((url) => validateMediaUrlRemote(url, options)),
    );
    for (const result of chunkResults) {
      results.set(result.url, result);
    }
  }

  return results;
};
