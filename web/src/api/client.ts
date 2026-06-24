import type {VariantData} from '../utils/placeholder';

export type Composition = {
  id: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaults?: Record<string, unknown>;
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

export type VideoFormat = '16:9' | '1:1' | '9:16' | '4:5';

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

const readJson = async <T>(response: Response): Promise<T> => {
  const body = (await response.json().catch(() => ({}))) as T & {error?: string};

  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }

  return body;
};

export const apiClient = {
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
  }: {
    compositionId: string;
    template: TemplatePayload;
    variants: VariantData[];
    formats?: VideoFormat[];
  }): Promise<BatchRenderResponse> {
    const response = await fetch(apiUrl('/render/batch'), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        compositionId,
        template,
        variants,
        formats,
      }),
    });

    return readJson<BatchRenderResponse>(response);
  },

  async getRenderStatus(jobId: string): Promise<RenderStatus> {
    const response = await fetch(apiUrl(`/render/status/${jobId}`));
    return readJson<RenderStatus>(response);
  },

  getZipDownloadUrl(jobId: string): string {
    return apiUrl(`/render/download-zip/${jobId}`);
  },
};
