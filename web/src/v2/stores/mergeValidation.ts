/**
 * Pre-export Merge Tag Validation
 *
 * Pure function that scans a V2Document for all merge tag references,
 * cross-references against imported CSV/JSON data, and returns
 * human-readable warnings for any mismatch.
 *
 * Called from the export panel BEFORE the user clicks Export.
 */

import type {V2Document, MergeTag, V2Scene, V2Element} from '@vary/v2/schema/document';

// ─── Types ─────────────────────────────────────────────────────────

export type MergeTagSeverity = 'warning' | 'error';
export type MergeTagWarningType =
  | 'missing_column'
  | 'case_mismatch'
  | 'empty_column'
  | 'dangling_tag'
  | 'missing_tag_definition';

export interface MergeTagWarning {
  type: MergeTagWarningType;
  severity: MergeTagSeverity;
  tagKey: string;           // the tag key referenced in the document (e.g. "Title")
  tagId: string;            // the stable tag ID (or "unknown:<key>" if not in mergeTags)
  message: string;           // human-readable warning message
  suggestion?: string;       // optional fix hint
  affectedElements?: string[]; // element names containing this tag
}

export interface ValidationState {
  rows: Record<string, string>[];
  headers: string[];                    // CSV column headers (original casing)
  columnMapping: Record<string, string>; // CSV header → tagId
}

// ─── Extraction Helpers ────────────────────────────────────────────

interface TagRef {
  tagKey: string;    // extracted from {{key}} or tag token
  tagId: string;     // resolved from document mergeTags or "unknown:<key>"
  elementName: string;
  propName: string;
}

/**
 * Extract all merge tag references from every element in every scene.
 */
function extractTagReferences(doc: V2Document): TagRef[] {
  const refs: TagRef[] = [];
  const tagMap = buildTagMap(doc.mergeTags ?? []);

  for (const scene of doc.scenes) {
    for (const element of scene.elements) {
      extractFromElement(element, tagMap, refs);
    }
  }

  return refs;
}

/** Build tagKey → tagId lookup from the document's merge tags. */
function buildTagMap(tags: MergeTag[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of tags) {
    map.set(tag.key, tag.id);
    // Also map lowercase for fuzzy lookup
    map.set(tag.key.toLowerCase(), tag.id);
  }
  return map;
}

/** Scan a single element's props for tag references. */
function extractFromElement(
  element: V2Element,
  tagMap: Map<string, string>,
  refs: TagRef[],
): void {
  const props = element.props as Record<string, unknown>;
  const elName = element.name || element.id;

  for (const [propName, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;

    // BindableText: _type === 'bindableText' with tokens[]
    if (isPlainObject(value) && (value as any)._type === 'bindableText') {
      const tokens = (value as any).tokens;
      if (Array.isArray(tokens)) {
        for (const token of tokens) {
          if (token._type === 'tag' && token.tagId) {
            const tagKey = token.raw
              ? token.raw.replace(/^\{\{|\}\}$/g, '')
              : token.tagId;
            refs.push({
              tagKey,
              tagId: token.tagId,
              elementName: elName,
              propName,
            });
          }
        }
      }
      continue;
    }

    // BindableValue: _type === 'tag' with tagId
    if (isPlainObject(value) && (value as any)._type === 'tag') {
      const tagId = (value as any).tagId as string;
      if (tagId) {
        // Find tagKey from the document's mergeTags
        const tagKey = resolveTagKey(tagId, tagMap);
        refs.push({tagKey, tagId, elementName: elName, propName});
      }
      continue;
    }

    // Plain string with {{key}} patterns
    if (typeof value === 'string') {
      const tagRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
      let match: RegExpExecArray | null;
      while ((match = tagRegex.exec(value)) !== null) {
        const key = match[1];
        const tagId = tagMap.get(key) ?? `unknown:${key}`;
        refs.push({tagKey: key, tagId, elementName: elName, propName});
      }
    }
  }
}

function resolveTagKey(tagId: string, tagMap: Map<string, string>): string {
  // If tagId starts with "unknown:", extract the key
  if (tagId.startsWith('unknown:')) return tagId.slice(8);
  // Try to find the key by reverse lookup
  for (const [key, id] of tagMap) {
    if (id === tagId && key === key.toLowerCase()) return key;
  }
  return tagId;
}

function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ─── Main Validation ───────────────────────────────────────────────

/**
 * Validate that all merge tags referenced in a V2Document have matching
 * CSV columns and that the data is coherent.
 *
 * Returns an array of warnings (empty = all good).
 */
export function validateMergeTagCoverage(
  doc: V2Document,
  state: ValidationState,
): MergeTagWarning[] {
  const warnings: MergeTagWarning[] = [];

  // No merge data → no warnings (user hasn't imported anything yet)
  if (!state.rows || state.rows.length === 0) return [];

  const tags = doc.mergeTags ?? [];
  const tagById = new Map<string, MergeTag>();
  for (const tag of tags) {
    tagById.set(tag.id, tag);
  }

  // Build CSV column info
  const csvColumns = state.headers ?? [];
  const csvColumnsLower = new Set(csvColumns.map((c) => c.toLowerCase()));

  // Build reverse mapping: tagId → csv header
  const tagToColumn = new Map<string, string>();
  for (const [header, tagId] of Object.entries(state.columnMapping ?? {})) {
    tagToColumn.set(tagId, header);
  }

  // Extract all tag references from the document
  const refs = extractTagReferences(doc);

  // Deduplicate by tagId
  const uniqueByTagId = new Map<string, TagRef[]>();
  for (const ref of refs) {
    const existing = uniqueByTagId.get(ref.tagId) || [];
    existing.push(ref);
    uniqueByTagId.set(ref.tagId, existing);
  }

  for (const [tagId, tagRefs] of uniqueByTagId) {
    const firstRef = tagRefs[0];
    const tagKey = firstRef.tagKey;

    // Check: dangling tag (not in document's mergeTags)
    const mergeTag = tagById.get(tagId);
    if (!mergeTag) {
      warnings.push({
        type: 'dangling_tag',
        severity: 'error',
        tagKey,
        tagId,
        message: `Tag "{{${tagKey}}}" is referenced but not defined in the document's merge tags.`,
        suggestion: `Create a merge tag for "${tagKey}" or remove this reference.`,
        affectedElements: tagRefs.map((r) => r.elementName),
      });
      continue;
    }

    // The canonical key from the merge tag definition
    const canonicalKey = mergeTag.key;

    // Check: is there a CSV column mapped to this tag?
    const csvHeader = tagToColumn.get(tagId);

    if (!csvHeader) {
      // No column mapped — check if there's a case-insensitive match
      const caseMatch = csvColumns.find(
        (c) => c.toLowerCase() === canonicalKey.toLowerCase() && c !== canonicalKey,
      );

      if (caseMatch) {
        warnings.push({
          type: 'case_mismatch',
          severity: 'warning',
          tagKey: canonicalKey,
          tagId,
          message: `Tag "{{${canonicalKey}}}" matches CSV column "${caseMatch}" but the casing differs.`,
          suggestion: `Rename the CSV column to "${canonicalKey}" or update the tag key to "${caseMatch}".`,
          affectedElements: tagRefs.map((r) => r.elementName),
        });
        continue;
      }

      // No match at all — the tag may still resolve via direct key lookup
      // (e.g. CSV column name happens to match the tag key)
      if (!csvColumnsLower.has(canonicalKey.toLowerCase())) {
        warnings.push({
          type: 'missing_column',
          severity: 'warning',
          tagKey: canonicalKey,
          tagId,
          message: `Tag "{{${canonicalKey}}}" has no matching column in the imported data.`,
          suggestion: `Add a column named "${canonicalKey}" to your CSV/JSON or remove this tag from the template.`,
          affectedElements: tagRefs.map((r) => r.elementName),
        });
        continue;
      }
    }

    // Check: empty values for ALL rows in the selected data
    if (csvHeader) {
      const allEmpty = state.rows.every(
        (row) => !row[csvHeader] || row[csvHeader].trim() === '',
      );
      if (allEmpty && mergeTag.required) {
        warnings.push({
          type: 'empty_column',
          severity: 'error',
          tagKey: canonicalKey,
          tagId,
          message: `Required tag "{{${canonicalKey}}}" (column "${csvHeader}") has empty values for all rows.`,
          suggestion: `Populate the "${csvHeader}" column with data or unmark this tag as required.`,
          affectedElements: tagRefs.map((r) => r.elementName),
        });
      } else if (allEmpty) {
        warnings.push({
          type: 'empty_column',
          severity: 'warning',
          tagKey: canonicalKey,
          tagId,
          message: `Tag "{{${canonicalKey}}}" (column "${csvHeader}") has empty values for all rows. Videos will use default values.`,
          affectedElements: tagRefs.map((r) => r.elementName),
        });
      }
    }
  }

  // Bonus: check for spelling variants across tag keys
  warnings.push(...findSpellingVariants(refs));

  // Sort: errors first, then warnings
  warnings.sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') return -1;
    if (b.severity === 'error' && a.severity !== 'error') return 1;
    return a.tagKey.localeCompare(b.tagKey);
  });

  return warnings;
}

// ─── Spelling Variant Detection ────────────────────────────────────

function findSpellingVariants(refs: TagRef[]): MergeTagWarning[] {
  const warnings: MergeTagWarning[] = [];

  // Group refs by tagKey (case-insensitive)
  const byLowerKey = new Map<string, TagRef[]>();
  for (const ref of refs) {
    const lower = ref.tagKey.toLowerCase();
    const existing = byLowerKey.get(lower) || [];
    existing.push(ref);
    byLowerKey.set(lower, existing);
  }

  // Check each group for case variants
  for (const [, group] of byLowerKey) {
    const uniqueCasings = new Set(group.map((r) => r.tagKey));
    if (uniqueCasings.size > 1) {
      // Multiple casings of "the same" key
      const variants = Array.from(uniqueCasings);
      const mostCommon = variants.sort(
        (a, b) =>
          group.filter((r) => r.tagKey === b).length -
          group.filter((r) => r.tagKey === a).length,
      )[0];

      for (const variant of variants) {
        if (variant !== mostCommon) {
          const variantRefs = group.filter((r) => r.tagKey === variant);
          warnings.push({
            type: 'case_mismatch',
            severity: 'warning',
            tagKey: variant,
            tagId: variantRefs[0].tagId,
            message: `Tag "{{${variant}}}" is a different casing from "{{${mostCommon}}}". This may be a typo.`,
            suggestion: `Standardize to "{{${mostCommon}}}" across all elements.`,
            affectedElements: variantRefs.map((r) => r.elementName),
          });
        }
      }
    }
  }

  // Check for close-but-different keys (Levenshtein distance 1)
  const allKeys = Array.from(new Set(refs.map((r) => r.tagKey)));
  for (let i = 0; i < allKeys.length; i++) {
    for (let j = i + 1; j < allKeys.length; j++) {
      if (levenshtein(allKeys[i], allKeys[j]) <= 1 && 
          allKeys[i].toLowerCase() !== allKeys[j].toLowerCase()) {
        const keyRefs = refs.filter((r) => r.tagKey === allKeys[j]);
        warnings.push({
          type: 'dangling_tag',
          severity: 'warning',
          tagKey: allKeys[j],
          tagId: keyRefs[0]?.tagId ?? `unknown:${allKeys[j]}`,
          message: `Tag "{{${allKeys[j]}}}" is very close to "{{${allKeys[i]}}}". Possible typo?`,
          suggestion: `Check if this should be "{{${allKeys[i]}}}" instead.`,
          affectedElements: keyRefs.map((r) => r.elementName),
        });
      }
    }
  }

  return warnings;
}

// ─── Levenshtein Distance ──────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({length: m + 1}, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Quick check: returns true if there are any warnings at all.
 * Use this to show a badge on the Export button.
 */
export function hasValidationWarnings(warnings: MergeTagWarning[]): boolean {
  return warnings.length > 0;
}

/**
 * Count warnings by severity.
 */
export function countWarnings(
  warnings: MergeTagWarning[],
): {errors: number; warnings: number} {
  return {
    errors: warnings.filter((w) => w.severity === 'error').length,
    warnings: warnings.filter((w) => w.severity === 'warning').length,
  };
}
