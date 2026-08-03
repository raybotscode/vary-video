import {useEffect, useMemo, useState} from 'react';
import {
  apiClient,
  type BlockSequence,
  type OutputFormat,
  type RenderStatus,
  type RenderTemplatePayload,
  type TemplateDefinition,
} from '../api/client';
import BrandSettings from '../components/BrandSettings';
import FormatSelector from '../components/FormatSelector';
import RenderProgress from '../components/RenderProgress';
import TemplateForm from '../components/TemplateForm';
import VariantEditor from '../components/VariantEditor';
import ComposerWorkspace from '../components/composer/ComposerWorkspace';
import MobileActionBar from '../components/dashboard/MobileActionBar';
import RenderSummary from '../components/dashboard/RenderSummary';
import TemplatePicker from '../components/dashboard/TemplatePicker';
import WorkflowSection from '../components/dashboard/WorkflowSection';
import {useCapabilities} from '../hooks/useCapabilities';
import LoadingState from '../components/ui/LoadingState';
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

  const {
    templates: capabilityTemplates,
    capabilityVersion,
    loading: isLoadingCompositions,
    error: capabilityError,
  } = useCapabilities();

  // Apply resolved capabilities to local state (v1 → legacy → local fallback
  // is handled inside useCapabilities). Runs once when loading completes.
  useEffect(() => {
    if (isLoadingCompositions || capabilityTemplates.length === 0) {
      return;
    }

    const nextTemplate = capabilityTemplates[0];
    setCompositions(capabilityTemplates);
    setSelectedCompositionId(nextTemplate.id);
    setTemplate(templateDefaults(nextTemplate));
    setVariants(defaultVariantsForTemplate(nextTemplate.id));
    const nextBlocks = composerBlocksForTemplate(nextTemplate.id);
    setComposerBlocks(nextBlocks);
    setSelectedBlockInstanceId(nextBlocks[0]?.instanceId ?? null);
  }, [isLoadingCompositions, capabilityTemplates]);

  useEffect(() => {
    if (capabilityError) {
      setError(capabilityError);
    }
  }, [capabilityError]);

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

  const isRenderDisabled =
    isSubmitting || variants.length === 0 || (mode === 'composer' && composerBlocks.length === 0);
  const estimatedMinutes = Math.ceil((estimatedRenderTime * formats.length) / 60);

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
          <WorkflowSection step="Step 1" title="Pick Base Template">
            <TemplatePicker
              compositions={compositions}
              selectedCompositionId={selectedCompositionId}
              onSelect={selectTemplate}
            />
          </WorkflowSection>

          <WorkflowSection step="Step 2" title="Compose Scenes">
            <ComposerWorkspace
              blocks={composerBlocks}
              selectedBlockId={selectedBlockInstanceId}
              selectedTemplateId={selectedCompositionId}
              onSelectBlock={setSelectedBlockInstanceId}
              onRemoveBlock={removeComposerBlock}
              onMoveBlock={moveComposerBlock}
              onAddBlock={addComposerBlock}
              onUpdateBlock={updateComposerBlock}
            />
          </WorkflowSection>
        </>
      )}

      <WorkflowSection
        step="Step 3"
        title="Add Variant Data"
        rightSlot={isLoadingCompositions ? <LoadingState label="Loading templates..." /> : undefined}
      >
        <VariantEditor
          variants={variants}
          columns={placeholders}
          templateId={selectedCompositionId}
          onChange={setVariants}
          onError={setError}
        />
      </WorkflowSection>

      <WorkflowSection step="Step 4" title="Brand Settings">
        <BrandSettings template={template} onChange={setTemplate} />
      </WorkflowSection>

      <WorkflowSection step="Step 5" title="Output Formats" hint="Choose which aspect ratios to render. Each format multiplies the render time.">
        <FormatSelector formats={formats} onChange={setFormats} />
      </WorkflowSection>

      <WorkflowSection step="Step 6" title="Generate">
        {error && <div className="inline-error generate-error">{error}</div>}
        <div className="render-summary-desktop">
          <RenderSummary
            templateLabel={selectedTemplate.name ?? selectedCompositionId}
            isComposer={mode === 'composer'}
            blockCount={composerBlocks.length}
            variantCount={variants.length}
            formats={formats}
            estimatedMinutes={estimatedMinutes}
            isSubmitting={isSubmitting}
            disabled={isRenderDisabled}
            onSubmit={submitBatch}
          />
        </div>
      </WorkflowSection>

      <RenderProgress
        status={renderStatus}
        jobId={jobId}
        variantCount={variants.length}
        estimatedTimeSeconds={estimatedTimeSeconds}
      />

      <MobileActionBar
        variantCount={variants.length}
        formatCount={formats.length}
        isSubmitting={isSubmitting}
        disabled={isRenderDisabled}
        onSubmit={submitBatch}
      />
    </section>
  );
}
