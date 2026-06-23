import {useEffect, useMemo, useState} from 'react';
import {apiClient, type Composition, type RenderStatus, type TemplatePayload} from '../api/client';
import BrandSettings from '../components/BrandSettings';
import RenderProgress from '../components/RenderProgress';
import TemplateForm from '../components/TemplateForm';
import VariantEditor from '../components/VariantEditor';
import {defaultVariants, type VariantData} from '../utils/placeholder';

const initialTemplate: TemplatePayload = {
  headlineTemplate: 'Are you a {{age}} year old {{gender}} in {{location}}?',
  subheadlineTemplate: 'Get covered today with {{company}}',
  ctaText: 'Get a Quote Today',
  brandColor: '#1A365D',
  secondaryColor: '#3182CE',
  logoUrl: '',
  backgroundType: 'gradient',
  backgroundColor: '#1A365D',
  backgroundImageUrl: '',
};

export default function Dashboard() {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [selectedCompositionId, setSelectedCompositionId] = useState('InsuranceAd');
  const [template, setTemplate] = useState<TemplatePayload>(initialTemplate);
  const [variants, setVariants] = useState<VariantData[]>(defaultVariants);
  const [isLoadingCompositions, setIsLoadingCompositions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimatedTimeSeconds, setEstimatedTimeSeconds] = useState<number | null>(null);
  const [renderStatus, setRenderStatus] = useState<RenderStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .getCompositions()
      .then((nextCompositions) => {
        if (!isMounted) {
          return;
        }

        setCompositions(nextCompositions);
        if (nextCompositions[0]) {
          setSelectedCompositionId(nextCompositions[0].id);
        }
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

  const previewVariant = variants[0] ?? defaultVariants[0];
  const estimatedRenderTime = useMemo(() => variants.length * 45, [variants.length]);

  const submitBatch = async () => {
    setError(null);
    setIsSubmitting(true);
    setRenderStatus(null);

    try {
      const response = await apiClient.startBatchRender({
        compositionId: selectedCompositionId,
        template,
        variants,
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

      {error && <div className="inline-error">{error}</div>}

      <TemplateForm
        compositions={compositions}
        selectedCompositionId={selectedCompositionId}
        onSelectComposition={setSelectedCompositionId}
        template={template}
        onTemplateChange={setTemplate}
        previewVariant={previewVariant}
      />

      <section className="step-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 3</p>
            <h2>Add Variant Data</h2>
          </div>
          {isLoadingCompositions && <span className="muted">Loading templates...</span>}
        </div>
        <VariantEditor variants={variants} onChange={setVariants} onError={setError} />
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
            <h2>Generate</h2>
          </div>
        </div>

        <div className="summary-grid">
          <div>
            <span>Template</span>
            <strong>{selectedCompositionId === 'InsuranceAd' ? 'Insurance Ad' : selectedCompositionId}</strong>
          </div>
          <div>
            <span>Variants</span>
            <strong>{variants.length}</strong>
          </div>
          <div>
            <span>Estimated render time</span>
            <strong>{Math.ceil(estimatedRenderTime / 60)} min</strong>
          </div>
        </div>

        <button
          className="primary-button generate-button"
          type="button"
          onClick={submitBatch}
          disabled={isSubmitting || variants.length === 0}
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
