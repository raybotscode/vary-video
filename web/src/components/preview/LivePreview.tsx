/**
 * LivePreview — real-time HTML/CSS preview of video scenes.
 *
 * Renders blocks with CSS animations, allows inline text editing,
 * and syncs changes back to variant data. No server round-trips.
 *
 * Architecture:
 * - Block renderer maps blockId → styled HTML with CSS animations
 * - Text fields are contentEditable, changes propagate to parent
 * - Variant data from row 0 (or CSV) provides initial values
 * - BrandSettings drive colors, backgrounds, gradients
 * - Timeline controls: play/pause/restart
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import type {ComposerBlock} from '../../utils/blocks';
import type {RenderTemplatePayload} from '../../api/client';
import type {VariantData} from '../../utils/placeholder';

type LivePreviewProps = {
  blocks: ComposerBlock[];
  template: RenderTemplatePayload;
  variant: VariantData;
  onVariantChange?: (updated: VariantData) => void;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
};

// ─── Animation presets (CSS keyframes) ─────────────────────────────

const ANIMATION_STYLES = `
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slide-in-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-in-down {
  from { opacity: 0; transform: translateY(-40px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-60px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(60px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes typewriter-cursor {
  0%, 100% { border-right-color: currentColor; }
  50% { border-right-color: transparent; }
}
@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes slide-out-up {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-40px); }
}
@keyframes slide-out-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(40px); }
}
@keyframes scale-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}
`;

const ANIMATION_MAP: Record<string, string> = {
  'fade-in': 'fade-in',
  'slide-in-up': 'slide-in-up',
  'slide-in-down': 'slide-in-down',
  'slide-in-left': 'slide-in-left',
  'slide-in-right': 'slide-in-right',
  'scale-in': 'scale-in',
  'pop-in': 'scale-in',
  'fade-out': 'fade-out',
  'slide-out-up': 'slide-out-up',
  'slide-out-down': 'slide-out-down',
  'scale-out': 'scale-out',
};

// ─── Placeholder resolution ────────────────────────────────────────

function resolvePlaceholders(text: string, data: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

// ─── Brand settings extraction ─────────────────────────────────────

type BrandSettings = {
  brandColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundType: string;
  backgroundColor: string;
  backgroundImageUrl?: string;
};

function extractBrand(template: RenderTemplatePayload): BrandSettings {
  return {
    brandColor: (template.brandColor as string) || '#1A365D',
    secondaryColor: (template.secondaryColor as string) || '#3182CE',
    accentColor: (template.accentColor as string) || '#FF6B5B',
    backgroundType: (template.backgroundType as string) || 'gradient',
    backgroundColor: (template.backgroundColor as string) || '#F7FAFC',
    backgroundImageUrl: template.backgroundImageUrl as string | undefined,
  };
}

function backgroundStyle(brand: BrandSettings): React.CSSProperties {
  if (brand.backgroundType === 'solid') {
    return {background: brand.backgroundColor};
  }
  if (brand.backgroundType === 'image' && brand.backgroundImageUrl) {
    return {
      backgroundImage: `url(${brand.backgroundImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  // Default: gradient
  return {
    background: `linear-gradient(135deg, ${brand.brandColor} 0%, ${brand.secondaryColor} 100%)`,
  };
}

// ─── Inline editable text ──────────────────────────────────────────

type EditableTextProps = {
  value: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
};

function EditableText({value, onChange, style, className, tag = 'p'}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);

  const handleBlur = () => {
    if (ref.current && onChange) {
      const newText = ref.current.textContent ?? '';
      if (newText !== value) {
        onChange(newText);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  // Use React.createElement to avoid JSX tag interpolation
  return {
    h1: () => (
      <h1
        ref={ref as React.RefObject<HTMLHeadingElement>}
        contentEditable={!!onChange}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{...style, outline: 'none', cursor: onChange ? 'text' : 'default'}}
        className={className}
      >
        {value}
      </h1>
    ),
    h2: () => (
      <h2
        ref={ref as React.RefObject<HTMLHeadingElement>}
        contentEditable={!!onChange}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{...style, outline: 'none', cursor: onChange ? 'text' : 'default'}}
        className={className}
      >
        {value}
      </h2>
    ),
    h3: () => (
      <h3
        ref={ref as React.RefObject<HTMLHeadingElement>}
        contentEditable={!!onChange}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{...style, outline: 'none', cursor: onChange ? 'text' : 'default'}}
        className={className}
      >
        {value}
      </h3>
    ),
    span: () => (
      <span
        ref={ref as React.RefObject<HTMLSpanElement>}
        contentEditable={!!onChange}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{...style, outline: 'none', cursor: onChange ? 'text' : 'default'}}
        className={className}
      >
        {value}
      </span>
    ),
    p: () => (
      <p
        ref={ref as React.RefObject<HTMLParagraphElement>}
        contentEditable={!!onChange}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{...style, outline: 'none', cursor: onChange ? 'text' : 'default'}}
        className={className}
      >
        {value}
      </p>
    ),
  }[tag]();
}

// ─── Block renderer ────────────────────────────────────────────────

type BlockRendererProps = {
  block: ComposerBlock;
  brand: BrandSettings;
  resolvedContent: Record<string, string>;
  onContentChange?: (key: string, value: string) => void;
  animationClass: string;
  isActive: boolean;
};

function BlockRenderer({
  block,
  brand,
  resolvedContent,
  onContentChange,
  animationClass,
  isActive,
}: BlockRendererProps) {
  const getText = (key: string) => resolvedContent[key] ?? block.content[key] ?? '';

  // Common text style
  const headingStyle: React.CSSProperties = {
    color: '#FFFFFF',
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.2,
  };
  const bodyStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: 400,
    margin: 0,
    lineHeight: 1.5,
  };
  const ctaStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '14px 32px',
    borderRadius: 10,
    background: brand.accentColor,
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 18,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
  };

  // Block-specific layouts
  const renderBlockContent = () => {
    switch (block.blockId) {
      // ─── Product blocks ───
      case 'product-intro':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center'}}>
            <EditableText
              tag="h1"
              value={getText('headlineTemplate')}
              onChange={onContentChange ? (v) => onContentChange('headlineTemplate', v) : undefined}
              style={{...headingStyle, fontSize: 52}}
            />
            {getText('taglineTemplate') && (
              <EditableText
                tag="p"
                value={getText('taglineTemplate')}
                onChange={onContentChange ? (v) => onContentChange('taglineTemplate', v) : undefined}
                style={{...bodyStyle, fontSize: 22, maxWidth: 600}}
              />
            )}
          </div>
        );

      case 'features-grid':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, width: '100%', maxWidth: 800}}>
              {['feature1Template', 'feature2Template', 'feature3Template'].map((key) => (
                <div key={key} style={{background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, textAlign: 'center'}}>
                  <EditableText
                    tag="p"
                    value={getText(key)}
                    onChange={onContentChange ? (v) => onContentChange(key, v) : undefined}
                    style={{...bodyStyle, fontSize: 18, fontWeight: 600}}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing-card':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40}}>
            <div style={{background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '40px 60px', textAlign: 'center', backdropFilter: 'blur(10px)'}}>
              {getText('taglineTemplate') && (
                <EditableText
                  tag="h2"
                  value={getText('taglineTemplate')}
                  onChange={onContentChange ? (v) => onContentChange('taglineTemplate', v) : undefined}
                  style={{...headingStyle, fontSize: 32, marginBottom: 20}}
                />
              )}
              {getText('ctaText') && (
                <div style={ctaStyle}>
                  <EditableText
                    tag="span"
                    value={getText('ctaText')}
                    onChange={onContentChange ? (v) => onContentChange('ctaText', v) : undefined}
                    style={{color: '#FFFFFF', fontWeight: 700, fontSize: 18}}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'brand-frame':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40}}>
            {getText('ctaText') && (
              <div style={ctaStyle}>
                <EditableText
                  tag="span"
                  value={getText('ctaText')}
                  onChange={onContentChange ? (v) => onContentChange('ctaText', v) : undefined}
                  style={{color: '#FFFFFF', fontWeight: 700, fontSize: 18}}
                />
              </div>
            )}
          </div>
        );

      // ─── Property blocks ───
      case 'property-hero':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, textAlign: 'center'}}>
            <EditableText
              tag="h1"
              value={getText('headlineTemplate')}
              onChange={onContentChange ? (v) => onContentChange('headlineTemplate', v) : undefined}
              style={{...headingStyle, fontSize: 48}}
            />
            {getText('taglineTemplate') && (
              <EditableText
                tag="p"
                value={getText('taglineTemplate')}
                onChange={onContentChange ? (v) => onContentChange('taglineTemplate', v) : undefined}
                style={{...bodyStyle, fontSize: 20}}
              />
            )}
            {getText('priceTemplate') && (
              <div style={{background: brand.accentColor, padding: '10px 28px', borderRadius: 8, marginTop: 8}}>
                <EditableText
                  tag="span"
                  value={getText('priceTemplate')}
                  onChange={onContentChange ? (v) => onContentChange('priceTemplate', v) : undefined}
                  style={{color: '#FFFFFF', fontWeight: 800, fontSize: 28}}
                />
              </div>
            )}
          </div>
        );

      case 'property-details':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center'}}>
            <EditableText
              tag="h2"
              value={getText('specsLine')}
              onChange={onContentChange ? (v) => onContentChange('specsLine', v) : undefined}
              style={{...headingStyle, fontSize: 28}}
            />
            {getText('locationLine') && (
              <EditableText
                tag="p"
                value={getText('locationLine')}
                onChange={onContentChange ? (v) => onContentChange('locationLine', v) : undefined}
                style={{...bodyStyle, fontSize: 20}}
              />
            )}
          </div>
        );

      case 'agent-cta':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40}}>
            <div style={ctaStyle}>
              <EditableText
                tag="span"
                value={getText('ctaText')}
                onChange={onContentChange ? (v) => onContentChange('ctaText', v) : undefined}
                style={{color: '#FFFFFF', fontWeight: 700, fontSize: 18}}
              />
            </div>
          </div>
        );

      // ─── Social blocks ───
      case 'social-hook':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center'}}>
            <EditableText
              tag="h1"
              value={getText('hookTemplate')}
              onChange={onContentChange ? (v) => onContentChange('hookTemplate', v) : undefined}
              style={{...headingStyle, fontSize: 56, maxWidth: 700}}
            />
          </div>
        );

      case 'social-body':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center'}}>
            <EditableText
              tag="p"
              value={getText('bodyTemplate')}
              onChange={onContentChange ? (v) => onContentChange('bodyTemplate', v) : undefined}
              style={{...bodyStyle, fontSize: 28, maxWidth: 600}}
            />
          </div>
        );

      case 'social-outro':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40}}>
            <div style={ctaStyle}>
              <EditableText
                tag="span"
                value={getText('ctaText')}
                onChange={onContentChange ? (v) => onContentChange('ctaText', v) : undefined}
                style={{color: '#FFFFFF', fontWeight: 700, fontSize: 18}}
              />
            </div>
          </div>
        );

      // ─── Generic / testimonial / data blocks ───
      case 'data-callout':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40, textAlign: 'center'}}>
            <EditableText
              tag="h1"
              value={getText('value')}
              onChange={onContentChange ? (v) => onContentChange('value', v) : undefined}
              style={{...headingStyle, fontSize: 64}}
            />
            {getText('label') && (
              <EditableText
                tag="p"
                value={getText('label')}
                onChange={onContentChange ? (v) => onContentChange('label', v) : undefined}
                style={{...bodyStyle, fontSize: 20, textTransform: 'uppercase', letterSpacing: 3}}
              />
            )}
          </div>
        );

      case 'testimonial-quote':
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, textAlign: 'center'}}>
            <div style={{fontSize: 64, color: brand.accentColor, opacity: 0.5, lineHeight: 1}}>"</div>
            <EditableText
              tag="h2"
              value={getText('quote')}
              onChange={onContentChange ? (v) => onContentChange('quote', v) : undefined}
              style={{...headingStyle, fontSize: 32, fontStyle: 'italic', maxWidth: 600}}
            />
            <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
              <EditableText
                tag="p"
                value={getText('author')}
                onChange={onContentChange ? (v) => onContentChange('author', v) : undefined}
                style={{...bodyStyle, fontSize: 18, fontWeight: 700}}
              />
              {getText('role') && (
                <EditableText
                  tag="p"
                  value={getText('role')}
                  onChange={onContentChange ? (v) => onContentChange('role', v) : undefined}
                  style={{...bodyStyle, fontSize: 14, opacity: 0.7}}
                />
              )}
            </div>
          </div>
        );

      // ─── Fallback for any block ───
      default: {
        // Render all content fields as editable text
        const fields = Object.entries(block.content);
        if (fields.length === 0) {
          return (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40}}>
              <span style={{...bodyStyle, opacity: 0.5, fontSize: 16}}>[{block.blockId}]</span>
            </div>
          );
        }
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, textAlign: 'center'}}>
            {fields.map(([key, val], i) => {
              const resolved = resolvedContent[key] ?? val;
              const isHeading = i === 0 && fields.length > 1;
              return (
                <EditableText
                  key={key}
                  tag={isHeading ? 'h2' : 'p'}
                  value={resolved}
                  onChange={onContentChange ? (v) => onContentChange(key, v) : undefined}
                  style={isHeading ? headingStyle : bodyStyle}
                />
              );
            })}
          </div>
        );
      }
    }
  };

  return (
    <div
      className={isActive ? animationClass : ''}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {renderBlockContent()}
    </div>
  );
}

// ─── Main LivePreview component ────────────────────────────────────

export default function LivePreview({
  blocks,
  template,
  variant,
  onVariantChange,
  aspectRatio = '16:9',
}: LivePreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const brand = extractBrand(template);

  // Scene duration: 2 seconds per block (at 30fps = 60 frames)
  const SCENE_DURATION_MS = 2000;
  const totalDuration = blocks.length * SCENE_DURATION_MS;

  // Resolve placeholders in content
  const resolvedContent: Record<string, Record<string, string>> = {};
  for (const block of blocks) {
    resolvedContent[block.instanceId] = {};
    for (const [key, val] of Object.entries(block.content)) {
      resolvedContent[block.instanceId][key] = resolvePlaceholders(val ?? '', variant);
    }
  }

  // Playback timer
  useEffect(() => {
    if (!isPlaying || blocks.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100;
        if (next >= totalDuration) {
          // Loop
          setActiveIndex(0);
          return 0;
        }
        const newIndex = Math.floor(next / SCENE_DURATION_MS);
        setActiveIndex(Math.min(newIndex, blocks.length - 1));
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, blocks.length, totalDuration]);

  // Handle content edits
  const handleContentChange = useCallback(
    (blockInstanceId: string, key: string, value: string) => {
      if (!onVariantChange) return;

      // Find which variant key this maps to
      const block = blocks.find((b) => b.instanceId === blockInstanceId);
      if (!block) return;

      // Update the variant data
      const contentVal = block.content[key] ?? '';
      const placeholderMatch = contentVal.match(/\{\{(\w+)\}\}/);

      if (placeholderMatch) {
        // This field references a placeholder — update the variant key
        const variantKey = placeholderMatch[1];
        onVariantChange({...variant, [variantKey]: value});
      } else {
        // Direct content — update the block content directly
        // For now, we store it in variant with a synthetic key
        onVariantChange({...variant, [`${block.blockId}_${key}`]: value});
      }
    },
    [blocks, variant, onVariantChange],
  );

  // Aspect ratio sizing
  const ratioMap = {
    '16:9': {paddingTop: '56.25%'},
    '9:16': {paddingTop: '177.78%'},
    '1:1': {paddingTop: '100%'},
    '4:5': {paddingTop: '125%'},
  };

  // Progress bar
  const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {/* Animation CSS */}
      <style>{ANIMATION_STYLES}</style>

      {/* Preview container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          ...ratioMap[aspectRatio],
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}
      >
        {/* Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...backgroundStyle(brand),
          }}
        />

        {/* Blocks */}
        {blocks.map((block, index) => {
          const entryPreset = block.animation?.entry?.presetId ?? 'fade-in';
          const exitPreset = block.animation?.exit?.presetId;
          const animName = index === activeIndex
            ? (ANIMATION_MAP[entryPreset] ?? 'fade-in')
            : index === activeIndex - 1 && exitPreset
              ? (ANIMATION_MAP[exitPreset] ?? 'fade-out')
              : '';

          return (
            <BlockRenderer
              key={block.instanceId}
              block={block}
              brand={brand}
              resolvedContent={resolvedContent[block.instanceId] ?? {}}
              onContentChange={
                onVariantChange
                  ? (key, value) => handleContentChange(block.instanceId, key, value)
                  : undefined
              }
              animationClass={animName}
              isActive={index === activeIndex}
            />
          );
        })}

        {/* Scene indicator dots */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
          }}
        >
          {blocks.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                setElapsed(i * SCENE_DURATION_MS);
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                border: 'none',
                background: i === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 4,
          background: '#E5E7EB',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: brand.accentColor,
            borderRadius: 2,
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Controls */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', gap: 8}}>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(!isPlaying);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveIndex(0);
              setElapsed(0);
              setIsPlaying(true);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ↻ Restart
          </button>
        </div>

        <span style={{fontSize: 12, color: '#9CA3AF'}}>
          Scene {activeIndex + 1} of {blocks.length}
          {' · '}
          Click text to edit
        </span>
      </div>
    </div>
  );
}
