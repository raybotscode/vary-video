/**
 * AI cost tracking — logs each generation to SQLite and provides usage summaries.
 *
 * Pricing (approximate, as of 2026):
 * - Llama 4 Scout (meta-llama/llama-4-scout): ~$0.15/M input, ~$0.30/M output
 * - GPT-4o Mini (openai/gpt-4o-mini): ~$0.15/M input, ~$0.60/M output
 */

import {db} from '../db/client.js';
import {aiGenerations} from '../db/schema.js';
import {eq, sql, desc} from 'drizzle-orm';

/** Approximate pricing per 1M tokens (input, output) */
const MODEL_PRICING: Record<string, {input: number; output: number}> = {
  'meta-llama/llama-4-scout': {input: 0.15, output: 0.30},
  'openai/gpt-4o-mini': {input: 0.15, output: 0.60},
};

const DEFAULT_PRICING = {input: 0.50, output: 1.00};

const estimateCost = (
  model: string,
  inputTokens: number,
  outputTokens: number,
): number => {
  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // round to 6 decimals
};

export type LogGenerationParams = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  selectionMode: 'existing-template' | 'block-composition';
  reusedTemplateId?: string;
  promptLength: number;
  success: boolean;
  errorMessage?: string;
};

export const logGeneration = (params: LogGenerationParams): void => {
  const cost = estimateCost(params.model, params.inputTokens, params.outputTokens);

  db.insert(aiGenerations).values({
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    estimatedCostUsd: cost,
    selectionMode: params.selectionMode,
    reusedTemplateId: params.reusedTemplateId ?? null,
    promptLength: params.promptLength,
    success: params.success,
    errorMessage: params.errorMessage ?? null,
  }).run();
};

export type UsageSummary = {
  totalGenerations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  byModel: Array<{
    model: string;
    generations: number;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  }>;
  recentGenerations: Array<{
    id: number;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    selectionMode: string;
    reusedTemplateId: string | null;
    success: boolean;
    createdAt: Date;
  }>;
};

export const getUsageSummary = (): UsageSummary => {
  const all = db.select().from(aiGenerations).orderBy(desc(aiGenerations.createdAt)).all();

  const totalGenerations = all.length;
  const totalInputTokens = all.reduce((sum, g) => sum + g.inputTokens, 0);
  const totalOutputTokens = all.reduce((sum, g) => sum + g.outputTokens, 0);
  const totalCostUsd = all.reduce((sum, g) => sum + g.estimatedCostUsd, 0);

  // Group by model
  const byModelMap = new Map<string, {generations: number; inputTokens: number; outputTokens: number; costUsd: number}>();
  for (const g of all) {
    const existing = byModelMap.get(g.model) ?? {generations: 0, inputTokens: 0, outputTokens: 0, costUsd: 0};
    existing.generations += 1;
    existing.inputTokens += g.inputTokens;
    existing.outputTokens += g.outputTokens;
    existing.costUsd += g.estimatedCostUsd;
    byModelMap.set(g.model, existing);
  }

  const byModel = [...byModelMap.entries()].map(([model, stats]) => ({
    model,
    ...stats,
    costUsd: Math.round(stats.costUsd * 100) / 100,
  }));

  const recentGenerations = all.slice(0, 20).map((g) => ({
    id: g.id,
    model: g.model,
    inputTokens: g.inputTokens,
    outputTokens: g.outputTokens,
    costUsd: g.estimatedCostUsd,
    selectionMode: g.selectionMode,
    reusedTemplateId: g.reusedTemplateId,
    success: g.success,
    createdAt: g.createdAt,
  }));

  return {
    totalGenerations,
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd: Math.round(totalCostUsd * 100) / 100,
    byModel,
    recentGenerations,
  };
};
