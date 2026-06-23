import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {insuranceAdSchema, type InsuranceAdProps} from '../../../src/compositions';

export type RenderTemplate = Omit<InsuranceAdProps, 'data'>;
export type RenderVariant = Record<string, string>;

export type BatchRenderRequest = {
  compositionId: 'InsuranceAd';
  template: RenderTemplate;
  variants: RenderVariant[];
};

export type VariantRenderResult = {
  index: number;
  outputPath: string;
  downloadUrl: string;
};

type RenderVariantInput = {
  compositionId: string;
  inputProps: InsuranceAdProps;
  outputPath: string;
  onProgress?: (progress: number) => void;
};

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../../..');
const entryPoint = path.join(projectRoot, 'src/index.ts');

let bundlePromise: Promise<string> | null = null;

const getBundleUrl = async (): Promise<string> => {
  bundlePromise ??= bundle({
    entryPoint,
    publicDir: path.join(projectRoot, 'public'),
    onProgress: () => undefined,
  });

  return bundlePromise;
};

export const makeInputProps = (
  template: RenderTemplate,
  variant: RenderVariant,
): InsuranceAdProps => {
  return insuranceAdSchema.parse({
    ...template,
    data: variant,
  });
};

export const renderVariant = async ({
  compositionId,
  inputProps,
  outputPath,
  onProgress,
}: RenderVariantInput): Promise<void> => {
  const serveUrl = await getBundleUrl();
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps,
    logLevel: 'warn',
  });

  await fs.mkdir(path.dirname(outputPath), {recursive: true});

  await renderMedia({
    serveUrl,
    composition,
    codec: 'h264',
    crf: 18,
    inputProps,
    outputLocation: outputPath,
    overwrite: true,
    logLevel: 'warn',
    onProgress: ({progress}) => onProgress?.(progress),
  });
};

export const renderBatch = async ({
  request,
  outputDir,
  jobId,
  parallel,
  onVariantProgress,
}: {
  request: BatchRenderRequest;
  outputDir: string;
  jobId: string;
  parallel: boolean;
  onVariantProgress?: (variantIndex: number, progress: number) => void;
}): Promise<VariantRenderResult[]> => {
  await fs.mkdir(outputDir, {recursive: true});

  const renderOne = async (
    variant: RenderVariant,
    index: number,
  ): Promise<VariantRenderResult> => {
    const outputPath = path.join(outputDir, `${jobId}-variant-${index}.mp4`);
    const inputProps = makeInputProps(request.template, variant);

    await renderVariant({
      compositionId: request.compositionId,
      inputProps,
      outputPath,
      onProgress: (progress) => onVariantProgress?.(index, progress),
    });

    return {
      index,
      outputPath,
      downloadUrl: `/api/render/download/${jobId}/${index}`,
    };
  };

  if (parallel) {
    return Promise.all(request.variants.map(renderOne));
  }

  const results: VariantRenderResult[] = [];
  for (let index = 0; index < request.variants.length; index += 1) {
    results.push(await renderOne(request.variants[index], index));
  }

  return results;
};

export const publicRenderDir = path.join(projectRoot, 'public/renders');
