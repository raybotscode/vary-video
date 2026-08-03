import type {PixabaySearchParams, PixabaySearchResponse} from './pixabay';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, {data: PixabaySearchResponse; expiresAt: number}>();

export const getCached = (key: string): PixabaySearchResponse | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

export const setCache = (key: string, data: PixabaySearchResponse): void => {
  cache.set(key, {data, expiresAt: Date.now() + CACHE_TTL_MS});
};

export const buildCacheKey = (params: PixabaySearchParams): string =>
  `${params.type}:${params.page ?? 1}:${params.per_page ?? 20}:${params.q.trim().toLowerCase()}`;
