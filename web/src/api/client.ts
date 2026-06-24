import type {VariantData} from '../utils/placeholder';

export type TemplateCopyField = {
  id: string;
  label: string;
  default: string;
};

export type Composition = {
  id: string;
  name?: string;
  description?: string;
  useCase?: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaults?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  placeholders?: string[];
  copyFields?: TemplateCopyField[];
  category?: 'ad' | 'social' | 'property' | 'product';
};

export type TemplateDefinition = Composition;

export type RenderTemplatePayload = Record<string, unknown>;

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
    try {
      const getResponse = await fetch('/api/compositions');

      if (getResponse.ok) {
        const data = await readJson<{compositions: Composition[]}>(getResponse);
        return data.compositions ?? [];
      }

      if (getResponse.status !== 404 && getResponse.status !== 405) {
        try {
          await readJson(getResponse);
        } catch {
          return [];
        }
      }

      const postResponse = await fetch('/api/compositions', {method: 'POST'});
      const data = await readJson<{compositions: Composition[]}>(postResponse);
      return data.compositions ?? [];
    } catch {
      return [];
    }
  },

  async startBatchRender({
    compositionId,
    template,
    variants,
  }: {
    compositionId: string;
    template: RenderTemplatePayload;
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
