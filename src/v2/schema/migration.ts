/**
 * V1 → V2 Document Migration
 *
 * Converts v1 SceneBlockPlayerProps into a v2 V2Document.
 * Uses discriminated union element types with strongly-typed props.
 */

import type {V2Document, V2Scene, V2Element, TextElement, ImageElement, Background, AnimationPreset, MergeTag} from './document';
import {V2_DOCUMENT_VERSION, textPropsSchema, imagePropsSchema, shapePropsSchema, mergeTagSchema} from './document';
import {parseBindableText, generateTagId, literalText} from './bindable';

// ─── V1 Types ─────────────────────────────────────────────────────

type V1BlockContent = Record<string, string>;
type V1Layout = Record<string, {
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  animation?: {
    entry?: {presetId: string; durationFrames?: number; intensity?: number; easing?: string};
    exit?: {presetId: string; durationFrames?: number; intensity?: number; easing?: string};
  };
}>;

type V1SceneBlock = {
  blockId: string;
  content: V1BlockContent;
  layout?: V1Layout;
  durationFrames?: number;
  animation?: {
    entry?: {presetId: string; durationFrames?: number};
    exit?: {presetId: string; durationFrames?: number};
  };
  transition?: {type: string; durationFrames?: number};
};

type V1BrandSettings = {
  brandColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
};

type V1SceneBlockPlayerProps = {
  blocks: V1SceneBlock[];
  brandSettings: V1BrandSettings;
  fps: number;
  width: number;
  height: number;
  data: Record<string, string>;
};

// ─── Mapping ──────────────────────────────────────────────────────

const PRESET_MAP: Record<string, string> = {
  'fadeIn': 'fade-in',
  'fadeOut': 'fade-out',
  'slideUp': 'slide-up',
  'slideDown': 'slide-down',
  'slideLeft': 'slide-left',
  'slideRight': 'slide-right',
  'scaleIn': 'scale-in',
  'scaleOut': 'scale-out',
  'zoomIn': 'zoom-in',
  'zoomOut': 'zoom-out',
  'bounceIn': 'bounce-in',
  'rotateIn': 'rotate-in',
};

export function convertV1Layout(
  v1Layout: V1Layout[string] | undefined,
  defaults: {x: number; y: number; fontSize: number; color: string},
) {
  if (!v1Layout) {
    return {x: defaults.x / 100, y: defaults.y / 100, fontSize: defaults.fontSize, color: defaults.color};
  }
  return {
    x: (v1Layout.x ?? defaults.x) / 100,
    y: (v1Layout.y ?? defaults.y) / 100,
    fontSize: v1Layout.fontSize ?? defaults.fontSize,
    color: v1Layout.color ?? defaults.color,
  };
}

function mapPreset(v1PresetId: string): string {
  return PRESET_MAP[v1PresetId] ?? 'fade-in';
}

// ─── Migration ────────────────────────────────────────────────────

export function migrateV1ToV2(v1: V1SceneBlockPlayerProps): V2Document {
  const brandColor = v1.brandSettings.brandColor ?? '#1A365D';
  const secondaryColor = v1.brandSettings.secondaryColor ?? '#3182CE';
  const bgColor = v1.brandSettings.backgroundColor ?? '#F7FAFC';

  let background: Background;
  if (v1.brandSettings.backgroundType === 'solid') {
    background = {type: 'solid', color: bgColor};
  } else if (v1.brandSettings.backgroundType === 'image' && v1.brandSettings.backgroundImageUrl) {
    background = {type: 'image', src: v1.brandSettings.backgroundImageUrl, opacity: 0.16};
  } else {
    background = {type: 'gradient', color1: bgColor, color2: secondaryColor, angle: 135};
  }

  const scenes: V2Scene[] = v1.blocks.map((block, blockIndex) => {
    const elements: V2Element[] = [];

    for (const [key, value] of Object.entries(block.content)) {
      const layout = convertV1Layout(block.layout?.[key], {
        x: 50, y: 50, fontSize: 86, color: brandColor,
      });

      // Create a typed text element
      const textElement: TextElement = {
        id: `${block.blockId}-${key}`,
        type: 'text',
        name: key,
        visible: true,
        locked: false,
        timing: {startFrame: 0, endFrame: null},
        transform: {
          x: layout.x,
          y: layout.y,
          width: 0.8,
          height: null,
          rotation: 0,
          anchorX: 0.5,
          anchorY: 0.5,
          zIndex: 10 + elements.length,
          opacity: 1,
        },
        responsiveOverrides: {},
        props: textPropsSchema.parse({
          content: value,
          fontSize: layout.fontSize,
          color: layout.color,
        }),
        animation: {
          in: block.animation?.entry
            ? {
                preset: mapPreset(block.animation.entry.presetId) as AnimationPreset,
                durationFrames: block.animation.entry.durationFrames ?? 15,
                delayFrames: 0,
                easing: 'ease-out' as const,
                intensity: 1,
              }
            : undefined,
          out: block.animation?.exit
            ? {
                preset: mapPreset(block.animation.exit.presetId) as AnimationPreset,
                durationFrames: block.animation.exit.durationFrames ?? 15,
                delayFrames: 0,
                easing: 'ease-in' as const,
                intensity: 1,
              }
            : undefined,
        },
      };

      elements.push(textElement);
    }

    // Fallback: create a single text element if no content fields
    if (elements.length === 0) {
      const mergedContent = Object.values(block.content).join(' ');
      const fallbackElement: TextElement = {
        id: `${block.blockId}-text`,
        type: 'text',
        name: 'Text',
        visible: true,
        locked: false,
        timing: {startFrame: 0, endFrame: null},
        transform: {
          x: 0.5, y: 0.5, width: 0.8, height: null,
          rotation: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 10, opacity: 1,
        },
        responsiveOverrides: {},
        props: textPropsSchema.parse({
          content: mergedContent || '{{headline}}',
          color: brandColor,
        }),
        animation: {},
      };
      elements.push(fallbackElement);
    }

    return {
      id: `scene-${blockIndex + 1}`,
      name: `Scene ${blockIndex + 1}`,
      durationFrames: block.durationFrames ?? 90,
      background,
      elements,
    };
  });

  return {
    schemaVersion: V2_DOCUMENT_VERSION,
    id: `migrated-${Date.now()}`,
    name: 'Migrated Template',
    description: 'Converted from v1 SceneBlockPlayerProps',
    fps: v1.fps ?? 30,
    defaultAspectRatio: '16:9',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    scenes,
    mergeTags: [],
    metadata: {
      migratedFrom: 'v1',
      originalBlockIds: v1.blocks.map(b => b.blockId),
    },
  };
}

// ─── V2 → V3 Migration ────────────────────────────────────────────

/**
 * Migrate a v2 document to v3.
 * Key changes:
 * - Merge tags get stable `id` fields
 * - Merge tags get `description` and `format` fields
 * - Text content with {{key}} parsed into BindableText
 * - schemaVersion bumped to 3
 */
export function migrateV2ToV3(doc: Record<string, any>): V2Document {
  // Build key→id map AND assign stable IDs to tags missing them.
  // Critical: each tag gets exactly ONE ID, used in both keyToId and mergeTags.
  const keyToId = new Map<string, string>();
  for (const tag of (doc.mergeTags ?? [])) {
    if (!tag.id) tag.id = generateTagId();
    if (tag.key) keyToId.set(tag.key, tag.id);
  }

  const mergeTags = (doc.mergeTags ?? []).map((tag: any) => ({
    ...tag,
    id: tag.id, // already assigned above (or was present)
    description: tag.description ?? '',
    format: tag.format ?? undefined,
  }));

  const scenes = (doc.scenes ?? []).map((scene: any) => ({
    ...scene,
    elements: (scene.elements ?? []).map((el: any) => {
      const props = {...el.props};
      if (typeof props.content === 'string' && (props.content as string).includes('{{')) {
        props.content = parseBindableText(props.content as string, keyToId);
      }
      for (const key of ['color', 'fill', 'stroke']) {
        if (typeof props[key] === 'string' && (props[key] as string).includes('{{')) {
          const m = (props[key] as string).match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)}\}/);
          if (m) props[key] = {_type: 'tag', tagId: keyToId.get(m[1]) ?? `unknown:${m[1]}`};
        }
      }
      if (typeof props.src === 'string' && (props.src as string).includes('{{')) {
        const m = (props.src as string).match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)}\}/);
        if (m) props.src = {_type: 'tag', tagId: keyToId.get(m[1]) ?? `unknown:${m[1]}`};
      }
      return {...el, props};
    }),
  }));

  return {
    ...doc,
    schemaVersion: 3 as any,
    mergeTags,
    scenes,
  } as V2Document;
}
