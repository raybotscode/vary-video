import {describe, expect, it, beforeEach} from 'vitest';
import Database from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import {sqliteTable, text, integer, real} from 'drizzle-orm/sqlite-core';
import {eq, desc} from 'drizzle-orm';

// Inline test schema (mirrors production)
const aiGenerations = sqliteTable('ai_generations', {
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

const estimateCost = (model: string, inputTokens: number, outputTokens: number): number => {
  const pricing: Record<string, {input: number; output: number}> = {
    'meta-llama/llama-4-scout': {input: 0.15, output: 0.30},
    'openai/gpt-4o-mini': {input: 0.15, output: 0.60},
  };
  const p = pricing[model] ?? {input: 0.50, output: 1.00};
  const cost = (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
};

describe('AI Cost Tracker', () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(() => {
    const sqlite = new Database(':memory:');
    sqlite.exec(`
      CREATE TABLE ai_generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        estimated_cost_usd REAL NOT NULL,
        selection_mode TEXT NOT NULL CHECK(selection_mode IN ('existing-template', 'block-composition')),
        reused_template_id TEXT,
        prompt_length INTEGER NOT NULL,
        success INTEGER NOT NULL DEFAULT 1,
        error_message TEXT,
        user_id TEXT,
        created_at INTEGER NOT NULL
      )
    `);
    db = drizzle(sqlite);
  });

  it('inserts a generation record', () => {
    db.insert(aiGenerations).values({
      model: 'meta-llama/llama-4-scout',
      inputTokens: 500,
      outputTokens: 200,
      estimatedCostUsd: 0.000135,
      selectionMode: 'block-composition',
      promptLength: 100,
      success: true,
    }).run();

    const rows = db.select().from(aiGenerations).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].model).toBe('meta-llama/llama-4-scout');
    expect(rows[0].inputTokens).toBe(500);
    expect(rows[0].outputTokens).toBe(200);
    expect(rows[0].success).toBe(true);
  });

  it('records reused template id when present', () => {
    db.insert(aiGenerations).values({
      model: 'meta-llama/llama-4-scout',
      inputTokens: 300,
      outputTokens: 150,
      estimatedCostUsd: 0.00009,
      selectionMode: 'existing-template',
      reusedTemplateId: 'RealEstate',
      promptLength: 80,
      success: true,
    }).run();

    const rows = db.select().from(aiGenerations).all();
    expect(rows[0].reusedTemplateId).toBe('RealEstate');
    expect(rows[0].selectionMode).toBe('existing-template');
  });

  it('records failed generations', () => {
    db.insert(aiGenerations).values({
      model: 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      selectionMode: 'block-composition',
      promptLength: 50,
      success: false,
      errorMessage: 'API timeout',
    }).run();

    const rows = db.select().from(aiGenerations).all();
    expect(rows[0].success).toBe(false);
    expect(rows[0].errorMessage).toBe('API timeout');
  });
});

describe('estimateCost', () => {
  it('calculates llama 4 scout pricing correctly', () => {
    // $0.15/M input + $0.30/M output
    const cost = estimateCost('meta-llama/llama-4-scout', 1000, 500);
    expect(cost).toBe(0.0003); // 0.00015 + 0.00015
  });

  it('calculates gpt-4o-mini pricing correctly', () => {
    // $0.15/M input + $0.60/M output
    const cost = estimateCost('openai/gpt-4o-mini', 1000, 500);
    expect(cost).toBe(0.00045); // 0.00015 + 0.0003
  });

  it('uses default pricing for unknown models', () => {
    const cost = estimateCost('some-unknown-model', 1000, 500);
    expect(cost).toBe(0.001); // 0.0005 + 0.0005
  });

  it('returns 0 for zero tokens', () => {
    expect(estimateCost('meta-llama/llama-4-scout', 0, 0)).toBe(0);
  });
});
