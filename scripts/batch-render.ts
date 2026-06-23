#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {renderBatch, type BatchRenderRequest} from '../api/src/services/renderer';

const dataFileSchema = z.object({
  compositionId: z.literal('InsuranceAd').optional(),
  template: z.object({
    headlineTemplate: z.string(),
    subheadlineTemplate: z.string(),
    ctaText: z.string(),
    brandColor: z.string(),
    secondaryColor: z.string(),
    logoUrl: z.string().default(''),
    backgroundType: z.enum(['solid', 'gradient', 'image']),
    backgroundColor: z.string(),
    backgroundImageUrl: z.string().optional(),
  }),
  variants: z.array(z.record(z.string(), z.string())).min(1),
});

type CliOptions = {
  composition: 'InsuranceAd';
  data?: string;
  output: string;
  parallel: boolean;
};

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    composition: 'InsuranceAd',
    output: './public/renders',
    parallel: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];

    if (arg === '--composition' && value === 'InsuranceAd') {
      options.composition = value;
      index += 1;
    } else if (arg === '--data' && value) {
      options.data = value;
      index += 1;
    } else if (arg === '--output' && value) {
      options.output = value;
      index += 1;
    } else if (arg === '--parallel') {
      options.parallel = true;
    }
  }

  return options;
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));

  if (!options.data) {
    throw new Error('Missing --data <variants.json>');
  }

  const raw = await fs.readFile(options.data, 'utf8');
  const parsed = dataFileSchema.parse(JSON.parse(raw));
  const request: BatchRenderRequest = {
    compositionId: parsed.compositionId ?? options.composition,
    template: parsed.template,
    variants: parsed.variants,
  };

  const outputDir = path.resolve(options.output);
  const results = await renderBatch({
    request,
    outputDir,
    jobId: 'cli',
    parallel: options.parallel,
    onVariantProgress: (variantIndex, progress) => {
      const percent = Math.round(progress * 100);
      console.info(`variant ${variantIndex}: ${percent}%`);
    },
  });

  for (const result of results) {
    const target = path.join(outputDir, `variant-${result.index}.mp4`);
    await fs.rename(result.outputPath, target);
    console.info(`wrote ${target}`);
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown batch error';
  console.error(message);
  process.exitCode = 1;
});
