/**
 * Shared placeholder parser/resolver for both frontend and Remotion renderer.
 *
 * Frontend uses `missing: 'preserve'` so unresolved tokens stay visible in UI.
 * Renderer uses `missing: 'empty'` so missing values produce empty strings.
 *
 * This is the canonical implementation — `web/src/utils/placeholder.ts` and
 * `src/components/util.ts` should import from here rather than duplicating.
 */

export type PlaceholderData = Record<string, string>;
export type PlaceholderMissingMode = 'preserve' | 'empty';

/**
 * Resolve `{{key}}` placeholders in a string using the provided data map.
 *
 * @param value — template string containing `{{key}}` tokens
 * @param data — key/value map from variant row
 * @param options.missing — `'preserve'` keeps `{{key}}` as-is (frontend),
 *   `'empty'` replaces with `''` (renderer). Default: `'preserve'`.
 */
export const resolvePlaceholders = (
  value: string,
  data: PlaceholderData,
  options?: {missing?: PlaceholderMissingMode},
): string => {
  const missingMode = options?.missing ?? 'preserve';
  return value.replace(/\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    if (key in data) {
      return data[key];
    }
    return missingMode === 'empty' ? '' : `{{${key}}}`;
  });
};

/**
 * Resolve placeholders in multiple named fields of an object.
 * Returns a new object with the specified fields resolved.
 *
 * @param input — source object (e.g. brand settings, block content)
 * @param data — variant row data
 * @param fieldNames — which fields to resolve
 * @param options.missing — `'preserve'` or `'empty'`
 */
export const resolvePlaceholderFields = <T extends Record<string, unknown>>(
  input: T,
  data: PlaceholderData,
  fieldNames: string[],
  options?: {missing?: PlaceholderMissingMode},
): T => {
  const result = {...input};
  for (const fieldName of fieldNames) {
    const value = input[fieldName];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[fieldName] = resolvePlaceholders(value, data, options);
    }
  }
  return result;
};

/**
 * Extract all `{{key}}` placeholder keys from a string.
 */
export const extractPlaceholders = (value: string): string[] => {
  const matches = value.match(/\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g);
  if (!matches) return [];
  return [...new Set(
    matches.map((match) => {
      const inner = match.slice(2, -2);
      return inner.trim();
    }),
  )];
};

/**
 * Extract placeholder keys from multiple fields of an object.
 */
export const extractPlaceholdersFromFields = <T extends Record<string, unknown>>(
  input: T,
  fieldNames: string[],
): string[] => {
  const keys = new Set<string>();
  for (const fieldName of fieldNames) {
    const value = input[fieldName];
    if (typeof value === 'string') {
      for (const key of extractPlaceholders(value)) {
        keys.add(key);
      }
    }
  }
  return [...keys];
};

/**
 * Resolve placeholders in all string values of an object.
 * Useful for brand settings where every field may contain placeholders.
 */
export const resolveAllPlaceholders = (
  input: Record<string, unknown>,
  data: PlaceholderData,
  options?: {missing?: PlaceholderMissingMode},
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      result[key] = resolvePlaceholders(value, data, options);
    } else {
      result[key] = value;
    }
  }
  return result;
};
