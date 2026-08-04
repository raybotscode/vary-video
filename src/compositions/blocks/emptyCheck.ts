/**
 * Utility to check whether a scene block's essential content fields resolve
 * to empty strings. Used by SceneBlockPlayer for graceful CSV defaults:
 * when a CSV variant is missing data for a block's essential fields, the
 * block is hidden rather than rendered as a blank rectangle.
 *
 * This file is intentionally kept separate from `registry.ts` to avoid
 * circular dependencies with the template/Schema chain.
 */

import {blockCapabilities} from '../../shared/capabilities/blocks';
import {resolvePlaceholders} from '../../shared/placeholders';

/**
 * Check whether a block's essential content fields resolve to empty strings.
 *
 * @param blockId — the block type id (e.g. 'text-overlay', 'media-image')
 * @param content — the merged content object (defaultContent + block overrides)
 * @param data — the CSV variant data for placeholder resolution
 * @returns `true` if the block should be hidden (all essential fields empty)
 */
export function isBlockContentEmpty(
  blockId: string,
  content: Record<string, string>,
  data: Record<string, string>,
): boolean {
  const capability = blockCapabilities.find((b) => b.id === blockId);
  if (!capability) return false;

  const essentialFields = capability.contentFields.filter((f) => f.essential);
  if (essentialFields.length === 0) return false;

  return essentialFields.every((field) => {
    const template = content[field.key] ?? field.placeholder ?? '';
    if (!template) return true;

    const resolved = resolvePlaceholders(template, data, {missing: 'empty'});
    return resolved.trim() === '';
  });
}
