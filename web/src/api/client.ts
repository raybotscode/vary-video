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
  error?: string;
};

const readJson = async <T>(response: Response): Promise<T> => {
  const body = (await response.json().catch(() => ({}))) as T & {error?: string};

  if (!response.ok) {
    throw new Error(body.error || `Request failed with ${response.status}`);
  }

  return body;
};

export const apiClient = {
  async getCompositions(): Promise<Composition[]> {
    const getResponse = await fetch('/api/compositions');

    if (getResponse.ok) {
      const data = await readJson<{compositions: Composition[]}>(getResponse);
      return data.compositions;
    }

    if (getResponse.status !== 404 && getResponse.status !== 405) {
      await readJson(getResponse);
    }

    const postResponse = await fetch('/api/compositions', {method: 'POST'});
    const data = await readJson<{compositions: Composition[]}>(postResponse);
    return data.compositions;
  },

  async startBatchRender({
    compositionId,
    template,
    variants,
  }: {
    compositionId: string;
    template: TemplatePayload;
    variants: VariantData[];
  }): Promise<BatchRenderResponse> {
    const response = await fetch('/api/render/batch', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        compositionId,
        template,
        variants,
      }),
    });

    return readJson<BatchRenderResponse>(response);
  },

  async getRenderStatus(jobId: string): Promise<RenderStatus> {
    const response = await fetch(`/api/render/status/${jobId}`);
    return readJson<RenderStatus>(response);
  },
};
