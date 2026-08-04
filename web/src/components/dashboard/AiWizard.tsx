import {useMemo, useState} from 'react';
import {apiClient, type GenerateTemplateResponse} from '../../api/client';
import {frontendTemplates} from '../../utils/templates';

type AiWizardProps = {
  onGenerated: (response: GenerateTemplateResponse, prompt: string) => void;
  disabled?: boolean;
};

type WizardStep = 'type' | 'details' | 'style' | 'generate';

const STEPS: {id: WizardStep; label: string}[] = [
  {id: 'type', label: 'Video Type'},
  {id: 'details', label: 'Details'},
  {id: 'style', label: 'Style'},
  {id: 'generate', label: 'Generate'},
];

const MOOD_OPTIONS = [
  {value: 'professional', label: 'Professional', color: '#1A365D'},
  {value: 'bold', label: 'Bold & Energetic', color: '#DC2626'},
  {value: 'elegant', label: 'Elegant & Clean', color: '#6D28D9'},
  {value: 'friendly', label: 'Friendly & Warm', color: '#F59E0B'},
  {value: 'modern', label: 'Modern & Tech', color: '#3B82F6'},
];

export default function AiWizard({onGenerated, disabled}: AiWizardProps) {
  const [step, setStep] = useState<WizardStep>('type');
  const [selectedType, setSelectedType] = useState<string>('');
  const [details, setDetails] = useState<Record<string, string>>({});
  const [mood, setMood] = useState('professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const selectedTemplate = useMemo(
    () => frontendTemplates.find((t) => t.id === selectedType),
    [selectedType],
  );

  const detailFields = useMemo(() => {
    if (!selectedTemplate) return [];
    return selectedTemplate.copyFields.filter((f) => !f.id.startsWith('cta'));
  }, [selectedTemplate]);

  const canAdvance = () => {
    switch (step) {
      case 'type': return !!selectedType;
      case 'details': return detailFields.length === 0 || Object.values(details).some((v) => v.trim());
      case 'style': return true;
      case 'generate': return true;
    }
  };

  const buildPrompt = (): string => {
    const parts: string[] = [];

    if (selectedTemplate) {
      parts.push(`Create a ${selectedTemplate.name} video`);
      parts.push(`Use case: ${selectedTemplate.useCase}`);
    }

    for (const [key, value] of Object.entries(details)) {
      if (value.trim()) {
        const field = detailFields.find((f) => f.id === key);
        parts.push(`${field?.label ?? key}: ${value}`);
      }
    }

    const moodOption = MOOD_OPTIONS.find((m) => m.value === mood);
    if (moodOption) {
      parts.push(`Style: ${moodOption.label}`);
      parts.push(`Brand color: ${moodOption.color}`);
    }

    if (customPrompt.trim()) {
      parts.push(customPrompt.trim());
    }

    return parts.join('. ') + '.';
  };

  const handleGenerate = async () => {
    const prompt = buildPrompt();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.generateTemplate(prompt);
      onGenerated(response, prompt);

      if (response.selectionMode === 'existing-template' && response.reusedTemplateId) {
        setSuccess(`Using "${response.reusedTemplateId}" template — customized for your request.`);
      } else {
        setSuccess('Custom scene built from scratch.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const next = () => {
    const nextIndex = Math.min(stepIndex + 1, STEPS.length - 1);
    setStep(STEPS[nextIndex].id);
  };

  const back = () => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    setStep(STEPS[prevIndex].id);
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      {/* Step indicator */}
      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: i <= stepIndex ? '#3B82F6' : '#E5E7EB',
                color: i <= stepIndex ? '#fff' : '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
            >
              {i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: i === stepIndex ? 600 : 400,
                color: i === stepIndex ? '#111827' : '#9CA3AF',
              }}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{width: 24, height: 1, background: i < stepIndex ? '#3B82F6' : '#E5E7EB'}} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Video Type */}
      {step === 'type' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <h4 style={{margin: 0, fontSize: 15, color: '#111827'}}>What type of video?</h4>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8}}>
            {frontendTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: selectedType === t.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  background: selectedType === t.id ? '#EFF6FF' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <strong style={{fontSize: 13, color: '#111827'}}>{t.name}</strong>
                <p style={{fontSize: 11, color: '#6B7280', margin: '4px 0 0', lineHeight: 1.3}}>
                  {t.useCase}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <h4 style={{margin: 0, fontSize: 15, color: '#111827'}}>
            Tell us about your {selectedTemplate?.name ?? 'video'}
          </h4>
          {detailFields.map((field) => (
            <div key={field.id} style={{display: 'flex', flexDirection: 'column', gap: 4}}>
              <label style={{fontSize: 12, fontWeight: 600, color: '#374151'}}>{field.label}</label>
              <input
                type="text"
                value={details[field.id] ?? ''}
                onChange={(e) => setDetails((prev) => ({...prev, [field.id]: e.target.value}))}
                placeholder={field.default.replace(/\{\{[^}]+\}\}/g, '...')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  fontSize: 14,
                  background: '#F9FAFB',
                }}
              />
            </div>
          ))}
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <label style={{fontSize: 12, fontWeight: 600, color: '#374151'}}>Additional instructions</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Anything else you'd like to add..."
              rows={2}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                fontSize: 14,
                background: '#F9FAFB',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      )}

      {/* Step 3: Style */}
      {step === 'style' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <h4 style={{margin: 0, fontSize: 15, color: '#111827'}}>Choose a style</h4>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8}}>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: mood === m.value ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  background: mood === m.value ? '#EFF6FF' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: m.color,
                    margin: '0 auto 8px',
                  }}
                />
                <span style={{fontSize: 12, fontWeight: 600, color: '#111827'}}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Generate */}
      {step === 'generate' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <h4 style={{margin: 0, fontSize: 15, color: '#111827'}}>Ready to generate</h4>
          <div style={{
            padding: 16,
            borderRadius: 8,
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            fontSize: 13,
            color: '#374151',
            lineHeight: 1.6,
          }}>
            <strong>Preview:</strong> {buildPrompt()}
          </div>
        </div>
      )}

      {/* Error/success */}
      {error && (
        <div style={{padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', color: '#991B1B', fontSize: 13, border: '1px solid #FECACA'}}>
          {error}
        </div>
      )}
      {success && (
        <div style={{padding: '8px 12px', borderRadius: 8, background: '#ECFDF5', color: '#065F46', fontSize: 13, border: '1px solid #A7F3D0'}}>
          {success}
        </div>
      )}

      {/* Navigation */}
      <div style={{display: 'flex', gap: 8, justifyContent: 'space-between'}}>
        <button
          type="button"
          onClick={back}
          disabled={stepIndex === 0}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            background: '#fff',
            cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: stepIndex === 0 ? 0.5 : 1,
            fontSize: 13,
          }}
        >
          Back
        </button>

        <div style={{display: 'flex', gap: 8}}>
          {step !== 'generate' ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: canAdvance() ? '#3B82F6' : '#E5E7EB',
                color: canAdvance() ? '#fff' : '#9CA3AF',
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || disabled}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: isGenerating ? '#E5E7EB' : '#3B82F6',
                color: isGenerating ? '#9CA3AF' : '#fff',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {isGenerating ? 'Generating…' : '✨ Generate Template'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
