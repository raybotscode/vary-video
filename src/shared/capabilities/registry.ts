import {getEnabledAnimationPresets} from './animations';
import {blockCapabilities, isBlockEnabled} from './blocks';
import {getEnabledMediaFields} from './media';
import {getEnabledStylePresets} from './styles';
import {templateCapabilities} from './templates';
import type {
  BlockCapability,
  CapabilityRegistry,
  CompactCapabilitySummary,
  TemplateCapability,
} from './types';
import {stableStringify} from './stableStringify';

/**
 * Builds the canonical capability registry and the compact AI summary.
 * All capability access should go through this module — never hand-roll
 * template/block lists elsewhere.
 *
 * Browser-safe: this module only uses stableStringify (no node:crypto).
 * The sha256 variant lives in hash.ts for Node-side use only.
 */

const enabledTemplates = (): TemplateCapability[] =>
  templateCapabilities.filter((template) => template.status === 'enabled');

const enabledBlocks = (): BlockCapability[] =>
  blockCapabilities.filter((block) => block.status === 'enabled');

const buildRegistry = (): CapabilityRegistry => {
  const data = {
    templates: enabledTemplates(),
    blocks: enabledBlocks(),
    animations: getEnabledAnimationPresets(),
    styles: getEnabledStylePresets(),
    media: getEnabledMediaFields(),
  };

  return {
    version: {
      // Browser-safe deterministic hash (stable stringify) is the canonical
      // version. sha256Hex stays available in hash.ts for Node-side signing.
      hash: stableStringify(data),
      generatedAt: new Date().toISOString(),
    },
    ...data,
  };
};

let cached: CapabilityRegistry | null = null;

export const getCapabilityRegistry = (): CapabilityRegistry => {
  cached ??= buildRegistry();
  return cached;
};

export const getEnabledTemplates = (): TemplateCapability[] => enabledTemplates();

export const getEnabledBlocks = (): BlockCapability[] => enabledBlocks();

export const getCapabilityVersion = (): string => getCapabilityRegistry().version.hash;

export const assertKnownEnabledBlockIds = (blockIds: string[]): void => {
  const known = new Set(enabledBlocks().map((block) => block.id));
  const unknown = blockIds.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown or disabled block IDs: ${unknown.join(', ')}. Available: ${[...known].join(', ')}.`,
    );
  }
};

export const assertKnownEnabledTemplateId = (templateId: string): void => {
  const known = new Set(enabledTemplates().map((template) => template.id));
  if (!known.has(templateId)) {
    throw new Error(
      `Unknown or disabled template: ${templateId}. Available: ${[...known].join(', ')}.`,
    );
  }
};

/**
 * Get the media field IDs for a given template/composition.
 * Returns an empty array if the template has no media fields.
 * Used server-side to derive validation targets from the composition,
 * not from the untrusted request body.
 */
export const getMediaFieldIdsForTemplate = (templateId: string): string[] => {
  const template = templateCapabilities.find((t) => t.id === templateId);
  return template?.mediaFields ?? [];
};

/**
 * Get the media field IDs for a given template, including media fields
 * from its default blocks. This catches media fields that are on blocks
 * but not on the template itself.
 */
export const getAllMediaFieldIdsForComposition = (templateId: string): string[] => {
  const templateFields = getMediaFieldIdsForTemplate(templateId);

  // Also check default blocks for media fields
  const template = templateCapabilities.find((t) => t.id === templateId);
  if (!template) return templateFields;

  const blockFields = new Set(templateFields);
  for (const blockId of template.defaultBlocks) {
    const block = blockCapabilities.find((b) => b.id === blockId);
    if (block?.mediaFields) {
      for (const field of block.mediaFields) {
        blockFields.add(field);
      }
    }
  }

  return [...blockFields];
};

/** Compact AI-facing summary — omits large defaults, includes the essentials. */
export const getCompactCapabilitySummary = (): CompactCapabilitySummary => {
  const registry = getCapabilityRegistry();

  return {
    version: registry.version.hash,
    templates: registry.templates.map((template) => ({
      id: template.id,
      name: template.name,
      requiredFields: template.requiredPlaceholders,
    })),
    blocks: registry.blocks.map((block) => ({
      id: block.id,
      name: block.name,
      category: block.category,
      contentFields: block.contentFields.map((field) => field.key),
      compatibleSchemas: block.compatibleSchemas,
    })),
    styles: registry.styles.map((style) => style.id),
    animations: registry.animations.map((animation) => animation.id),
    media: registry.media.map((field) => ({
      id: field.id,
      variantKey: field.variantKey,
      required: field.required,
    })),
  };
};
