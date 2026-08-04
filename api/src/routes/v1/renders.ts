import {Router} from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {db} from '../../db/client.js';
import {jobs as jobsTable, jobDownloads as jobDownloadsTable} from '../../db/schema.js';
import {eq, desc, count} from 'drizzle-orm';

export const rendersRouter = Router();

rendersRouter.get('/', (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit as string ?? '50', 10), 200);
  const offset = Number.parseInt(req.query.offset as string ?? '0', 10);
  const statusFilter = req.query.status as string | undefined;

  const whereClause = statusFilter
    ? eq(jobsTable.status, statusFilter as 'queued' | 'rendering' | 'completed' | 'failed')
    : undefined;

  const rows = db.select()
    .from(jobsTable)
    .where(whereClause)
    .orderBy(desc(jobsTable.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const [{total}] = db.select({total: count()}).from(jobsTable).where(whereClause).all();

  // Attach download count per job
  const renders = rows.map((row) => {
    const downloadCount = db.select({count: count()})
      .from(jobDownloadsTable)
      .where(eq(jobDownloadsTable.jobId, row.id))
      .get()?.count ?? 0;

    return {
      id: row.id,
      status: row.status,
      progress: row.progress,
      compositionId: row.compositionId,
      totalVariants: row.totalVariants,
      formats: JSON.parse(row.formats),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      downloadCount,
    };
  });

  res.json({renders, total});
});

rendersRouter.get('/:id', (req, res) => {
  const row = db.select().from(jobsTable).where(eq(jobsTable.id, req.params.id)).get();
  if (!row) {
    res.status(404).json({error: 'Render job not found'});
    return;
  }

  const downloads = db.select().from(jobDownloadsTable)
    .where(eq(jobDownloadsTable.jobId, row.id))
    .all();

  res.json({
    id: row.id,
    status: row.status,
    progress: row.progress,
    completedVariants: row.completedVariants,
    totalVariants: row.totalVariants,
    compositionId: row.compositionId,
    template: JSON.parse(row.template),
    variants: JSON.parse(row.variants),
    formats: JSON.parse(row.formats),
    error: row.error,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    downloads: downloads.map((d) => ({
      variantIndex: d.variantIndex,
      format: d.format,
      label: `Variant ${d.variantIndex + 1} — ${d.format}`,
      downloadUrl: d.downloadUrl,
    })),
  });
});

rendersRouter.post('/:id/retry', async (req, res) => {
  const row = db.select().from(jobsTable).where(eq(jobsTable.id, req.params.id)).get();
  if (!row) {
    res.status(404).json({error: 'Render job not found'});
    return;
  }

  if (row.status !== 'failed') {
    res.status(400).json({error: 'Only failed renders can be retried'});
    return;
  }

  const template = JSON.parse(row.template);
  const variants = JSON.parse(row.variants);
  const formats = JSON.parse(row.formats);
  const compositionId = row.compositionId;

  // Forward to the batch render endpoint internally
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  try {
    const batchResponse = await fetch(`${baseUrl}/api/render/batch`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({compositionId, template, variants, formats}),
    });

    const data = await batchResponse.json();
    if (!batchResponse.ok) {
      res.status(batchResponse.status).json(data);
      return;
    }

    res.status(202).json(data);
  } catch (error) {
    res.status(500).json({error: error instanceof Error ? error.message : 'Retry failed'});
  }
});

rendersRouter.delete('/:id', (req, res) => {
  const row = db.select().from(jobsTable).where(eq(jobsTable.id, req.params.id)).get();
  if (!row) {
    res.status(404).json({error: 'Render job not found'});
    return;
  }

  // Delete rendered files from disk
  const downloads = db.select().from(jobDownloadsTable)
    .where(eq(jobDownloadsTable.jobId, row.id))
    .all();

  for (const download of downloads) {
    const filePath = path.resolve(download.outputPath);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // non-fatal — file may already be gone
    }
  }

  // Delete from DB (cascade handles job_downloads)
  db.delete(jobsTable).where(eq(jobsTable.id, req.params.id)).run();

  res.status(204).end();
});
