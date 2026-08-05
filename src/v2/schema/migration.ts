/**
 * V1 → V2 Document Migration
 *
 * Converts v1 SceneBlockPlayerProps into a v2 V2Document.
 * This allows existing templates to be used in the new system.
 */

import type {V2Document, V2Scene, V2Element, Background} from './document';
import {V2_DOCUMENT_VERSION} from './document';

// ─── V1 Types (subset needed for migration) ──────────────────────

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

// ─── V1 Block ID → V2 Element Type ────────────────────────────────

const BLOCK_TO_ELEMENT_TYPE: Record<string, 'text' | 'image' | 'shape'> = {
  'text-overlay': 'text',
  'data-callout': 'text',
  'image-block': 'image',
};

// ─── V1 Animation Preset → V2 Preset ──────────────────────────────

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

// ─── Coordinate Conversion ────────────────────────────────────────

/** Convert v1 percentage (0-100) to v2 normalized (0-1) */
export function convertV1Layout(
  v1Layout: V1Layout[string] | undefined,
  defaults: {x: number; y: number; fontSize: number; color: string},
): {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  animation?: V1Layout[string]['animation'];
} {
  if (!v1Layout) {
    return {
      x: defaults.x / 100,
      y: defaults.y / 100,
      fontSize: defaults.fontSize,
      color: defaults.color,
    };
  }

  return {
    x: (v1Layout.x ?? defaults.x) / 100,
    y: (v1Layout.y ?? defaults.y) / 100,
    fontSize: v1Layout.fontSize ?? defaults.fontSize,
    color: v1Layout.color ?? defaults.color,
    animation: v1Layout.animation,
  };
}

/** Map v1 animation preset ID to v2 preset */
function mapPreset(v1PresetId: string): string {
  return PRESET_MAP[v1PresetId] ?? 'fade-in';
}

// ─── Main Migration ───────────────────────────────────────────────

/**
 * Convert a v1 SceneBlockPlayerProps into a v2 V2Document.
 *
 * This is a best-effort conversion. Some v1 features may not have
 * exact v2 equivalents. The resulting document is valid and can be
 * used in the v2 editor and renderer.
 */
export function migrateV1ToV2(v1: V1SceneBlockPlayerProps): V2Document {
  const brandColor = v1.brandSettings.brandColor ?? '#1A365D';
  const secondaryColor = v1.brandSettings.secondaryColor ?? '#3182CE';
  const bgColor = v1.brandSettings.backgroundColor ?? '#F7FAFC';

  // Convert background
  let background: Background;
  if (v1.brandSettings.backgroundType === 'solid') {
    background = {type: 'solid', color: bgColor};
  } else if (v1.brandSettings.backgroundType === 'image' && v1.brandSettings.backgroundImageUrl) {
    background = {type: 'image', src: v1.brandSettings.backgroundImageUrl, opacity: 0.16};
  } else {
    background = {type: 'gradient', color1: bgColor, color2: secondaryColor, angle: 135};
  }

  // Convert each v1 block into a v2 scene
  const scenes: V2Scene[] = v1.blocks.map((block, blockIndex) => {
    const elements: V2Element[] = [];
    const elementType = BLOCK_TO_ELEMENT_TYPE[block.blockId] ?? 'text';

    // Extract content fields and create elements
    for (const [key, value] of Object.entries(block.content)) {
      const layout = convertV1Layout(block.layout?.[key], {
        x: 50,
        y: 50,
        fontSize: 86,
        color: brandColor,
      });

      const v2Element: V2Element = {
        id: `${block.blockId}-${key}`,
        type: elementType,
        name: key,
        visible: true,
        locked: false,
        timing: {
          startFrame: 0,
          endFrame: null,
        },
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
        props: elementType === 'text'
          ? {
              content: value,
              fontFamily: 'Inter',
              fontSize: layout.fontSize,
              fontWeight: 700,
              fontStyle: 'normal',
              lineHeight: 1.2,
              letterSpacing: 0,
              color: layout.color,
              textAlign: 'center',
              verticalAlign: 'middle',
              textTransform: 'none',
              maxLines: null,
              backgroundColor: null,
              padding: 0,
              borderRadius: 0,
            }
          : elementType === 'image'
            ? {
                src: value,
                fit: 'cover',
                objectPositionX: 0.5,
                objectPositionY: 0.5,
                borderRadius: 0,
                overlayColor: null,
                overlayOpacity: 0,
                blur: 0,
                shadow: false,
              }
            : {
                shapeType: 'rectangle',
                fill: layout.color,
                stroke: null,
                strokeWidth: 0,
                borderRadius: 0,
              },
        animation: {
          in: block.animation?.entry || layout.animation?.entry
            ? {
                preset: mapPreset(
                  block.animation?.entry?.presetId ?? layout.animation?.entry?.presetId ?? 'fadeIn',
                ) as any,
                durationFrames: block.animation?.entry?.durationFrames
                  ?? layout.animation?.entry?.durationFrames
                  ?? 15,
                delayFrames: 0,
                easing: 'ease-out',
                intensity: layout.animation?.entry?.intensity ?? 1,
              }
            : undefined,
          out: block.animation?.exit || layout.animation?.exit
            ? {
                preset: mapPreset(
                  block.animation?.exit?.presetId ?? layout.animation?.exit?.presetId ?? 'fadeOut',
                ) as any,
                durationFrames: block.animation?.exit?.durationFrames
                  ?? layout.animation?.exit?.durationFrames
                  ?? 15,
                delayFrames: 0,
                easing: 'ease-in',
                intensity: layout.animation?.exit?.intensity ?? 1,
              }
            : undefined,
        },
      };

      elements.push(v2Element);
    }

    // If no content fields, create a single text element with all content merged
    if (elements.length === 0) {
      const mergedContent = Object.values(block.content).join(' ');
      elements.push({
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
        props: {
          content: mergedContent || '{{headline}}',
          fontFamily: 'Inter',
          fontSize: 86,
          fontWeight: 700,
          fontStyle: 'normal',
          lineHeight: 1.2,
          letterSpacing: 0,
          color: brandColor,
          textAlign: 'center',
          verticalAlign: 'middle',
          textTransform: 'none',
          maxLines: null,
          backgroundColor: null,
          padding: 0,
          borderRadius: 0,
        },
        animation: {},
      });
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
