import {useEffect, useMemo, useState} from 'react';
import {
  apiClient,
  type BlockSequence,
  type GenerateTemplateResponse,
  type OutputFormat,
  type RenderStatus,
  type RenderTemplatePayload,
  type TemplateDefinition,
  type UserTemplate,
} from '../api/client';
import BrandSettings from '../components/BrandSettings';
import FormatSelector from '../components/FormatSelector';
import RenderProgress from '../components/RenderProgress';
import TemplateForm from '../components/TemplateForm';
import VariantEditor from '../components/VariantEditor';
import ComposerWorkspace from '../components/composer/ComposerWorkspace';
import MobileActionBar from '../components/dashboard/MobileActionBar';
import RenderSummary from '../components/dashboard/RenderSummary';
import TemplateGallery from '../components/dashboard/TemplateGallery';
import AiPromptInput from '../components/dashboard/AiPromptInput';
import AiWizard from '../components/dashboard/AiWizard';
import SaveTemplateDialog from '../components/dashboard/SaveTemplateDialog';
import UserTemplateGallery from '../components/dashboard/UserTemplateGallery';
import CollapsibleSection from '../components/CollapsibleSection';
import PreviewPanel from '../components/PreviewPanel';
import SafePlayerPreview from '../components/preview/SafePlayerPreview';
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
import type {BlockTransitionConfig} from '@vary/shared/capabilities/types';

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
  const [aiMode, setAiMode] = useState<'quick' | 'wizard'>('wizard');
  const [lastAiGeneration, setLastAiGeneration] = useState<{
    spec: Record<string, unknown>;
    sourcePrompt: string;
    sourceMode: 'reused' | 'composed';
    baseTemplateId: string | null;
  } | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
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
  const [selectedStylePresetId, setSelectedStylePresetId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const {
    templates: capabilityTemplates,
    styles: capabilityStyles,
    animations: capabilityAnimations,
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
    setSelectedStylePresetId(null);
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
    setSelectedStylePresetId(null);
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

  const updateComposerTransition = (
    instanceId: string,
    transition: BlockTransitionConfig,
  ) => {
    setComposerBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.instanceId === instanceId ? {...block, transition} : block,
      ),
    );
  };

  const handleBlockLayoutChange = (
    blockInstanceId: string,
    fieldKey: string,
    layout: import('@vary/shared/capabilities/types').ElementLayout,
  ) => {
    setComposerBlocks((currentBlocks) =>
      currentBlocks.map((block) => {
        if (block.instanceId !== blockInstanceId) return block;
        return {
          ...block,
          layout: {
            ...block.layout,
            [fieldKey]: layout,
          },
        };
      }),
    );
  };

  const composerBlockSequence: BlockSequence = composerBlocks.map((block, index) => ({
    blockId: block.blockId,
    content: block.content,
    layout: block.layout,
    durationFrames: block.durationFrames,
    animation: block.animation,
    transition: index < composerBlocks.length - 1 ? block.transition : undefined,
    imageTreatment: block.imageTreatment,
  }));

  const audioFromTemplate = (template: RenderTemplatePayload) => {
    if (template.audio && typeof template.audio === 'object') return template.audio;
    return undefined;
  };

  const handleAiGenerated = (response: GenerateTemplateResponse, aiPrompt: string) => {
    const spec = response.spec as {
      blocks?: Array<{
        blockId: string;
        content?: Record<string, string>;
        durationFrames?: number;
        animation?: Record<string, unknown>;
        transition?: Record<string, unknown>;
      }>;
      brandSettings?: Record<string, unknown>;
      data?: Record<string, string>;
    };

    if (!spec.blocks || !Array.isArray(spec.blocks) || spec.blocks.length === 0) {
      console.log('[handleAiGenerated] no blocks, bailing');
      setError('AI generated a template with no blocks. Try a different prompt.');
      return;
    }

    console.log('[handleAiGenerated] got', spec.blocks.length, 'blocks:', spec.blocks.map(b => b.blockId));

    setMode('composer');

    const aiBlocks: ComposerBlock[] = spec.blocks.map((block) => ({
      instanceId: `${block.blockId}-ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      blockId: block.blockId,
      content: block.content ?? {},
      durationFrames: block.durationFrames,
      animation: block.animation as ComposerBlock['animation'],
      transition: block.transition as ComposerBlock['transition'],
    }));

    setComposerBlocks(aiBlocks);
    setSelectedBlockInstanceId(aiBlocks[0]?.instanceId ?? null);

    if (spec.brandSettings) {
      setTemplate((prev) => ({...prev, ...spec.brandSettings}));
    }

    if (spec.data && Object.keys(spec.data).length > 0) {
      // Merge AI data into existing variants — don't replace them entirely,
      // which would blank out variant editor fields and lose user data.
      setVariants((prev) => {
        if (prev.length === 0) return [{...spec.data}];
        return prev.map((v) => ({...spec.data, ...v}));
      });
    }

    // Store generation metadata for "Save as Template" feature
    setLastAiGeneration({
      spec: response.spec as Record<string, unknown>,
      sourcePrompt: aiPrompt,
      sourceMode: (response.selectionMode === 'existing-template' ? 'reused' : 'composed') as 'reused' | 'composed',
      baseTemplateId: response.reusedTemplateId ?? null,
    });

    setError(null);
  };

  const submitBatch = async () => {
    setError(null);
    setIsSubmitting(true);
    setRenderStatus(null);

    try {
      const sceneComposerTemplate = {
        blocks: composerBlockSequence,
        brandSettings: brandSettingsFromTemplate(template),
        audio: audioFromTemplate(template),
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

      {mode === 'composer' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div style={{display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3, alignSelf: 'flex-start'}}>
            <button
              type="button"
              onClick={() => setAiMode('wizard')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: aiMode === 'wizard' ? '#fff' : 'transparent',
                color: aiMode === 'wizard' ? '#111827' : '#6B7280',
                fontSize: 13,
                fontWeight: aiMode === 'wizard' ? 600 : 400,
                cursor: 'pointer',
                boxShadow: aiMode === 'wizard' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              ✨ Wizard
            </button>
            <button
              type="button"
              onClick={() => setAiMode('quick')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: aiMode === 'quick' ? '#fff' : 'transparent',
                color: aiMode === 'quick' ? '#111827' : '#6B7280',
                fontSize: 13,
                fontWeight: aiMode === 'quick' ? 600 : 400,
                cursor: 'pointer',
                boxShadow: aiMode === 'quick' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              💬 Quick Prompt
            </button>
          </div>

          {aiMode === 'wizard' ? (
            <AiWizard onGenerated={handleAiGenerated} disabled={isSubmitting} />
          ) : (
            <AiPromptInput onGenerated={handleAiGenerated} disabled={isSubmitting} />
          )}

          {/* Save as Template button — shown after AI generation */}
          {lastAiGeneration && (
            <div style={{display: 'flex', gap: 10, alignItems: 'center', marginTop: 12}}>
              <button
                type="button"
                onClick={() => setShowSaveDialog(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#10B981',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'background 0.15s',
                }}
              >
                💾 Save as Template
              </button>
              <span style={{fontSize: 13, color: '#6B7280'}}>
                {lastAiGeneration.sourceMode === 'reused'
                  ? `Based on "${lastAiGeneration.baseTemplateId}"`
                  : 'Custom composition — save it for reuse'}
              </span>
            </div>
          )}

          {savedMessage && (
            <div style={{
              padding: '8px 14px',
              borderRadius: 10,
              background: '#ECFDF5',
              color: '#065F46',
              fontSize: 13,
              border: '1px solid #A7F3D0',
              marginTop: 8,
            }}>
              ✅ {savedMessage}
            </div>
          )}
        </div>
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
            <TemplateGallery
              compositions={compositions}
              selectedCompositionId={selectedCompositionId}
              onSelect={selectTemplate}
            />
            <div style={{marginTop: 20}}>
              <CollapsibleSection title="My Templates" defaultOpen={false}>
                <UserTemplateGallery
                  selectedId={selectedCompositionId}
                  onSelect={(spec, templateId) => {
                    // Load user template into composer
                    setMode('composer');
                    setLastAiGeneration(null);

                    // Parse the spec and apply blocks
                    const parsed = spec as {
                      blocks?: Array<{
                        blockId: string;
                        content?: Record<string, string>;
                        durationFrames?: number;
                        animation?: Record<string, unknown>;
                        transition?: Record<string, unknown>;
                      }>;
                      brandSettings?: Record<string, unknown>;
                      data?: Record<string, string>;
                    };

                  if (parsed.blocks && Array.isArray(parsed.blocks)) {
                    const userBlocks: ComposerBlock[] = parsed.blocks.map((block) => ({
                      instanceId: `${block.blockId}-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      blockId: block.blockId,
                      content: block.content ?? {},
                      durationFrames: block.durationFrames,
                      animation: block.animation as ComposerBlock['animation'],
                      transition: block.transition as ComposerBlock['transition'],
                    }));
                    setComposerBlocks(userBlocks);
                    setSelectedBlockInstanceId(userBlocks[0]?.instanceId ?? null);
                  }

                  if (parsed.brandSettings) {
                    setTemplate((prev) => ({...prev, ...parsed.brandSettings}));
                  }

                  if (parsed.data && Object.keys(parsed.data).length > 0) {
                    setVariants((prev) => {
                      if (prev.length === 0) return [{...parsed.data}];
                      return prev.map((v) => ({...parsed.data, ...v}));
                    });
                  }

                  // Track use
                  apiClient.incrementTemplateUse(templateId).catch(() => {});
                }}
              />
              </CollapsibleSection>
            </div>
          </WorkflowSection>

          <WorkflowSection step="Step 2" title="Compose Scenes">
            <ComposerWorkspace
              blocks={composerBlocks}
              selectedBlockId={selectedBlockInstanceId}
              selectedTemplateId={selectedCompositionId}
              animations={capabilityAnimations}
              onSelectBlock={setSelectedBlockInstanceId}
              onRemoveBlock={removeComposerBlock}
              onMoveBlock={moveComposerBlock}
              onAddBlock={addComposerBlock}
              onUpdateBlock={updateComposerBlock}
              onUpdateTransition={updateComposerTransition}
            />
          </WorkflowSection>
        </>
      )}

      <WorkflowSection step="Step 2.5" title="Live Preview">
        <SafePlayerPreview
          blocks={composerBlocks}
          template={template}
          variant={variants[0] ?? {}}
          onVariantChange={(updated) => {
            setVariants((prev) => {
              if (prev.length === 0) return [updated];
              const next = [...prev];
              next[0] = updated;
              return next;
            });
          }}
          onBlockLayoutChange={handleBlockLayoutChange}
        />
      </WorkflowSection>

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
        <BrandSettings
          template={template}
          styles={capabilityStyles}
          selectedStylePresetId={selectedStylePresetId}
          onSelectStylePreset={setSelectedStylePresetId}
          onChange={setTemplate}
          enableAudio={mode === 'composer'}
        />
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

      {/* Save Template Dialog */}
      {showSaveDialog && lastAiGeneration && (
        <SaveTemplateDialog
          spec={lastAiGeneration.spec}
          sourcePrompt={lastAiGeneration.sourcePrompt}
          sourceMode={lastAiGeneration.sourceMode}
          baseTemplateId={lastAiGeneration.baseTemplateId}
          onSave={(template) => {
            setShowSaveDialog(false);
            setSavedMessage(`Template "${template.name}" saved! Find it in your template gallery.`);
            setTimeout(() => setSavedMessage(null), 5000);
          }}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}
    </section>
  );
}
