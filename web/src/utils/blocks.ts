import {blockCapabilities} from '@vary/shared/capabilities/blocks';
import type {SceneBlockCategory as SharedSceneBlockCategory} from '@vary/shared/capabilities/types';
import {getFrontendTemplate} from './templates';

/**
 * Frontend block registry — thin adapter over canonical shared metadata
 * (src/shared/capabilities/blocks.ts). No hand-maintained duplication here.
 *
 * Keeps UI-only concepts local: ComposerBlock, createComposerBlock, and the
 * compatibility SceneBlockDefinition shape (which adds needsBrandSettings +
 * defaultContent that the shared metadata expresses as contentFields).
 */

export type SceneBlockCategory = SharedSceneBlockCategory;

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

const toFrontendDefinition = (
  block: (typeof blockCapabilities)[number],
): SceneBlockDefinition => ({
  id: block.id,
  name: block.name,
  description: block.description,
  icon: block.icon,
  category: block.category,
  defaultDurationFrames: block.defaultDurationFrames,
  compatibleSchemas: block.compatibleSchemas,
  needsBrandSettings: block.requiredBrandSettings.length > 0,
  defaultContent: Object.fromEntries(
    block.contentFields.map((field) => [
      field.key,
      field.placeholder ?? '',
    ]),
  ),
});

export const blockDefinitions: SceneBlockDefinition[] =
  blockCapabilities.map(toFrontendDefinition);

export const blockRegistry: Record<string, SceneBlockDefinition> =
  Object.fromEntries(blockDefinitions.map((block) => [block.id, block]));

export type ComposerBlock = {
  instanceId: string;
  blockId: string;
  content: Record<string, string>;
  durationFrames?: number;
  animation?: {
    entry?: {presetId: string; durationFrames?: number; intensity?: number; easing?: string};
    exit?: {presetId: string; durationFrames?: number; intensity?: number; easing?: string};
  };
  transition?: {
    type: string;
    durationFrames?: number;
    direction?: string;
    easing?: string;
    intensity?: number;
  };
  imageTreatment?: Record<string, unknown>;
};

export const categories: SceneBlockCategory[] = [
  'intro',
  'hook',
  'body',
  'feature',
  'detail',
  'cta',
  'outro',
];

export const getBlockDefinition = (blockId: string): SceneBlockDefinition =>
  blockRegistry[blockId] ?? blockRegistry['text-overlay'];

export const getDefaultBlockSequence = (templateId: string): string[] =>
  getFrontendTemplate(templateId).blockSequence ?? ['text-overlay', 'brand-frame'];

export const createComposerBlock = (blockId: string): ComposerBlock => {
  const definition = getBlockDefinition(blockId);

  return {
    instanceId: `${blockId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    blockId,
    content: {...definition.defaultContent},
    durationFrames: definition.defaultDurationFrames,
  };
};
