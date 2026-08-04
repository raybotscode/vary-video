import {Router} from 'express';
import {z} from 'zod';
import {eq, desc, and, sql} from 'drizzle-orm';
import {db} from '../../db/client.js';
import {userTemplates} from '../../db/schema.js';

export const userTemplatesRouter = Router();

// ─── Validation ─────────────────────────────────────────────────────

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  category: z.enum(['ad', 'social', 'property', 'product']).default('product'),
  spec: z.record(z.string(), z.unknown()),
  sourcePrompt: z.string().max(2000).default(''),
  sourceMode: z.enum(['reused', 'composed', 'manual']).default('manual'),
  baseTemplateId: z.string().nullable().default(null),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['ad', 'social', 'property', 'product']).optional(),
  spec: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────

const createId = () => `utpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const serializeRow = (row: ReturnType<typeof db.select> extends never ? never : never) => {
  // Type gymnastics — we just need to handle the raw row
  return {
    ...row,
    spec: JSON.parse((row as {spec: string}).spec),
    tags: JSON.parse((row as {tags: string}).tags ?? '[]'),
  };
};

// ─── Routes ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/user-templates — create a new user template
 */
userTemplatesRouter.post('/', (req, res) => {
  const parsed = createTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid template data',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const {spec, tags, ...fields} = parsed.data;
  const id = createId();
  const now = new Date();

  db.insert(userTemplates).values({
    id,
    ...fields,
    spec: JSON.stringify(spec),
    tags: JSON.stringify(tags),
    createdAt: now,
    updatedAt: now,
  }).run();

  const row = db.select().from(userTemplates).where(eq(userTemplates.id, id)).get();

  res.status(201).json({
    template: {
      ...row,
      spec: JSON.parse(row!.spec),
      tags: JSON.parse(row!.tags ?? '[]'),
    },
  });
});

/**
 * GET /api/v1/user-templates — list templates
 * Query params:
 *   scope=mine|public|all (default: all)
 *   category=ad|social|property|product
 *   limit=1-100 (default: 50)
 *   offset=0
 */
userTemplatesRouter.get('/', (req, res) => {
  const scope = (req.query.scope as string) ?? 'all';
  const category = req.query.category as string | undefined;
  const limit = Math.min(Number.parseInt(req.query.limit as string ?? '50', 10), 100);
  const offset = Number.parseInt(req.query.offset as string ?? '0', 10);

  const conditions = [];

  // For now (no auth), "mine" returns all, "public" returns public only
  if (scope === 'public') {
    conditions.push(eq(userTemplates.isPublic, true));
  }

  if (category && ['ad', 'social', 'property', 'product'].includes(category)) {
    conditions.push(eq(userTemplates.category, category as 'ad' | 'social' | 'property' | 'product'));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = db.select()
    .from(userTemplates)
    .where(whereClause)
    .orderBy(desc(userTemplates.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const [{total}] = db.select({total: sql<number>`count(*)`})
    .from(userTemplates)
    .where(whereClause)
    .all();

  const templates = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    spec: JSON.parse(row.spec),
    sourcePrompt: row.sourcePrompt,
    sourceMode: row.sourceMode,
    baseTemplateId: row.baseTemplateId,
    isPublic: Boolean(row.isPublic),
    useCount: row.useCount,
    tags: JSON.parse(row.tags ?? '[]'),
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  res.json({templates, total});
});

/**
 * GET /api/v1/user-templates/:id — get one template
 */
userTemplatesRouter.get('/:id', (req, res) => {
  const row = db.select().from(userTemplates).where(eq(userTemplates.id, req.params.id)).get();

  if (!row) {
    res.status(404).json({error: 'Template not found'});
    return;
  }

  res.json({
    template: {
      ...row,
      spec: JSON.parse(row.spec),
      tags: JSON.parse(row.tags ?? '[]'),
      isPublic: Boolean(row.isPublic),
    },
  });
});

/**
 * PUT /api/v1/user-templates/:id — update a template
 */
userTemplatesRouter.put('/:id', (req, res) => {
  const existing = db.select().from(userTemplates).where(eq(userTemplates.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({error: 'Template not found'});
    return;
  }

  const parsed = updateTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid update data',
      details: z.flattenError(parsed.error),
    });
    return;
  }

  const updates: Record<string, unknown> = {updatedAt: new Date()};
  const data = parsed.data;

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.category !== undefined) updates.category = data.category;
  if (data.spec !== undefined) updates.spec = JSON.stringify(data.spec);
  if (data.isPublic !== undefined) updates.isPublic = data.isPublic ? 1 : 0;
  if (data.tags !== undefined) updates.tags = JSON.stringify(data.tags);

  db.update(userTemplates).set(updates).where(eq(userTemplates.id, req.params.id)).run();

  const row = db.select().from(userTemplates).where(eq(userTemplates.id, req.params.id)).get();

  res.json({
    template: {
      ...row,
      spec: JSON.parse(row!.spec),
      tags: JSON.parse(row!.tags ?? '[]'),
      isPublic: Boolean(row!.isPublic),
    },
  });
});

/**
 * PATCH /api/v1/user-templates/:id/publish — toggle is_public
 */
userTemplatesRouter.patch('/:id/publish', (req, res) => {
  const existing = db.select().from(userTemplates).where(eq(userTemplates.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({error: 'Template not found'});
    return;
  }

  const newPublic = !existing.isPublic;
  db.update(userTemplates).set({
    isPublic: newPublic ? 1 : 0,
    updatedAt: new Date(),
  }).where(eq(userTemplates.id, req.params.id)).run();

  res.json({
    id: existing.id,
    isPublic: Boolean(newPublic),
    message: newPublic ? 'Template is now public' : 'Template is now private',
  });
});

/**
 * PATCH /api/v1/user-templates/:id/use — increment use_count
 */
userTemplatesRouter.patch('/:id/use', (req, res) => {
  const existing = db.select().from(userTemplates).where(eq(userTemplates.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({error: 'Template not found'});
    return;
  }

  db.update(userTemplates).set({
    useCount: existing.useCount + 1,
    updatedAt: new Date(),
  }).where(eq(userTemplates.id, req.params.id)).run();

  res.json({id: existing.id, useCount: existing.useCount + 1});
});

/**
 * DELETE /api/v1/user-templates/:id — delete a template
 */
userTemplatesRouter.delete('/:id', (req, res) => {
  const existing = db.select().from(userTemplates).where(eq(userTemplates.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({error: 'Template not found'});
    return;
  }

  db.delete(userTemplates).where(eq(userTemplates.id, req.params.id)).run();
  res.status(204).end();
});
