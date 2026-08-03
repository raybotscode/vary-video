/**
 * Frontend adapter over shared media capability metadata.
 *
 * Builds template-specific editable media columns and default row values
 * for the variant editor.
 */

import {mediaFieldById, mediaFieldsForTemplate} from '@vary/shared/capabilities/media';
import type {MediaFieldCapability} from '@vary/shared/capabilities/media';
import type {ImageTreatment} from '@vary/shared/capabilities/types';

export type MediaColumnInfo = {
  id: string;
  label: string;
  kind: MediaFieldCapability['kind'];
  variantKey: string;
  templateProp: string;
  required: boolean;
  defaultValue: string;
};

/**
 * Get the media columns for a template, suitable for rendering in the
 * variant editor table.
 */
export const getMediaColumnsForTemplate = (
  templateMediaFieldIds: string[] = [],
): MediaColumnInfo[] => {
  const fields = mediaFieldsForTemplate(templateMediaFieldIds);
  return fields.map((field) => ({
    id: field.id,
    label: field.label,
    kind: field.kind,
    variantKey: field.variantKey,
    templateProp: field.templateProp,
    required: field.required,
    defaultValue: '',
  }));
};

/**
 * Build default variant row values for media fields.
 * Returns an object with empty strings for all media variant keys.
 */
export const getDefaultMediaValues = (
  templateMediaFieldIds: string[] = [],
): Record<string, string> => {
  const fields = mediaFieldsForTemplate(templateMediaFieldIds);
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.variantKey] = '';
  }
  return values;
};

/**
 * Get the default image treatment for a media field.
 */
export const getDefaultTreatmentForField = (
  fieldId: string,
): ImageTreatment => {
  const field = mediaFieldById(fieldId);
  return field?.defaultTreatment ?? {
    fit: 'cover',
    horizontalPosition: 'center',
    verticalPosition: 'center',
  };
};

/**
 * Check if a variant row has any media values set.
 */
export const hasMediaValues = (
  variant: Record<string, string>,
  templateMediaFieldIds: string[] = [],
): boolean => {
  const fields = mediaFieldsForTemplate(templateMediaFieldIds);
  return fields.some((field) => {
    const value = variant[field.variantKey];
    return value !== undefined && value !== '';
  });
};

/**
 * Validate a single media URL value (client-side, fast).
 * Returns an error string or null if valid.
 */
export const validateMediaUrlClient = (url: string): string | null => {
  if (!url || url === '') return null;

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return `Invalid URL scheme '${parsed.protocol}' — must be http or https`;
    }
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return 'Localhost URLs are not allowed';
    }
    return null;
  } catch {
    return `Invalid URL: '${url}'`;
  }
};
