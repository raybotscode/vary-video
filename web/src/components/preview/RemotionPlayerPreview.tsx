/**
 * RemotionPlayerPreview — true WYSIWYG video preview using Remotion's Player.
 *
 * This renders the EXACT SAME React components that Remotion uses for the
 * final video export. What you see IS what you get. No divergence.
 *
 * Features:
 * - Real-time animation playback at 30fps
 * - Click-to-edit text overlays
 * - Timeline scrubbing with frame-level control
 * - Play/pause/restart
 * - Scene indicator dots
 * - Instant prop updates (text, colors, images)
 */

import {useCallback, useEffect, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {SceneBlockPlayer} from '@vary/compositions/SceneBlockPlayer/SceneBlockPlayer';
import {
  sceneBlockPlayerSchema,
  getSequenceDuration,
  type SceneBlockPlayerProps,
  type SceneBlockSequenceItem,
} from '@vary/compositions/SceneBlockPlayer/schema';
import type {ComposerBlock} from '../../utils/blocks';
import type {RenderTemplatePayload} from '../../api/client';
import type {VariantData} from '../../utils/placeholder';
import type {ElementLayout} from '@vary/shared/capabilities/types';
import {getBlock} from '@vary/compositions/blocks/registry';
import {blockCapabilities} from '@vary/shared/capabilities/blocks';
import EditPanel from './EditPanel';
import EditOverlay from './EditOverlay';

// ─── Types ──────────────────────────────────────────────────────────

type RemotionPlayerPreviewProps = {
  blocks: ComposerBlock[];
  template: RenderTemplatePayload;
  variant: VariantData;
  onVariantChange?: (updated: VariantData) => void;
  onBlockLayoutChange?: (blockInstanceId: string, fieldKey: string, layout: ElementLayout) => void;
  onBlockContentChange?: (blockInstanceId: string, fieldKey: string, value: string) => void;
  onFrameChange?: (frame: number) => void;
};

type EditableField = {
  key: string;
  label: string;
  value: string;
  blockInstanceId: string;
  blockId: string;
};

// ─── Helper: build SceneBlockPlayerProps from composer state ────────

function buildInputProps(
  blocks: ComposerBlock[],
  template: RenderTemplatePayload,
  variant: VariantData,
): SceneBlockPlayerProps {
  // Resolve variant data into block content
  const resolvedBlocks: SceneBlockSequenceItem[] = blocks.map((block) => {
    const definition = getBlock(block.blockId);
    const resolvedContent: Record<string, string> = {};

    for (const [key, val] of Object.entries(block.content)) {
      // Replace {{placeholder}} with variant data
      resolvedContent[key] = (val ?? '').replace(
        /\{\{(\w+)\}\}/g,
        (_, placeholder) => variant[placeholder] ?? `{{${placeholder}}}`,
      );
    }

    // Merge with defaults for any missing fields
    for (const [key, val] of Object.entries(definition.defaultContent)) {
      if (!(key in resolvedContent)) {
        resolvedContent[key] = (val ?? '').replace(
          /\{\{(\w+)\}\}/g,
          (_, placeholder) => variant[placeholder] ?? `{{${placeholder}}}`,
        );
      }
    }

    return {
      blockId: block.blockId,
      content: resolvedContent,
      layout: block.layout as SceneBlockSequenceItem['layout'],
      durationFrames: block.durationFrames,
      animation: block.animation as SceneBlockSequenceItem['animation'],
      transition: block.transition as SceneBlockSequenceItem['transition'],
    };
  });

  // Extract brand settings from template
  const brandSettings = {
    brandColor: (template.brandColor as string) || '#1A365D',
    secondaryColor: (template.secondaryColor as string) || '#3182CE',
    accentColor: (template.accentColor as string) || '#FF6B5B',
    logoUrl: (template.logoUrl as string) || '',
    backgroundType: (['solid', 'gradient', 'image'].includes(
      template.backgroundType as string,
    )
      ? template.backgroundType
      : 'gradient') as 'solid' | 'gradient' | 'image',
    backgroundColor: (template.backgroundColor as string) || '#F7FAFC',
    backgroundImageUrl: template.backgroundImageUrl as string | undefined,
  };

  return {
    blocks: resolvedBlocks,
    brandSettings,
    fps: 30,
    width: 1920,
    height: 1080,
    data: variant,
  };
}

// ─── Helper: get editable fields for current frame ──────────────────

function getEditableFields(
  blocks: ComposerBlock[],
  frame: number,
): EditableField[] {
  let accumulated = 0;

  for (const block of blocks) {
    const definition = getBlock(block.blockId);
    const duration = block.durationFrames ?? definition.defaultDurationFrames;

    if (frame >= accumulated && frame < accumulated + duration) {
      // This is the active block — return its content fields
      const cap = blockCapabilities.find((c) => c.id === block.blockId);
      return (cap?.contentFields ?? []).map((field) => ({
        key: field.key,
        label: field.label,
        value: block.content[field.key] ?? field.placeholder ?? '',
        blockInstanceId: block.instanceId,
        blockId: block.blockId,
      }));
    }

    accumulated += duration;
  }

  return [];
}

// ─── Main component ─────────────────────────────────────────────────

export default function RemotionPlayerPreview({
  blocks,
  template,
  variant,
  onVariantChange,
  onBlockLayoutChange,
  onBlockContentChange,
  onFrameChange,
}: RemotionPlayerPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  // Build input props from current state
  const inputProps = buildInputProps(blocks, template, variant);
  const durationInFrames = getSequenceDuration(inputProps.blocks);

  // Get block boundaries for scene dots
  const blockBoundaries: {start: number; end: number; index: number}[] = [];
  let acc = 0;
  for (let i = 0; i < blocks.length; i++) {
    const def = getBlock(blocks[i].blockId);
    const dur = blocks[i].durationFrames ?? def.defaultDurationFrames;
    blockBoundaries.push({start: acc, end: acc + dur - 1, index: i});
    acc += dur;
  }

  // Get editable fields for current frame
  const editableFields = getEditableFields(blocks, currentFrame);

  // Player event handlers
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleFrame = (e: {detail: {frame: number}}) => {
      const frame = e.detail.frame;
      setCurrentFrame(frame);
      onFrameChange?.(frame);

      // Update active block index
      const boundary = blockBoundaries.find(
        (b) => frame >= b.start && frame <= b.end,
      );
      if (boundary) {
        setActiveBlockIndex(boundary.index);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentFrame(0);
    };

    player.addEventListener('frameupdate', handleFrame as EventListener);
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);
    player.addEventListener('ended', handleEnded);

    return () => {
      player.removeEventListener('frameupdate', handleFrame as EventListener);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      player.removeEventListener('ended', handleEnded);
    };
  }, [blockBoundaries, onFrameChange]);

  // Handle content edits — update variant data or block content directly
  const handleFieldChange = useCallback(
    (fieldKey: string, newValue: string) => {
      const activeBlock = blocks[activeBlockIndex];
      if (!activeBlock) return;

      // Check if this field references a {{placeholder}}
      const originalVal = activeBlock.content[fieldKey] ?? '';
      const placeholderMatch = originalVal.match(/\{\{(\w+)\}\}/);

      if (placeholderMatch && onVariantChange) {
        // Field uses a placeholder — update the variant (CSV data)
        const variantKey = placeholderMatch[1];
        onVariantChange({...variant, [variantKey]: newValue});
      } else if (onBlockContentChange) {
        // Field has no placeholder — update block content directly
        onBlockContentChange(activeBlock.instanceId, fieldKey, newValue);
      }
    },
    [blocks, activeBlockIndex, variant, onVariantChange, onBlockContentChange],
  );

  // Handle layout changes from EditPanel
  const handleLayoutChange = useCallback(
    (fieldKey: string, layout: ElementLayout) => {
      const activeBlock = blocks[activeBlockIndex];
      if (!activeBlock || !onBlockLayoutChange) return;
      onBlockLayoutChange(activeBlock.instanceId, fieldKey, layout);
    },
    [blocks, activeBlockIndex, onBlockLayoutChange],
  );

  // Jump to scene
  const jumpToScene = useCallback(
    (index: number) => {
      const boundary = blockBoundaries[index];
      if (boundary && playerRef.current) {
        playerRef.current.seekTo(boundary.start);
        setActiveBlockIndex(index);
      }
    },
    [blockBoundaries],
  );

  // Play/pause toggle
  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPlaying]);

  // Restart
  const restart = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(0);
    setCurrentFrame(0);
    setActiveBlockIndex(0);
    player.play();
  }, []);

  if (blocks.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          background: '#F9FAFB',
          borderRadius: 12,
          color: '#9CA3AF',
          fontSize: 14,
        }}
      >
        Add blocks to see a preview
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{display: 'flex', flexDirection: 'column', gap: 16}}
    >
      {/* Player container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          background: '#000',
        }}
      >
        <Player
          ref={playerRef}
          component={SceneBlockPlayer}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{
            width: '100%',
            height: 'auto',
            aspectRatio: '16/9',
          }}
          acknowledgeRemotionLicense
        />
        {/* Clickable overlay for inline editing */}
        {blocks[activeBlockIndex] && (
          <EditOverlay
            block={blocks[activeBlockIndex]}
            variant={variant}
            selectedFieldKey={selectedFieldKey}
            onSelectField={(key) => {
              setSelectedFieldKey(key);
              // If selecting a field, scroll the edit panel into view
              if (key) {
                setTimeout(() => {
                  const el = document.querySelector(`[data-field-key="${key}"]`);
                  el?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                }, 100);
              }
            }}
          />
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: '#E5E7EB',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          const frame = Math.round(pct * durationInFrames);
          playerRef.current?.seekTo(frame);
        }}
      >
        <div
          style={{
            width: `${(currentFrame / Math.max(durationInFrames - 1, 1)) * 100}%`,
            height: '100%',
            background: '#3B82F6',
            borderRadius: 3,
            transition: 'width 0.05s linear',
          }}
        />
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <button
            type="button"
            onClick={togglePlayback}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#3B82F6',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            type="button"
            onClick={restart}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ↻ Restart
          </button>
          <span style={{fontSize: 12, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums'}}>
            {currentFrame} / {durationInFrames} frames
          </span>
        </div>

        {/* Scene dots */}
        <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
          {blockBoundaries.map((boundary, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpToScene(i)}
              title={`Scene ${i + 1}: ${getBlock(blocks[i].blockId).name}`}
              style={{
                width: i === activeBlockIndex ? 24 : 10,
                height: 10,
                borderRadius: 5,
                border: 'none',
                background:
                  i === activeBlockIndex ? '#3B82F6' : '#D1D5DB',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
          <span style={{fontSize: 11, color: '#9CA3AF', marginLeft: 4}}>
            Scene {activeBlockIndex + 1}/{blocks.length}
          </span>
        </div>
      </div>

      {/* Enhanced edit panel for active block */}
      {blocks.length > 0 && blocks[activeBlockIndex] && (
        <EditPanel
          block={blocks[activeBlockIndex]}
          variant={variant}
          onContentChange={handleFieldChange}
          onLayoutChange={handleLayoutChange}
          selectedFieldKey={selectedFieldKey}
          onSelectField={setSelectedFieldKey}
        />
      )}
    </div>
  );
}
