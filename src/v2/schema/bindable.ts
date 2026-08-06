/**
 * V2 Bindable Value System — type-safe merge-tag property bindings.
 *
 * Replaces raw {{key}} strings with a discriminated union model:
 * - LiteralBinding<T>: fixed literal value
 * - TagBinding<T>: references a merge tag by stable tagId, with optional fallback
 *
 * BindableText is a tokenized text model for content properties that
 * mix literal text with merge tag references.
 *
 * Migration: v2 documents with raw {{key}} strings are auto-migrated to this
 * model on load via migrateV2ToV3 in migration.ts.
 */

import {z} from 'zod';

// ─── BindableValue<T> ──────────────────────────────────────────────

/** A property value that is either a literal constant or a tag reference. */
export type BindableValue<T = unknown> =
  | {_type: 'literal'; value: T}
  | {_type: 'tag'; tagId: string; fallback?: T};

// ─── BindableText (tokenized text content) ─────────────────────────

/** A single token in a BindableText sequence. */
export type TextToken =
  | {_type: 'literal'; id: string; text: string}
  | {_type: 'tag'; id: string; tagId: string; raw: string};

/** Tokenized text content — replaces raw {{key}} strings in text fields. */
export type BindableText = {
  _type: 'bindableText';
  tokens: TextToken[];
};

// ─── Token ID Generation ───────────────────────────────────────────

let _tokenCounter = 0;

/** Generate a unique token ID. */
export function tokenId(): string {
  return `tok-${Date.now().toString(36)}-${(_tokenCounter++).toString(36)}`;
}

/** Generate a stable tag ID. */
export function generateTagId(): string {
  return `tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Parsing ───────────────────────────────────────────────────────

/**
 * Parse a legacy "Hello {{name}}!" string into BindableText.
 * @param raw The raw string with {{key}} placeholders
 * @param tagMap Map of tag key → tag ID for resolving references
 */
export function parseBindableText(
  raw: string,
  tagMap: Map<string, string>,
): BindableText {
  const tokens: TextToken[] = [];
  const tagRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(raw)) !== null) {
    // Literal text before this tag
    if (match.index > lastIndex) {
      tokens.push({
        _type: 'literal',
        id: tokenId(),
        text: raw.slice(lastIndex, match.index),
      });
    }

    // Tag token
    const key = match[1];
    const tagId = tagMap.get(key) ?? `unknown:${key}`;
    tokens.push({
      _type: 'tag',
      id: tokenId(),
      tagId,
      raw: match[0],
    });

    lastIndex = tagRegex.lastIndex;
  }

  // Trailing literal text
  if (lastIndex < raw.length) {
    tokens.push({
      _type: 'literal',
      id: tokenId(),
      text: raw.slice(lastIndex),
    });
  }

  // If no tags found, wrap entire string as single literal token
  if (tokens.length === 0 && raw.length > 0) {
    tokens.push({_type: 'literal', id: tokenId(), text: raw});
  }

  // If completely empty, add one empty literal
  if (tokens.length === 0) {
    tokens.push({_type: 'literal', id: tokenId(), text: ''});
  }

  return {_type: 'bindableText', tokens};
}

// ─── Serialization ─────────────────────────────────────────────────

/** Serialize BindableText back to display string. */
export function serializeBindableText(bt: BindableText): string {
  return bt.tokens.map((t) => (t._type === 'literal' ? t.text : t.raw)).join('');
}

// ─── Resolution ────────────────────────────────────────────────────

/** Merge tag type definition (minimal, from document schema). */
export interface MergeTagMeta {
  id: string;
  key: string;
  type: string;
  defaultValue?: string;
}

/**
 * Resolve BindableText against data row values.
 * @param bt The tokenized text
 * @param tagValues Map of tagId → resolved value
 * @param mode 'preserve' keeps raw {{key}} for unresolved tags; 'empty' uses ''
 */
export function resolveBindableText(
  bt: BindableText,
  tagValues: Record<string, unknown>,
  mode: 'preserve' | 'empty' = 'preserve',
): string {
  return bt.tokens
    .map((t) => {
      if (t._type === 'literal') return t.text;
      const val = tagValues[t.tagId];
      if (val !== undefined && val !== null) {
        return String(val);
      }
      return mode === 'preserve' ? t.raw : '';
    })
    .join('');
}

/**
 * Resolve a single BindableValue<T> against tag values.
 */
export function resolveBindableValue<T>(
  bv: BindableValue<T>,
  tagValues: Record<string, unknown>,
  fallback?: T,
): T | undefined {
  if (bv._type === 'literal') return bv.value;
  const val = tagValues[bv.tagId];
  if (val !== undefined && val !== null) return val as T;
  return bv.fallback ?? fallback;
}

// ─── Utilities ─────────────────────────────────────────────────────

/** Check if a BindableValue is a tag binding. */
export function isTagBinding<T>(
  bv: BindableValue<T>,
): bv is {_type: 'tag'; tagId: string; fallback?: T} {
  return bv._type === 'tag';
}

/** Extract all tag IDs referenced in BindableText. */
export function extractBindableTagIds(bt: BindableText): string[] {
  const ids = new Set<string>();
  for (const t of bt.tokens) {
    if (t._type === 'tag') ids.add(t.tagId);
  }
  return Array.from(ids);
}

/** Get a display label for a BindableValue (for UI chips). */
export function getBindableDisplayValue(
  bv: BindableValue<unknown>,
  tags: MergeTagMeta[],
): string {
  if (bv._type === 'literal') return String(bv.value ?? '');
  const tag = tags.find((t) => t.id === bv.tagId);
  return tag ? `{{${tag.key}}}` : `{{unknown:${bv.tagId}}}`;
}

/** Create a literal bindable value. */
export function literal<T>(value: T): BindableValue<T> {
  return {_type: 'literal', value};
}

/** Create a tag bindable value. */
export function tagBinding<T>(tagId: string, fallback?: T): BindableValue<T> {
  return {_type: 'tag', tagId, fallback};
}

/** Create a simple literal BindableText from a plain string. */
export function literalText(text: string): BindableText {
  return parseBindableText(text, new Map());
}

// ─── Property Type Mapping ─────────────────────────────────────────

/** Map from property types to compatible merge tag types. */
export const PROPERTY_TYPE_TO_TAG_TYPES: Record<string, string[]> = {
  text: ['text', 'number', 'currency', 'date', 'url'],
  color: ['color'],
  number: ['number', 'currency'],
  image: ['image', 'url'],
  boolean: ['boolean'],
};

/** Check if a merge tag type is compatible with a property type. */
export function isTagTypeCompatible(
  propertyType: string,
  tagType: string,
): boolean {
  const compatible = PROPERTY_TYPE_TO_TAG_TYPES[propertyType];
  if (!compatible) return false;
  return compatible.includes(tagType);
}

// ─── Zod Schemas ───────────────────────────────────────────────────

export const literalValueSchema = z.object({
  _type: z.literal('literal'),
  value: z.unknown(),
});

export const tagValueSchema = z.object({
  _type: z.literal('tag'),
  tagId: z.string().min(1),
  fallback: z.unknown().optional(),
});

export const bindableValueSchema = z.discriminatedUnion('_type', [
  literalValueSchema,
  tagValueSchema,
]);

export const literalTokenSchema = z.object({
  _type: z.literal('literal'),
  id: z.string(),
  text: z.string(),
});

export const tagTokenSchema = z.object({
  _type: z.literal('tag'),
  id: z.string(),
  tagId: z.string(),
  raw: z.string(),
});

export const textTokenSchema = z.discriminatedUnion('_type', [
  literalTokenSchema,
  tagTokenSchema,
]);

export const bindableTextSchema = z.object({
  _type: z.literal('bindableText'),
  tokens: z.array(textTokenSchema),
});
