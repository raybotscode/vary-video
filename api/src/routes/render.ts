import {Router} from 'express';
import path from 'node:path';
import fs from 'node:fs';
import {z} from 'zod';
import {ZipArchive} from 'archiver';
import {compositionIdSchema} from '../validation/composition';
import {validateTemplateForComposition} from '../validation/composition';
import {validateBatchVariants} from '../services/variantResolution';
import {getAllMediaFieldIdsForComposition} from '../../../src/shared/capabilities/registry';
import {
  BatchRenderRequest,
  publicRenderDir,
  renderBatch,
  type VariantRenderResult,
} from '../services/renderer';
import {db} from '../db/client.js';
import {jobs as jobsTable, jobDownloads as jobDownloadsTable} from '../db/schema.js';
import {eq} from 'drizzle-orm';

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

const renderTemplateSchema = z.record(z.string(), z.unknown());

const batchRequestSchema = z.object({
  compositionId: compositionIdSchema,
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

renderRouter.post('/batch', async (req, res) => {
  const parsed = batchRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid render batch request',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const templateCheck = validateTemplateForComposition(
    parsed.data.compositionId,
    parsed.data.template,
    parsed.data.variants[0] ?? {},
  );
  if (!templateCheck.success) {
    res.status(400).json({
      error: 'Template props are invalid for the selected composition',
      details: z.flattenError(templateCheck.error),
    });
    return;
  }

  // Validate all variants for media field errors (Phase 3)
  const mediaFieldIds = getAllMediaFieldIdsForComposition(parsed.data.compositionId);
  if (mediaFieldIds.length > 0) {
    const variantErrors = await validateBatchVariants(parsed.data.variants, mediaFieldIds);
    if (variantErrors.size > 0) {
      const details: Record<number, string[]> = {};
      for (const [index, errors] of variantErrors) {
        details[index] = errors;
      }
      res.status(400).json({
        error: 'Some variants have invalid media fields',
        details: {variantErrors: details},
      });
      return;
    }
  }

  const {formats, ...request} = parsed.data;
  const jobId = createJobId();
  const totalWork = request.variants.length * formats.length;

  // Insert job into DB immediately
  const now = new Date();
  db.insert(jobsTable).values({
    id: jobId,
    status: 'queued',
    progress: 0,
    completedVariants: 0,
    totalVariants: totalWork,
    compositionId: request.compositionId,
    template: JSON.stringify(request.template),
    variants: JSON.stringify(request.variants),
    formats: JSON.stringify(formats),
    createdAt: now,
    updatedAt: now,
  }).run();

  // Keep in-memory Map for live progress updates
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
    // Periodic DB sync for live progress
    const syncInterval = setInterval(() => {
      try {
        db.update(jobsTable)
          .set({
            status: job.status,
            progress: job.progress,
            completedVariants: job.completedVariants,
            updatedAt: new Date(),
          })
          .where(eq(jobsTable.id, jobId))
          .run();
      } catch {
        // non-fatal — progress sync failure shouldn't kill the render
      }
    }, 5_000);

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

      clearInterval(syncInterval);

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

      // Final DB write — update job + insert download rows
      db.update(jobsTable).set({
        status: 'completed',
        progress: 100,
        completedVariants: totalWork,
        updatedAt: new Date(),
      }).where(eq(jobsTable.id, jobId)).run();

      for (const result of results) {
        const fi = result.index % fmtList.length;
        db.insert(jobDownloadsTable).values({
          jobId,
          variantIndex: result.index,
          format: fmtList[fi],
          outputPath: result.outputPath,
          downloadUrl: result.downloadUrl,
        }).run();
      }
    } catch (error) {
      clearInterval(syncInterval);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown render error';

      // Persist failure to DB
      try {
        db.update(jobsTable).set({
          status: 'failed',
          error: job.error,
          updatedAt: new Date(),
        }).where(eq(jobsTable.id, jobId)).run();
      } catch {
        // non-fatal
      }
    }
  })();

  res.status(202).json({
    jobId,
    estimatedTimeSeconds: totalWork * 45,
    statusUrl: `/api/render/status/${jobId}`,
  });
});

renderRouter.get('/status/:jobId', (req, res) => {
  // Check in-memory first (active jobs with live progress)
  const liveJob = jobs.get(req.params.jobId);
  if (liveJob) {
    res.json(liveJob);
    return;
  }

  // Fall back to DB (completed/failed jobs after restart)
  const dbJob = db.select().from(jobsTable).where(eq(jobsTable.id, req.params.jobId)).get();
  if (!dbJob) {
    res.status(404).json({error: 'Render job not found'});
    return;
  }

  const downloads = db.select().from(jobDownloadsTable)
    .where(eq(jobDownloadsTable.jobId, req.params.jobId))
    .all();

  res.json({
    id: dbJob.id,
    status: dbJob.status,
    progress: dbJob.progress,
    completedVariants: dbJob.completedVariants,
    totalVariants: dbJob.totalVariants,
    downloads: downloads.map((d) => d.downloadUrl),
    downloadLabels: downloads.map((d) => `Variant ${d.variantIndex + 1} — ${d.format}`),
    error: dbJob.error,
    formats: JSON.parse(dbJob.formats),
  });
});

renderRouter.get('/download/:jobId/:variantIndex', (req, res) => {
  const variantIndex = Number.parseInt(req.params.variantIndex, 10);

  // In-memory check (active job)
  const outputs = jobOutputs.get(req.params.jobId);
  if (outputs) {
    const output = outputs.find((o) => o.index === variantIndex);
    if (output) {
      res.download(path.resolve(output.outputPath));
      return;
    }
  }

  // DB check (persisted job)
  const download = db.select().from(jobDownloadsTable)
    .where(eq(jobDownloadsTable.jobId, req.params.jobId))
    .all()
    .find((d) => d.variantIndex === variantIndex);

  if (!download) {
    res.status(404).json({error: 'Rendered variant not found'});
    return;
  }

  res.download(path.resolve(download.outputPath));
});

renderRouter.get('/download-zip/:jobId', (req, res) => {
  try {
    // Check in-memory first
    let outputs = jobOutputs.get(req.params.jobId);
    let downloadRows: Array<{outputPath: string}> = [];

    if (!outputs) {
      // Fall back to DB
      downloadRows = db.select().from(jobDownloadsTable)
        .where(eq(jobDownloadsTable.jobId, req.params.jobId))
        .all();
    }

    const hasFiles = outputs ? outputs.length > 0 : downloadRows.length > 0;
    if (!hasFiles) {
      res.status(404).json({error: 'Render job not found or no outputs'});
      return;
    }

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

    if (outputs) {
      for (const output of outputs) {
        const filePath = path.resolve(output.outputPath);
        if (fs.existsSync(filePath)) {
          const filename = path.basename(filePath);
          archive.file(filePath, {name: filename});
        }
      }
    } else {
      for (const row of downloadRows) {
        const filePath = path.resolve(row.outputPath);
        if (fs.existsSync(filePath)) {
          const filename = path.basename(filePath);
          archive.file(filePath, {name: filename});
        }
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
