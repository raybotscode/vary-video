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

import dns from 'node:dns/promises';
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

const ipv4ToInt = (address: string): number | null => {
  const parts = address.split('.');
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    value = (value << 8) + octet;
  }

  return value >>> 0;
};

const ipv4InCidr = (address: string, base: string, prefix: number): boolean => {
  const addressInt = ipv4ToInt(address);
  const baseInt = ipv4ToInt(base);
  if (addressInt === null || baseInt === null) return false;
  if (prefix === 0) return true;

  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (addressInt & mask) === (baseInt & mask);
};

const parseIpv6ToBigInt = (address: string): bigint | null => {
  const clean = address.replace(/^\[|\]$/g, '').toLowerCase();
  const ipv4Match = clean.match(/(.+:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  const embeddedIpv4 = ipv4Match ? ipv4ToInt(ipv4Match[2]) : null;
  if (ipv4Match && embeddedIpv4 === null) return null;

  const normalized = ipv4Match && embeddedIpv4 !== null
    ? `${ipv4Match[1]}${(embeddedIpv4 >>> 16).toString(16)}:${(embeddedIpv4 & 0xffff).toString(16)}`
    : clean;

  if (normalized.includes(':::')) return null;

  const [leftRaw, rightRaw] = normalized.split('::');
  if (normalized.split('::').length > 2) return null;

  const left = leftRaw ? leftRaw.split(':') : [];
  const right = rightRaw ? rightRaw.split(':') : [];
  const missing = normalized.includes('::') ? 8 - left.length - right.length : 0;
  if (missing < 0) return null;

  const hextets = [...left, ...Array(missing).fill('0'), ...right];
  if (hextets.length !== 8) return null;

  let result = 0n;
  for (const hextet of hextets) {
    if (!/^[0-9a-f]{1,4}$/.test(hextet)) return null;
    result = (result << 16n) + BigInt(parseInt(hextet, 16));
  }

  return result;
};

const ipv6InCidr = (address: string, base: string, prefix: number): boolean => {
  const addressInt = parseIpv6ToBigInt(address);
  const baseInt = parseIpv6ToBigInt(base);
  if (addressInt === null || baseInt === null) return false;
  if (prefix === 0) return true;

  const shift = BigInt(128 - prefix);
  return (addressInt >> shift) === (baseInt >> shift);
};

const getEmbeddedIpv4FromMappedIpv6 = (address: string): string | null => {
  const clean = address.replace(/^\[|\]$/g, '').toLowerCase();
  const dottedMatch = clean.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dottedMatch && ipv4ToInt(dottedMatch[1]) !== null) return dottedMatch[1];

  if (!ipv6InCidr(clean, '::ffff:0:0', 96)) return null;
  const parsed = parseIpv6ToBigInt(clean);
  if (parsed === null) return null;

  const embedded = Number(parsed & 0xffffffffn);
  return [
    (embedded >>> 24) & 255,
    (embedded >>> 16) & 255,
    (embedded >>> 8) & 255,
    embedded & 255,
  ].join('.');
};

const isDeniedIpv4 = (address: string): boolean => {
  const ranges: Array<[string, number]> = [
    ['127.0.0.0', 8],
    ['10.0.0.0', 8],
    ['172.16.0.0', 12],
    ['192.168.0.0', 16],
    ['169.254.0.0', 16],
    ['0.0.0.0', 8],
    ['100.64.0.0', 10],
    ['198.18.0.0', 15],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
  ];

  return ranges.some(([base, prefix]) => ipv4InCidr(address, base, prefix));
};

const isDeniedIpv6 = (address: string): boolean => {
  const clean = address.replace(/^\[|\]$/g, '').toLowerCase();
  const embeddedIpv4 = getEmbeddedIpv4FromMappedIpv6(clean);
  if (embeddedIpv4) return isDeniedIpv4(embeddedIpv4);

  const ranges: Array<[string, number]> = [
    ['::1', 128],
    ['fc00::', 7],
    ['fe80::', 10],
    ['::', 128],
    ['100::', 64],
    ['2001:db8::', 32],
  ];

  return ranges.some(([base, prefix]) => ipv6InCidr(clean, base, prefix));
};

/**
 * Check if a hostname is a private/internal literal address.
 */
const isPrivateHostname = (hostname: string): boolean => {
  // Strip brackets from IPv6 addresses: [::1] → ::1
  const clean = hostname.replace(/^\[|\]$/g, '');

  // localhost variants
  if (clean.toLowerCase() === 'localhost') {
    return true;
  }

  if (ipv4ToInt(clean) !== null) return isDeniedIpv4(clean);
  if (parseIpv6ToBigInt(clean) !== null) return isDeniedIpv6(clean);

  return false;
};

export const resolveAndValidateHost = async (hostname: string): Promise<string[]> => {
  const clean = hostname.replace(/^\[|\]$/g, '');
  const errors: string[] = [];

  if (isPrivateHostname(clean)) {
    return [`Private/internal addresses are not allowed: '${hostname}'`];
  }

  try {
    const resolved = await dns.lookup(clean, {all: true});
    for (const {address} of resolved) {
      if (isDeniedIpv4(address) || isDeniedIpv6(address)) {
        errors.push(`Hostname '${hostname}' resolves to a private/internal address: '${address}'`);
      }
    }
  } catch (error) {
    errors.push(`DNS lookup failed for '${hostname}': ${error instanceof Error ? error.message : 'unknown'}`);
  }

  return errors;
};

/**
 * Validate a URL's scheme and hostname without making HTTP requests.
 * Returns errors if the URL is invalid or points to a private host.
 */
export const validateUrlLocally = async (urlString: string): Promise<string[]> => {
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

  if (errors.length === 0) {
    errors.push(...await resolveAndValidateHost(url.hostname));
  }

  return errors;
};

const redirectStatuses = new Set([301, 302, 307, 308]);
const maxRedirectHops = 5;

const fetchHeadWithValidatedRedirects = async (
  urlString: string,
  signal: AbortSignal,
): Promise<Response | {errors: string[]; finalUrl: string}> => {
  let currentUrl = urlString;

  for (let hop = 0; hop <= maxRedirectHops; hop += 1) {
    const response = await fetch(currentUrl, {
      method: 'HEAD',
      signal,
      redirect: 'manual',
    });

    if (!redirectStatuses.has(response.status)) {
      return response;
    }

    if (hop === maxRedirectHops) {
      return {errors: [`Too many redirects: maximum ${maxRedirectHops} hops allowed`], finalUrl: currentUrl};
    }

    const location = response.headers.get('location');
    if (!location) {
      return {errors: [`HTTP ${response.status}: redirect response missing Location header`], finalUrl: currentUrl};
    }

    const nextUrl = new URL(location, currentUrl).toString();
    const currentScheme = new URL(currentUrl).protocol;
    const nextScheme = new URL(nextUrl).protocol;

    const redirectErrors = await validateUrlLocally(nextUrl);
    if (redirectErrors.length > 0) {
      return {errors: redirectErrors, finalUrl: currentUrl};
    }

    if (currentScheme === 'https:' && nextScheme === 'http:') {
      return {errors: ['Redirect downgraded from HTTPS to HTTP — insecure redirect blocked'], finalUrl: currentUrl};
    }

    currentUrl = nextUrl;
  }

  return {errors: [`Too many redirects: maximum ${maxRedirectHops} hops allowed`], finalUrl: currentUrl};
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
  const localErrors = await validateUrlLocally(urlString);
  if (localErrors.length > 0) {
    return {valid: false, url: urlString, errors: localErrors};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const responseOrError = await fetchHeadWithValidatedRedirects(urlString, controller.signal);

    clearTimeout(timeout);

    const errors: string[] = [];
    if ('errors' in responseOrError) {
      return {
        valid: false,
        url: urlString,
        errors: responseOrError.errors,
        metadata: {
          finalUrl: responseOrError.finalUrl,
        },
      };
    }

    const response = responseOrError;
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

    errors.push(...await validateUrlLocally(finalUrl));

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
