/**
 * Per-variant brand and media resolution for the render pipeline.
 *
 * Resolves placeholder values in brand settings and media URLs using
 * each variant's CSV data, so every row in a batch render can have
 * its own colours, logos, and images.
 */

import type {RenderTemplate, RenderVariant} from './renderer';
import {mediaFieldById, MEDIA_FIELD_PROP_MAP} from '../../../src/shared/capabilities/media';
import {resolvePlaceholders} from '../../../src/shared/placeholders';

/**
 * Map of variant data keys to their resolved template prop names.
 * Used to extract brand/media values from variant CSV data.
 */
const VARIANT_KEY_TO_TEMPLATE_PROP: Record<string, string> = {
  brand_color: 'brandColor',
  secondary_color: 'secondaryColor',
  accent_color: 'accentColor',
  background_color: 'backgroundColor',
  logo_url: MEDIA_FIELD_PROP_MAP['logo'],
  background_image_url: MEDIA_FIELD_PROP_MAP['background-image'],
  property_image_url: MEDIA_FIELD_PROP_MAP['property-image'],
  product_image_url: MEDIA_FIELD_PROP_MAP['product-image'],
  agent_image_url: MEDIA_FIELD_PROP_MAP['agent-image'],
  speaker_image_url: MEDIA_FIELD_PROP_MAP['speaker-image'],
};

/**
 * Extract brand settings from variant data.
 * Returns a partial brand settings object with values from the variant,
 * falling back to the template's existing brand settings.
 */
export const extractVariantBrandSettings = (
  variant: RenderVariant,
  templateBrandSettings?: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {...(templateBrandSettings ?? {})};

  for (const [variantKey, templateProp] of Object.entries(VARIANT_KEY_TO_TEMPLATE_PROP)) {
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
 */
export const resolveVariantProps = (
  template: RenderTemplate,
  variant: RenderVariant,
): RenderTemplate => {
  // Get existing brand settings from template
  const templateBrandSettings = (template.brandSettings as Record<string, unknown>) ?? {};

  // Extract per-variant brand/media values from CSV data
  const variantBrandSettings = extractVariantBrandSettings(variant, templateBrandSettings);

  // Resolve any remaining placeholders in brand settings
  const resolvedBrandSettings = resolveBrandSettings(variantBrandSettings, variant);

  // Build resolved template
  return {
    ...template,
    brandSettings: resolvedBrandSettings,
    data: variant,
  };
};

/**
 * Validate a single variant's brand/media values.
 * Returns an array of error strings (empty if valid).
 */
export const validateVariantMedia = (
  variant: RenderVariant,
  templateMediaFieldIds: string[] = [],
): string[] => {
  const errors: string[] = [];

  for (const fieldId of templateMediaFieldIds) {
    const field = mediaFieldById(fieldId);
    if (!field) continue;

    const variantKey = field.variantKey;
    const value = variant[variantKey];

    if (!value || value === '') {
      if (field.required) {
        errors.push(`Missing required media field: ${field.label} (${variantKey})`);
      }
      continue;
    }

    // Validate URL scheme
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push(`${field.label}: invalid URL scheme '${url.protocol}' (must be http/https)`);
      }
      // Block localhost/private IPs
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
        errors.push(`${field.label}: localhost URLs are not allowed`);
      }
    } catch {
      errors.push(`${field.label}: invalid URL '${value}'`);
    }
  }

  return errors;
};

/**
 * Validate all variants in a batch request.
 * Returns a map of variant index → error array.
 */
export const validateBatchVariants = (
  variants: RenderVariant[],
  templateMediaFieldIds: string[] = [],
): Map<number, string[]> => {
  const errors = new Map<number, string[]>();

  for (let i = 0; i < variants.length; i++) {
    const variantErrors = validateVariantMedia(variants[i], templateMediaFieldIds);
    if (variantErrors.length > 0) {
      errors.set(i, variantErrors);
    }
  }

  return errors;
};
