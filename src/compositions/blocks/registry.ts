import type React from 'react';
import {DataCallout} from './DataCallout';
import {TextOverlay} from './TextOverlay';
import {blockAdapters} from './adapters';
import {blockCapabilities} from '../../shared/capabilities/blocks';
import type {BlockCapability} from '../../shared/capabilities/types';

export type SceneBlockCategory = BlockCapability['category'];

export type BrandSettings = {
  brandColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  backgroundType: 'solid' | 'gradient' | 'image';
  backgroundColor: string;
  backgroundImageUrl?: string;
};

export type BlockRenderProps = {
  frame: number;
  fps: number;
  width: number;
  height: number;
  content: Record<string, string>;
  brand: BrandSettings;
  data: Record<string, string>;
  startFrame?: number;
};

export type SceneBlockDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: SceneBlockCategory;
  defaultDurationFrames: number;
  compatibleSchemas: string[];
  needsBrandSettings: boolean;
  defaultContent: Record<string, string>;
};

const toDefinition = (block: BlockCapability): SceneBlockDefinition => ({
  id: block.id,
  name: block.name,
  description: block.description,
  icon: block.icon,
  category: block.category,
  defaultDurationFrames: block.defaultDurationFrames,
  compatibleSchemas: block.compatibleSchemas,
  needsBrandSettings: block.requiredBrandSettings.length > 0,
  defaultContent: Object.fromEntries(
    block.contentFields.map((field) => [field.key, field.placeholder ?? '']),
  ),
});

const definitions: SceneBlockDefinition[] = blockCapabilities.map(toDefinition);

export const blockRegistry: Record<string, SceneBlockDefinition> =
  Object.fromEntries(definitions.map((block) => [block.id, block]));

export const blockRenderers: Record<string, React.FC<BlockRenderProps>> = {
  ...blockAdapters,
  'text-overlay': TextOverlay,
  'data-callout': DataCallout,
};

export function getBlock(id: string): SceneBlockDefinition {
  const block = blockRegistry[id];
  if (!block) {
    throw new Error(`Unknown scene block: ${id}`);
  }

  return block;
}

export function getAllBlocks(): SceneBlockDefinition[] {
  return definitions;
}

export function getBlocksByCategory(category: string): SceneBlockDefinition[] {
  return definitions.filter((block) => block.category === category);
}
