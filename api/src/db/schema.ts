import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  status: text('status', {enum: ['queued', 'rendering', 'completed', 'failed']}).notNull().default('queued'),
  progress: real('progress').notNull().default(0),
  completedVariants: integer('completed_variants').notNull().default(0),
  totalVariants: integer('total_variants').notNull().default(0),
  compositionId: text('composition_id').notNull(),
  /** Full template JSON (stringified) as submitted by the client */
  template: text('template').notNull(),
  /** Variant definitions array (stringified) */
  variants: text('variants').notNull(),
  /** Output format list: '["16:9","1:1"]' */
  formats: text('formats').notNull().default('["16:9"]'),
  /** Error message if status === 'failed' */
  error: text('error'),
  /** Forward-compat hook — nullable until auth is added */
  userId: text('user_id'),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', {mode: 'timestamp'}).notNull().$defaultFn(() => new Date()),
});

export const jobDownloads = sqliteTable('job_downloads', {
  id: integer('id').primaryKey({autoIncrement: true}),
  jobId: text('job_id').notNull().references(() => jobs.id, {onDelete: 'cascade'}),
  variantIndex: integer('variant_index').notNull(),
  format: text('format').notNull(),
  /** Server-relative path to the rendered file */
  outputPath: text('output_path').notNull(),
  /** URL path for the download endpoint */
  downloadUrl: text('download_url').notNull(),
});

export const aiGenerations = sqliteTable('ai_generations', {
  id: integer('id').primaryKey({autoIncrement: true}),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  estimatedCostUsd: real('estimated_cost_usd').notNull(),
  selectionMode: text('selection_mode', {enum: ['existing-template', 'block-composition']}).notNull(),
  reusedTemplateId: text('reused_template_id'),
  promptLength: integer('prompt_length').notNull(),
  success: integer('success', {mode: 'boolean'}).notNull().default(true),
  errorMessage: text('error_message'),
  userId: text('user_id'),
  createdAt: integer('created_at', {mode: 'timestamp'}).notNull().$defaultFn(() => new Date()),
});
