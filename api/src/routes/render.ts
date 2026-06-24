import {Router} from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {z} from 'zod';
import {ZipArchive} from 'archiver';
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
  /** Label per download index — matches `downloads` order */
  downloadLabels: string[];
  error?: string;
  formats?: string[];
};

const FORMAT_PRESETS: Record<string, {width: number; height: number; suffix: string; label: string}> = {
  '16:9':  {width: 1920, height: 1080, suffix: '', label: 'Landscape'},
  '1:1':   {width: 1080, height: 1080, suffix: '-square', label: 'Square'},
  '9:16':  {width: 1080, height: 1920, suffix: '-vertical', label: 'Vertical / Story'},
  '4:5':   {width: 1080, height: 1350, suffix: '-instagram', label: 'Instagram'},
};

const renderTemplateSchema = z.object({
  headlineTemplate: z.string(),
  subheadlineTemplate: z.string(),
  ctaText: z.string(),
  brandColor: z.string(),
  secondaryColor: z.string(),
  logoUrl: z.string().default(''),
  backgroundType: z.enum(['solid', 'gradient', 'image']),
  backgroundColor: z.string(),
  backgroundImageUrl: z.string().optional(),
});

const batchRequestSchema = z.object({
  compositionId: z.literal('InsuranceAd'),
  template: renderTemplateSchema,
  variants: z.array(z.record(z.string(), z.string())).min(1),
  formats: z.array(z.enum(['16:9', '1:1', '9:16', '4:5'])).optional().default(['16:9']),
});

const jobs = new Map<string, RenderJob>();
const jobOutputs = new Map<string, VariantRenderResult[]>();

const createJobId = (): string => {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const renderRouter = Router();

renderRouter.post('/batch', (req, res) => {
  const parsed = batchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid render batch request',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const {formats, ...request} = parsed.data;
  const jobId = createJobId();
  const totalWork = request.variants.length * formats.length;
  const job: RenderJob = {
    id: jobId,
    status: 'queued',
    progress: 0,
    completedVariants: 0,
    totalVariants: totalWork,
    downloads: [],
    downloadLabels: [],
    formats,
  };
  jobs.set(jobId, job);

  void (async () => {
    try {
      job.status = 'rendering';
      const completedWork = new Map<string, number>();

      const results: VariantRenderResult[] = [];
      let sequentialIndex = 0;

      for (let variantIndex = 0; variantIndex < request.variants.length; variantIndex += 1) {
        for (let formatIndex = 0; formatIndex < formats.length; formatIndex += 1) {
          const fmt = FORMAT_PRESETS[formats[formatIndex]];
          const variant = request.variants[variantIndex];
          const workKey = `${variantIndex}-${formatIndex}`;

          const result = await renderBatch({
            request: {...request, variants: [variant]},
            outputDir: publicRenderDir,
            jobId,
            customOutputPath: `${jobId}-variant-${variantIndex}${fmt.suffix}.mp4`,
            width: fmt.width,
            height: fmt.height,
            parallel: false,
            onVariantProgress: (_index, progress) => {
              completedWork.set(workKey, progress);
              const totalProgress = Array.from(completedWork.values()).reduce((s, v) => s + v, 0);
              const done = Array.from(completedWork.values()).filter((v) => v >= 1).length;
              job.completedVariants = done;
              job.progress = Math.round((totalProgress / totalWork) * 100);
            },
          });

          if (result.length > 0) {
            results.push({
              ...result[0],
              index: sequentialIndex,
              downloadUrl: `/api/render/download/${jobId}/${sequentialIndex}`,
            });
          }
          sequentialIndex += 1;
        }
      }

      const fmtList = formats;
      jobOutputs.set(jobId, results);
      job.completedVariants = totalWork;
      job.progress = 100;
      job.status = 'completed';
      job.downloads = results.map((result) => result.downloadUrl);
      job.downloadLabels = results.map((result) => {
        const fi = result.index % fmtList.length;
        const vi = Math.floor(result.index / fmtList.length);
        return `Variant ${vi + 1} — ${fmtList[fi]}`;
      });
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown render error';
    }
  })();

  res.status(202).json({
    jobId,
    estimatedTimeSeconds: totalWork * 45,
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

renderRouter.get('/download-zip/:jobId', (req, res) => {
  try {
    const outputs = jobOutputs.get(req.params.jobId);
    if (!outputs || outputs.length === 0) {
      res.status(404).json({error: 'Render job not found or no outputs'});
      return;
    }

    const job = jobs.get(req.params.jobId);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="vary-video-${req.params.jobId}.zip"`);

    const archive = new ZipArchive();
    archive.pipe(res);

    archive.on('error', (err: Error) => {
      console.error('Archiver error:', err);
      if (!res.headersSent) {
        res.status(500).json({error: `ZIP creation failed: ${err.message}`});
      }
    });

    for (const output of outputs) {
      const filePath = path.resolve(output.outputPath);
      if (fs.existsSync(filePath)) {
        const filename = path.basename(filePath);
        archive.file(filePath, {name: filename});
      }
    }

    archive.finalize();
  } catch (err) {
    console.error('ZIP endpoint error:', err);
    if (!res.headersSent) {
      res.status(500).json({error: err instanceof Error ? err.message : 'ZIP download failed'});
    }
  }
});
