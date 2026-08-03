/**
 * Per-variant brand and media resolution for the render pipeline.
 *
 * Resolves placeholder values in brand settings and media URLs using
 * each variant's CSV data, so every row in a batch render can have
 * its own colours, logos, and images.
 */

import type {RenderTemplate, RenderVariant} from './renderer';
import {mediaFieldById, mediaFieldCapabilities} from '../../../src/shared/capabilities/media';
import {getAllMediaFieldIdsForComposition} from '../../../src/shared/capabilities/registry';
import {resolvePlaceholders} from '../../../src/shared/placeholders';
import {validateUrlLocally} from './mediaValidation';

/**
 * Build variant key → template prop map for a specific composition.
 * Includes generic media keys, legacy media keys, and brand colour keys.
 */
const buildVariantKeyMap = (compositionId: string): Record<string, string> => {
  const map: Record<string, string> = {
    brand_color: 'brandColor',
    secondary_color: 'secondaryColor',
    accent_color: 'accentColor',
    background_color: 'backgroundColor',
  };

  const mediaFieldIds = getAllMediaFieldIdsForComposition(compositionId);
  for (const fieldId of mediaFieldIds) {
    const field = mediaFieldCapabilities.find((candidate) => candidate.id === fieldId);
    if (!field) continue;

    map[field.variantKey] = field.templateProp;

    if (field.legacyVariantKeys) {
      for (const legacyKey of field.legacyVariantKeys) {
        map[legacyKey] = field.templateProp;
      }
    }
  }

  return map;
};

/**
 * Extract brand settings from variant data.
 * Returns a partial brand settings object with values from the variant,
 * falling back to the template's existing brand settings.
 */
export const extractVariantBrandSettings = (
  variant: RenderVariant,
  templateBrandSettings?: Record<string, unknown>,
  compositionId?: string,
): Record<string, unknown> => {
  const variantKeyMap = compositionId
    ? buildVariantKeyMap(compositionId)
    : {
        brand_color: 'brandColor',
        secondary_color: 'secondaryColor',
        accent_color: 'accentColor',
        background_color: 'backgroundColor',
      };
  const result: Record<string, unknown> = {...(templateBrandSettings ?? {})};

  for (const [variantKey, templateProp] of Object.entries(variantKeyMap)) {
    const value = variant[variantKey];
    if (value !== undefined && value !== '') {
      result[templateProp] = value;
    }
  }

  return result;
};

/**
 * Resolve placeholders in brand settings using variant data.
 * Handles both direct values and `{{placeholder}}` tokens.
 */
export const resolveBrandSettings = (
  brandSettings: Record<string, unknown>,
  variant: RenderVariant,
): Record<string, unknown> => {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(brandSettings)) {
    if (typeof value === 'string') {
      resolved[key] = resolvePlaceholders(value, variant, {missing: 'empty'});
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
};

/**
 * Build per-variant input props for a render.
 *
 * This is the main entry point for Phase 3 variant resolution:
 * 1. Extract brand/media values from variant CSV data
 * 2. Resolve placeholders in template brand settings
 * 3. Merge with template defaults
 * 4. Return resolved props ready for schema parsing
 *
 * Handles two template shapes:
 * - SceneBlockPlayer: brand/media values go into `brandSettings`
 * - Quick templates: brand/media values go to top-level props
 */
export const resolveVariantProps = (
  template: RenderTemplate,
  variant: RenderVariant,
  compositionId?: string,
): RenderTemplate => {
  // Extract per-variant brand/media values from CSV data
  const variantValues = extractVariantBrandSettings(variant, undefined, compositionId);

  // Check if this template uses brandSettings (SceneBlockPlayer) or top-level props (quick templates)
  const hasBrandSettings = template.brandSettings !== undefined;

  if (hasBrandSettings) {
    // SceneBlockPlayer: resolve into brandSettings
    const templateBrandSettings = (template.brandSettings as Record<string, unknown>) ?? {};
    const mergedBrandSettings = {...templateBrandSettings, ...variantValues};
    const resolvedBrandSettings = resolveBrandSettings(mergedBrandSettings, variant);

    return {
      ...template,
      brandSettings: resolvedBrandSettings,
      data: variant,
    };
  }

  // Quick templates: resolve brand/media values to top-level props
  // Also resolve any placeholder tokens in existing template props
  const resolved: RenderTemplate = {};
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === 'string') {
      resolved[key] = resolvePlaceholders(value, variant, {missing: 'empty'});
    } else {
      resolved[key] = value;
    }
  }

  // Apply variant brand/media values at top level
  Object.assign(resolved, variantValues);
  resolved.data = variant;

  return resolved;
};

/**
 * Validate a single variant's brand/media values.
 * Returns an array of error strings (empty if valid).
 * Uses the comprehensive URL validation from mediaValidation.ts.
 */
export const validateVariantMedia = async (
  variant: RenderVariant,
  templateMediaFieldIds: string[] = [],
): Promise<string[]> => {
  const errors: string[] = [];

  for (const fieldId of templateMediaFieldIds) {
    const field = mediaFieldById(fieldId);
    if (!field) continue;

    const variantKey = field.variantKey;
    const value = variant[field.variantKey]
      ?? field.legacyVariantKeys?.reduce<string | undefined>(
        (found, key) => found ?? variant[key],
        undefined,
      );

    if (!value || value === '') {
      if (field.required) {
        errors.push(`Missing required media field: ${field.label} (${variantKey})`);
      }
      continue;
    }

    // Use comprehensive URL validation from mediaValidation.ts
    const urlErrors = await validateUrlLocally(value);
    for (const err of urlErrors) {
      errors.push(`${field.label}: ${err}`);
    }
  }

  return errors;
};

/**
 * Validate all variants in a batch request.
 * Returns a map of variant index → error array.
 */
export const validateBatchVariants = async (
  variants: RenderVariant[],
  templateMediaFieldIds: string[] = [],
): Promise<Map<number, string[]>> => {
  const errors = new Map<number, string[]>();

  for (let i = 0; i < variants.length; i++) {
    const variantErrors = await validateVariantMedia(variants[i], templateMediaFieldIds);
    if (variantErrors.length > 0) {
      errors.set(i, variantErrors);
    }
  }

  return errors;
};
