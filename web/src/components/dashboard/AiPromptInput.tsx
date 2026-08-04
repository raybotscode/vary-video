import {useState} from 'react';
import {apiClient, type GenerateTemplateResponse} from '../../api/client';

type AiPromptInputProps = {
  onGenerated: (response: GenerateTemplateResponse) => void;
  disabled?: boolean;
};

export default function AiPromptInput({onGenerated, disabled}: AiPromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.generateTemplate(prompt.trim());
      onGenerated(response);

      if (response.selectionMode === 'existing-template' && response.reusedTemplateId) {
        setSuccess(`Using "${response.reusedTemplateId}" template — customized for your request.`);
      } else {
        setSuccess('Custom scene built from scratch.');
      }

      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="ai-prompt-input">
      <div className="ai-prompt-header">
        <p className="eyebrow">AI Generator</p>
        <h3>Describe your video</h3>
        <p className="ai-prompt-hint">
          Tell us what you want and AI will build the scene structure for you.
        </p>
      </div>

      <div className="ai-prompt-field">
        <textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setSuccess(null); }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Make a 4-scene real estate video for a 3-bed house in Dublin, price €450K"
          rows={3}
          maxLength={2000}
          disabled={isGenerating || disabled}
          aria-label="AI template prompt"
        />
        <div className="ai-prompt-actions">
          <span className="ai-prompt-charcount">
            {prompt.length}/2000
          </span>
          <button
            type="button"
            className="ai-generate-btn"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || disabled}
          >
            {isGenerating ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Generating…
              </>
            ) : (
              '✨ Generate Template'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="ai-prompt-error inline-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="ai-prompt-success" role="status" style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: '#ECFDF5',
          color: '#065F46',
          fontSize: 13,
          border: '1px solid #A7F3D0',
        }}>
          {success}
        </div>
      )}

      <p className="ai-prompt-shortcut">
        <kbd>⌘</kbd>+<kbd>Enter</kbd> to generate
      </p>
    </div>
  );
}
