import {Router} from 'express';
import path from 'node:path';
import {z, type ZodType} from 'zod';
import {getSchemaForTemplate} from '../../../src/templates/registry';
import {
  BatchRenderRequest,
  publicRenderDir,
  renderBatch,
  type VariantRenderResult,
} from '../services/renderer';

type JobStatus = 'queued' | 'rendering' | 'completed' | 'failed';

type RenderJob = {
  id: string;
  status: JobStatus;
  progress: number;
  completedVariants: number;
  totalVariants: number;
  downloads: string[];
  error?: string;
};

const batchRequestSchema = z.object({
  compositionId: z.string().min(1),
  template: z.record(z.string(), z.unknown()),
  variants: z.array(z.record(z.string(), z.string())).min(1),
});

const jobs = new Map<string, RenderJob>();
const jobOutputs = new Map<string, VariantRenderResult[]>();

const createJobId = (): string => {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const renderRouter = Router();

renderRouter.post('/batch', (req, res) => {
  const baseParsed = batchRequestSchema.safeParse(req.body);
  if (!baseParsed.success) {
    res.status(400).json({
      error: 'Invalid render batch request',
      details: z.flattenError(baseParsed.error),
    });
    return;
  }

  let schema: ZodType<any>;
  try {
    schema = getSchemaForTemplate(baseParsed.data.compositionId);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Unknown template',
    });
    return;
  }

  const templateParsed = schema.safeParse({
    ...baseParsed.data.template,
    data: {},
  });

  if (!templateParsed.success) {
    res.status(400).json({
      error: 'Invalid render template',
      details: z.flattenError(templateParsed.error),
    });
    return;
  }

  const request: BatchRenderRequest = baseParsed.data;
  const jobId = createJobId();
  const job: RenderJob = {
    id: jobId,
    status: 'queued',
    progress: 0,
    completedVariants: 0,
    totalVariants: request.variants.length,
    downloads: [],
  };
  jobs.set(jobId, job);

  void (async () => {
    try {
      job.status = 'rendering';
      const variantProgress = new Map<number, number>();
      const results = await renderBatch({
        request,
        outputDir: publicRenderDir,
        jobId,
        parallel: false,
        onVariantProgress: (variantIndex, progress) => {
          variantProgress.set(variantIndex, progress);
          const totalProgress = Array.from(variantProgress.values()).reduce(
            (sum, value) => sum + value,
            0,
          );
          job.completedVariants = Array.from(variantProgress.values()).filter(
            (value) => value >= 1,
          ).length;
          job.progress = Math.round(
            (totalProgress / request.variants.length) * 100,
          );
        },
      });

      jobOutputs.set(jobId, results);
      job.completedVariants = request.variants.length;
      job.progress = 100;
      job.status = 'completed';
      job.downloads = results.map((result) => result.downloadUrl);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown render error';
    }
  })();

  res.status(202).json({
    jobId,
    estimatedTimeSeconds: request.variants.length * 45,
    statusUrl: `/api/render/status/${jobId}`,
  });
});

renderRouter.get('/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({error: 'Render job not found'});
    return;
  }

  res.json(job);
});

renderRouter.get('/download/:jobId/:variantIndex', (req, res) => {
  const outputs = jobOutputs.get(req.params.jobId);
  const variantIndex = Number.parseInt(req.params.variantIndex, 10);

  if (!outputs || Number.isNaN(variantIndex)) {
    res.status(404).json({error: 'Rendered variant not found'});
    return;
  }

  const output = outputs.find((candidate) => candidate.index === variantIndex);
  if (!output) {
    res.status(404).json({error: 'Rendered variant not found'});
    return;
  }

  res.download(path.resolve(output.outputPath));
});
