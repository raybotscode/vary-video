import type {VariantData} from '../utils/placeholder';
import type {
  BlockCapability,
  CapabilityRegistry,
  CompactCapabilitySummary,
  TemplateCapability,
} from '@vary/shared/capabilities/types';

/** /api/v1/capabilities response — full registry + compact summary. */
export type CapabilityRegistryResponse = CapabilityRegistry & {
  compactSummary: CompactCapabilitySummary;
};

export type {TemplateCapability, BlockCapability};

export type Composition = {
  id: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaults?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  name?: string;
  description?: string;
  useCase?: string;
  category?: string;
  placeholders?: string[];
  copyFields?: TemplateCopyField[];
  blockSequence?: string[];
};

export type TemplatePayload = {
  headlineTemplate: string;
  subheadlineTemplate: string;
  ctaText: string;
  brandColor: string;
  secondaryColor: string;
  logoUrl: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundImageUrl?: string;
};

/** Template copy values as edited in the dashboard. Any template's fields. */
export type RenderTemplatePayload = Record<string, unknown>;

export type TemplateCopyField = {
  id: string;
  label: string;
  default: string;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  useCase: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  category?: string;
  placeholders?: string[];
  copyFields?: TemplateCopyField[];
  defaults?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  blockSequence?: string[];
};

export type OutputFormat = VideoFormat;

export type BlockSequence = Array<{
  blockId: string;
  content: Record<string, string>;
  durationFrames?: number;
  animation?: {
    entry?: {presetId: string; durationFrames?: number; intensity?: number; easing?: string};
    exit?: {presetId: string; durationFrames?: number; intensity?: number; easing?: string};
  };
  transition?: {
    type: string;
    durationFrames?: number;
    direction?: string;
    easing?: string;
    intensity?: number;
  };
  imageTreatment?: Record<string, unknown>;
}>;

export type VideoFormat = '16:9' | '1:1' | '9:16' | '4:5';

export type AudioConfig = {
  src: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  startOffset?: number;
};

export type UploadedAudio = {
  id: string;
  jobId: string;
  filename: string;
  url: string;
  sizeBytes: number;
  durationSeconds: number | null;
  mimeType: string;
};

export const FORMAT_LABELS: Record<VideoFormat, string> = {
  '16:9': 'Landscape (1920×1080)',
  '1:1': 'Square (1080×1080)',
  '9:16': 'Vertical / Story (1080×1920)',
  '4:5': 'Instagram (1080×1350)',
};

export type BatchRenderResponse = {
  jobId: string;
  estimatedTimeSeconds: number;
  statusUrl: string;
};

export type RenderStatus = {
  id: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  completedVariants: number;
  totalVariants: number;
  downloads: string[];
  /** Label per download index — matches `downloads` order */
  downloadLabels?: string[];
  error?: string;
  formats?: string[];
};

// API base URL — defaults to /api (proxied in dev). Set VITE_API_URL at build time
// or override via window.__VARY_API_URL at runtime for tunnel testing.
const apiBase = (typeof window !== 'undefined' && (window as any).__VARY_API_URL) || import.meta.env.VITE_API_URL || '/api';

const apiUrl = (path: string) => `${apiBase}${path}`;

/**
 * Normalize an API-relative path against a configured base.
 * Handles every current path shape without double-prefixing:
 * - absolute http(s) URL → returned unchanged
 * - `/api/...` path + base ending in `/api` (default or tunnel) → leading
 *   `/api` is stripped before joining so we never produce `/api/api/...`
 * - `/render/...` or other relative path → joined onto the base
 */
export const resolveApiPath = (pathOrUrl: string, base: string): string => {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedBase = base.replace(/\/+$/, '');
  const baseEndsWithApi = normalizedBase.endsWith('/api');
  const path = baseEndsWithApi && pathOrUrl.startsWith('/api/')
    ? pathOrUrl.slice('/api'.length)
    : pathOrUrl;

  return `${normalizedBase}${path}`;
};

/**
 * Resolve an API-relative path against the configured API base (tunnel-aware).
 * Absolute http(s) URLs pass through unchanged.
 */
export const resolveApiUrl = (pathOrUrl: string): string => resolveApiPath(pathOrUrl, apiBase);

/**
 * Resolve a download URL from the API. The API returns relative paths
 * (e.g. /api/render/download/<job>/<i>); resolve against the configured base
 * so tunnel overrides (window.__VARY_API_URL) apply to downloads too.
 */
export const resolveApiDownloadUrl = (pathOrUrl: string): string =>
  resolveApiPath(pathOrUrl, apiBase);

const readJson = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    const text = await response.text().catch(() => '');
    const looksLikeHtml =
      text.trimStart().startsWith('<!doctype html') ||
      text.includes('<div id="root">');
    throw new Error(
      looksLikeHtml
        ? 'Render API is not reachable. The deployed frontend is serving the app shell for /api; configure VITE_API_URL to a running Node render API.'
        : `Expected JSON from render API but received ${contentType || 'unknown content type'}.`,
    );
  }

  const body = (await response.json()) as T & {error?: string};

  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }

  return body;
};

export const apiClient = {
  /**
   * Fetch the canonical capability registry (v1). Includes templates,
   * blocks, styles, animations, version hash, and the compact AI summary.
   */
  async getCapabilities(): Promise<CapabilityRegistryResponse> {
    const response = await fetch(apiUrl('/v1/capabilities'));
    return readJson<CapabilityRegistryResponse>(response);
  },

  /** Fetch enabled templates from v1. */
  async getTemplates(): Promise<TemplateCapability[]> {
    const response = await fetch(apiUrl('/v1/templates'));
    const data = await readJson<{templates: TemplateCapability[]}>(response);
    return data.templates;
  },

  /** Fetch enabled blocks from v1. */
  async getBlocks(): Promise<BlockCapability[]> {
    const response = await fetch(apiUrl('/v1/blocks'));
    const data = await readJson<{blocks: BlockCapability[]}>(response);
    return data.blocks;
  },

  /** Legacy compositions list — fallback when v1 is unavailable. */
  async getCompositions(): Promise<Composition[]> {
    const getResponse = await fetch(apiUrl('/compositions'));

    if (getResponse.ok) {
      const data = await readJson<{compositions: Composition[]}>(getResponse);
      return data.compositions;
    }

    if (getResponse.status !== 404 && getResponse.status !== 405) {
      await readJson(getResponse);
    }

    const postResponse = await fetch(apiUrl('/compositions'), {method: 'POST'});
    const data = await readJson<{compositions: Composition[]}>(postResponse);
    return data.compositions;
  },

  async startBatchRender({
    compositionId,
    template,
    variants,
    formats = ['16:9'],
    blockSequence,
  }: {
    compositionId: string;
    template: RenderTemplatePayload;
    variants: VariantData[];
    formats?: VideoFormat[];
    blockSequence?: BlockSequence;
  }): Promise<BatchRenderResponse> {
    const response = await fetch(apiUrl('/render/batch'), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        compositionId,
        template,
        variants,
        formats,
        blockSequence,
      }),
    });

    if (response.status === 404 || response.status === 405) {
      throw new Error(
        'Render API is not deployed at this URL. Configure VITE_API_URL to a running Node render API and redeploy the frontend.',
      );
    }

    return readJson<BatchRenderResponse>(response);
  },

  async getRenderStatus(jobId: string): Promise<RenderStatus> {
    const response = await fetch(apiUrl(`/render/status/${jobId}`));
    return readJson<RenderStatus>(response);
  },

  getZipDownloadUrl(jobId: string): string {
    return apiUrl(`/render/download-zip/${jobId}`);
  },

  async uploadAudio(file: File, jobId?: string): Promise<UploadedAudio> {
    const form = new FormData();
    form.append('file', file);
    if (jobId) form.append('jobId', jobId);
    const response = await fetch(apiUrl('/v1/audio/upload'), {
      method: 'POST',
      body: form,
    });
    return readJson<UploadedAudio>(response);
  },

  async listAudio(): Promise<UploadedAudio[]> {
    const response = await fetch(apiUrl('/v1/audio'));
    const data = await readJson<{audio: UploadedAudio[]}>(response);
    return data.audio;
  },
};
