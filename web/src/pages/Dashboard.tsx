import {useEffect, useMemo, useState} from 'react';
import {
  apiClient,
  type BlockSequence,
  type OutputFormat,
  type RenderStatus,
  type RenderTemplatePayload,
  type TemplateDefinition,
} from '../api/client';
import BlockEditor from '../components/BlockEditor';
import BlockPalette from '../components/BlockPalette';
import BrandSettings from '../components/BrandSettings';
import FormatSelector from '../components/FormatSelector';
import RenderProgress from '../components/RenderProgress';
import SceneTimeline from '../components/SceneTimeline';
import TemplateForm from '../components/TemplateForm';
import VariantEditor from '../components/VariantEditor';
import {defaultVariantsForTemplate, type VariantData} from '../utils/placeholder';
import {
  createComposerBlock,
  getBlockDefinition,
  getDefaultBlockSequence,
  type ComposerBlock,
} from '../utils/blocks';
import {frontendTemplates, getFrontendTemplate, templateIconFor} from '../utils/templates';

const templateDefaults = (template: TemplateDefinition): RenderTemplatePayload => {
  const defaults = template.defaults ?? template.defaultProps ?? {};
  const {data: _data, ...withoutData} = defaults;
  return withoutData;
};

type DashboardMode = 'quick' | 'composer';

type DashboardProps = {
  initialMode?: DashboardMode;
};

const composerBlocksForTemplate = (templateId: string): ComposerBlock[] =>
  getDefaultBlockSequence(templateId).map(createComposerBlock);

const initialComposerBlocks = composerBlocksForTemplate(frontendTemplates[0].id);

const brandSettingsFromTemplate = (template: RenderTemplatePayload) => ({
  brandColor: typeof template.brandColor === 'string' ? template.brandColor : '#1A365D',
  secondaryColor:
    typeof template.secondaryColor === 'string' ? template.secondaryColor : '#3182CE',
  accentColor: typeof template.accentColor === 'string' ? template.accentColor : '#FF6B5B',
  logoUrl: typeof template.logoUrl === 'string' ? template.logoUrl : '',
  backgroundType:
    template.backgroundType === 'solid' ||
    template.backgroundType === 'gradient' ||
    template.backgroundType === 'image'
      ? template.backgroundType
      : 'gradient',
  backgroundColor:
    typeof template.backgroundColor === 'string' ? template.backgroundColor : '#F7FAFC',
  backgroundImageUrl:
    typeof template.backgroundImageUrl === 'string' ? template.backgroundImageUrl : '',
});

export default function Dashboard({initialMode = 'quick'}: DashboardProps) {
  const [mode, setMode] = useState<DashboardMode>(initialMode);
  const [compositions, setCompositions] = useState<TemplateDefinition[]>(frontendTemplates);
  const [selectedCompositionId, setSelectedCompositionId] = useState(frontendTemplates[0].id);
  const [template, setTemplate] = useState<RenderTemplatePayload>(
    templateDefaults(frontendTemplates[0]),
  );
  const [variants, setVariants] = useState<VariantData[]>(
    defaultVariantsForTemplate(frontendTemplates[0].id),
  );
  const [isLoadingCompositions, setIsLoadingCompositions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimatedTimeSeconds, setEstimatedTimeSeconds] = useState<number | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderStatus | null>(null);
  const [formats, setFormats] = useState<OutputFormat[]>(['16:9']);
  const [composerBlocks, setComposerBlocks] = useState<ComposerBlock[]>(
    initialComposerBlocks,
  );
  const [selectedBlockInstanceId, setSelectedBlockInstanceId] = useState<string | null>(
    initialComposerBlocks[0]?.instanceId ?? null,
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .getCompositions()
      .then((nextCompositions) => {
        if (!isMounted || !nextCompositions?.length) {
          return;
        }

        const merged = nextCompositions.map((composition) => ({
          ...getFrontendTemplate(composition.id),
          ...composition,
          defaults:
            composition.defaults ??
            composition.defaultProps ??
            getFrontendTemplate(composition.id).defaults,
          copyFields:
            composition.copyFields ?? getFrontendTemplate(composition.id).copyFields,
          placeholders:
            composition.placeholders ?? getFrontendTemplate(composition.id).placeholders,
          blockSequence:
            composition.blockSequence ?? getFrontendTemplate(composition.id).blockSequence,
        }));

        setCompositions(merged);
        const nextTemplate = merged[0];
        setSelectedCompositionId(nextTemplate.id);
        setTemplate(templateDefaults(nextTemplate));
        setVariants(defaultVariantsForTemplate(nextTemplate.id));
        const nextBlocks = composerBlocksForTemplate(nextTemplate.id);
        setComposerBlocks(nextBlocks);
        setSelectedBlockInstanceId(nextBlocks[0]?.instanceId ?? null);
      })
      .catch((apiError: unknown) => {
        if (isMounted) {
          setError(
            apiError instanceof Error
              ? `Could not load API templates: ${apiError.message}`
              : 'Could not load API templates. You can still draft a batch locally.',
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCompositions(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    const interval = window.setInterval(() => {
      apiClient
        .getRenderStatus(jobId)
        .then((status) => {
          setRenderStatus(status);
          if (status.status === 'completed' || status.status === 'failed') {
            window.clearInterval(interval);
          }
        })
        .catch((apiError: unknown) => {
          setError(apiError instanceof Error ? apiError.message : 'Could not update render status.');
        });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [jobId]);

  const selectedTemplate =
    compositions.find((composition) => composition.id === selectedCompositionId) ??
    getFrontendTemplate(selectedCompositionId);
  const placeholders = selectedTemplate.placeholders ?? [];
  const previewVariant =
    variants[0] ?? defaultVariantsForTemplate(selectedCompositionId)[0] ?? {};
  const estimatedRenderTime = useMemo(() => variants.length * 45, [variants.length]);
  const selectedComposerBlock =
    composerBlocks.find((block) => block.instanceId === selectedBlockInstanceId) ?? null;

  const selectTemplate = (templateId: string) => {
    const nextTemplate =
      compositions.find((composition) => composition.id === templateId) ??
      getFrontendTemplate(templateId);
    setSelectedCompositionId(templateId);
    setTemplate(templateDefaults(nextTemplate));
    setVariants(defaultVariantsForTemplate(templateId));
    const nextBlocks = composerBlocksForTemplate(templateId);
    setComposerBlocks(nextBlocks);
    setSelectedBlockInstanceId(nextBlocks[0]?.instanceId ?? null);
    setJobId(null);
    setRenderStatus(null);
  };

  const addComposerBlock = (blockId: string) => {
    const nextBlock = createComposerBlock(blockId);
    setComposerBlocks((currentBlocks) => [...currentBlocks, nextBlock]);
    setSelectedBlockInstanceId(nextBlock.instanceId);
    setIsPaletteOpen(false);
  };

  const removeComposerBlock = (instanceId: string) => {
    setComposerBlocks((currentBlocks) => {
      const nextBlocks = currentBlocks.filter((block) => block.instanceId !== instanceId);
      if (selectedBlockInstanceId === instanceId) {
        setSelectedBlockInstanceId(nextBlocks[0]?.instanceId ?? null);
      }

      return nextBlocks;
    });
  };

  const moveComposerBlock = (instanceId: string, direction: 'up' | 'down') => {
    setComposerBlocks((currentBlocks) => {
      const index = currentBlocks.findIndex((block) => block.instanceId === instanceId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= currentBlocks.length) {
        return currentBlocks;
      }

      const nextBlocks = [...currentBlocks];
      const [moved] = nextBlocks.splice(index, 1);
      nextBlocks.splice(targetIndex, 0, moved);
      return nextBlocks;
    });
  };

  const updateComposerBlock = (nextBlock: ComposerBlock) => {
    setComposerBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.instanceId === nextBlock.instanceId ? nextBlock : block,
      ),
    );
  };

  const composerBlockSequence: BlockSequence = composerBlocks.map((block) => ({
    blockId: block.blockId,
    content: block.content,
    durationFrames: block.durationFrames,
  }));

  const submitBatch = async () => {
    setError(null);
    setIsSubmitting(true);
    setRenderStatus(null);

    try {
      const sceneComposerTemplate = {
        blocks: composerBlockSequence,
        brandSettings: brandSettingsFromTemplate(template),
        fps: selectedTemplate.fps,
        width: selectedTemplate.width,
        height: selectedTemplate.height,
      };
      const response = await apiClient.startBatchRender({
        compositionId: mode === 'composer' ? 'SceneBlockPlayer' : selectedCompositionId,
        template: mode === 'composer' ? sceneComposerTemplate : template,
        blockSequence: mode === 'composer' ? composerBlockSequence : undefined,
        variants,
        formats,
      });

      setJobId(response.jobId);
      setEstimatedTimeSeconds(response.estimatedTimeSeconds);
      setRenderStatus({
        id: response.jobId,
        status: 'queued',
        progress: 0,
        completedVariants: 0,
        totalVariants: variants.length,
        downloads: [],
      });
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Could not start render batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section dashboard-page">
      <div className="page-title">
        <p className="eyebrow">Workspace</p>
        <h1>Build a Video Variant Batch</h1>
        <p>Create copy, variant data, and brand settings before sending the batch to render.</p>
      </div>

      <div className="mode-toggle" aria-label="Dashboard mode">
        <button
          type="button"
          className={mode === 'quick' ? 'mode-button active' : 'mode-button'}
          onClick={() => setMode('quick')}
        >
          Quick Template
        </button>
        <button
          type="button"
          className={mode === 'composer' ? 'mode-button active' : 'mode-button'}
          onClick={() => setMode('composer')}
        >
          Scene Composer
        </button>
      </div>
      {mode === 'composer' && (
        <p className="mode-description">Build a custom scene-by-scene sequence by picking, reordering, and editing individual video blocks.</p>
      )}

      {error && <div className="inline-error">{error}</div>}

      {mode === 'quick' ? (
        <TemplateForm
          compositions={compositions}
          selectedCompositionId={selectedCompositionId}
          onSelectComposition={selectTemplate}
          template={template}
          selectedTemplate={selectedTemplate}
          onTemplateChange={setTemplate}
          previewVariant={previewVariant}
        />
      ) : (
        <>
          <section className="step-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 1</p>
                <h2>Pick Base Template</h2>
              </div>
            </div>

            <div className="template-grid">
              {compositions.map((composition) => (
                <button
                  key={composition.id}
                  type="button"
                  className={
                    selectedCompositionId === composition.id
                      ? 'template-card selected'
                      : 'template-card'
                  }
                  onClick={() => selectTemplate(composition.id)}
                >
                  <span className={`template-thumbnail ${composition.category ?? 'ad'}`}>
                    <span>{templateIconFor(composition.id)}</span>
                  </span>
                  <strong>{composition.name ?? composition.id}</strong>
                  <p>
                    {composition.description ??
                      'Dynamic video template for personalized variants.'}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="step-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 2</p>
                <h2>Compose Scenes</h2>
              </div>
            </div>

            <div className="composer-layout">
              <div className="composer-main">
                <SceneTimeline
                  blocks={composerBlocks}
                  selectedBlockId={selectedBlockInstanceId}
                  onSelectBlock={setSelectedBlockInstanceId}
                  onRemoveBlock={removeComposerBlock}
                  onMoveBlock={moveComposerBlock}
                  onOpenPalette={() => setIsPaletteOpen(true)}
                />

                {isPaletteOpen && (
                  <div className="palette-panel">
                    <div className="timeline-header">
                      <div>
                        <h3>Block Library</h3>
                        <p>Choose a block to append to the sequence.</p>
                      </div>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => setIsPaletteOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                    <BlockPalette
                      templateId={selectedCompositionId}
                      onAddBlock={addComposerBlock}
                    />
                  </div>
                )}
              </div>

              <BlockEditor
                block={selectedComposerBlock}
                onChange={updateComposerBlock}
              />
            </div>
          </section>
        </>
      )}

      <section className="step-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 3</p>
            <h2>Add Variant Data</h2>
          </div>
          {isLoadingCompositions && <span className="muted">Loading templates...</span>}
        </div>
        <VariantEditor
          variants={variants}
          columns={placeholders}
          templateId={selectedCompositionId}
          onChange={setVariants}
          onError={setError}
        />
      </section>

      <section className="step-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 4</p>
            <h2>Brand Settings</h2>
          </div>
        </div>
        <BrandSettings template={template} onChange={setTemplate} />
      </section>

      <section className="step-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 5</p>
            <h2>Output Formats</h2>
          </div>
        </div>
        <p className="format-hint">Choose which aspect ratios to render. Each format multiplies the render time.</p>
        <FormatSelector formats={formats} onChange={setFormats} />
      </section>

      <section className="step-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 6</p>
            <h2>Generate</h2>
          </div>
        </div>

        <div className="summary-grid">
          <div>
            <span>{mode === 'composer' ? 'Composition' : 'Template'}</span>
            <strong>
              {mode === 'composer'
                ? 'Scene Composer'
                : selectedTemplate.name ?? selectedCompositionId}
            </strong>
          </div>
          {mode === 'composer' && (
            <div>
              <span>Blocks</span>
              <strong>{composerBlocks.length}</strong>
            </div>
          )}
          <div>
            <span>Variants</span>
            <strong>{variants.length}</strong>
          </div>
          <div>
            <span>Formats</span>
            <strong>{formats.join(', ')}</strong>
          </div>
          <div>
            <span>Total outputs</span>
            <strong>{variants.length * formats.length}</strong>
          </div>
          <div>
            <span>Estimated render time</span>
            <strong>{Math.ceil((estimatedRenderTime * formats.length) / 60)} min</strong>
          </div>
        </div>

        <button
          className="primary-button generate-button"
          type="button"
          onClick={submitBatch}
          disabled={isSubmitting || variants.length === 0 || (mode === 'composer' && composerBlocks.length === 0)}
        >
          {isSubmitting ? 'Starting Render...' : 'Generate All Variants'}
        </button>
      </section>

      <RenderProgress
        status={renderStatus}
        jobId={jobId}
        variantCount={variants.length}
        estimatedTimeSeconds={estimatedTimeSeconds}
      />
    </section>
  );
}
