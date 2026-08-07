import {z} from 'zod';
import {getAllTemplates, getSchemaForTemplate} from '../../../src/templates/registry';

/**
 * Composition ids accepted by the render API.
 * Derived from the template registry plus the special-cased SceneBlockPlayer
 * (handled by getSchemaForTemplate in src/templates/registry.ts).
 */
export const knownCompositionIds = [
  ...getAllTemplates().map((template) => template.id),
  'SceneBlockPlayer',
  'V2Native',
];

export const isKnownCompositionId = (id: string): boolean =>
  knownCompositionIds.includes(id);

export const compositionIdSchema = z
  .string()
  .refine(isKnownCompositionId, {message: 'Unknown composition id'});

/**
 * Validates template props against the selected composition's zod schema.
 * Mirrors the renderer's makeInputProps behaviour (template + variant data),
 * so invalid shapes fail synchronously with a 400 instead of async job failure.
 */
export const validateTemplateForComposition = (
  compositionId: string,
  template: Record<string, unknown>,
  variantData: Record<string, string>,
): {success: true} | {success: false; error: z.ZodError} => {
  const result = getSchemaForTemplate(compositionId).safeParse({
    ...template,
    data: variantData,
  });

  if (result.success) {
    return {success: true};
  }

  return {success: false, error: result.error};
};
