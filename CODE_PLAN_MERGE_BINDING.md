# Merge-Tag Property Binding System — Implementation Plan

**Date:** 2026-08-05  
**Status:** Plan only — no implementation  

---

## 0. Current State Summary

| Aspect | Current | Target |
|--------|---------|--------|
| Property values | Raw strings with inline `{{tagKey}}` | `BindableValue<T>` discriminated union (literal vs tag-ref) |
| MergeTag identity | `key` string is the identity | Stable `id: string` (UUID) + editable `key: string` |
| Tag resolution | Regex `/\{\{.*?\}\}/g` on strings | Token-parsed `BindableText` → resolves token-by-token |
| Tag CRUD | None (tags live in document.mergeTags array, no commands) | Full command set: ADD_MERGE_TAG, REMOVE_MERGE_TAG, UPDATE_MERGE_TAG |
| Data workspace | 3 tabs: Import / Rows / Tags | 6 tabs: Preview / Tags / Rows / Import / Mapping / Errors |
| Canvas toggle | None | Show Tags (highlight bound tokens) / Show Data (live preview) |
| Store | Single `mergeStore` with flat state | Split: `mergeDataStore` (runtime data) in editor, tag defs in document |

---

## 1. BindableValue<T> Model

### 1.1 Schema Location

**File:** `src/v2/schema/bindable.ts` (NEW)

```
src/v2/schema/
├── bindable.ts         ← NEW: BindableValue, BindableText, tokens
├── bindable.test.ts    ← NEW: unit tests
├── document.ts         ← MODIFY: element props become BindableValue<T>
├── migration.ts        ← MODIFY: v2→v3 migration
└── index.ts            ← MODIFY: re-export bindable types
```

### 1.2 Types

```typescript
// ─── BindableValue<T> ──────────────────────────────────────────
// A property value that is either a literal constant or a reference
// to a merge tag (with optional fallback).

export type BindableValue<T = string> =
  | { _type: 'literal'; value: T }
  | { _type: 'tag'; tagId: string; fallback?: T };

// ─── BindableText (for text content props) ─────────────────────
// A sequence of literal and tag tokens. Replaces raw {{key}} strings.
// Parsed from / serialized to a display string.

export type TextToken =
  | { _type: 'literal'; id: string; text: string }
  | { _type: 'tag'; id: string; tagId: string; raw: string }; // raw = "{{key}}"

export type BindableText = {
  _type: 'bindableText';
  tokens: TextToken[];
};

// ─── Token ID generation ───────────────────────────────────────
// Every token gets a stable ID so the UI can track it across edits.
export function tokenId(): string; // "tok-" + nanoid(8)
```

### 1.3 Zod Schemas

```typescript
import { z } from 'zod';

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
```

### 1.4 Parsing / Serialization

```typescript
// Parse a legacy "Hello {{name}}!" string into BindableText
export function parseBindableText(raw: string, tagMap: Map<string, string>): BindableText;

// Serialize BindableText back to a display string (for editors)
export function serializeBindableText(bt: BindableText): string;

// Resolve BindableText against a data row, producing final string
export function resolveBindableText(
  bt: BindableText,
  tagValues: Record<string, unknown>,
  tags: Map<string, MergeTag>,
  mode: 'preserve' | 'empty'
): string;

// Extract tag IDs referenced in BindableText
export function extractBindableTagIds(bt: BindableText): string[];

// Check if a BindableValue is bound (not literal)
export function isTagBinding<T>(bv: BindableValue<T>): bv is { _type: 'tag'; tagId: string; fallback?: T };

// Get display value of a BindableValue for UI
export function getDisplayValue<T>(bv: BindableValue<T>, tags: MergeTag[]): string;
```

### 1.5 How Element Props Change

Currently element props are flat:
```json
{ "content": "Hello {{name}}", "color": "#FF0000" }
```

They become:
```json
{
  "content": {
    "_type": "bindableText",
    "tokens": [
      { "_type": "literal", "id": "tok-abc", "text": "Hello " },
      { "_type": "tag", "id": "tok-def", "tagId": "tag-xyz", "raw": "{{name}}" }
    ]
  },
  "color": { "_type": "literal", "value": "#FF0000" }
}
```

Properties that support merge tags get `BindableValue<T>` or `BindableText`. Properties that don't stay literal. This is a schema migration — see section 11.

---

## 2. Tag Definitions with Stable IDs

### 2.1 Schema Changes

**File:** `src/v2/schema/document.ts` (MODIFY)

Current `MergeTag`:
```typescript
{ key: string; type: MergeTagType; label: string; defaultValue: string; required: boolean }
```

New `MergeTag` (add `id`):
```typescript
export const mergeTagSchema = z.object({
  id: z.string().min(1).max(50),                    // NEW: stable UUID
  key: z.string().min(1).max(50).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: mergeTagTypeSchema,
  label: z.string().max(100),
  defaultValue: z.string().default(''),
  required: z.boolean().default(false),
  description: z.string().max(500).default(''),     // NEW
  format: z.string().max(100).optional(),            // NEW (e.g., "YYYY-MM-DD" for dates)
});
export type MergeTag = z.infer<typeof mergeTagSchema>;
```

Key decisions:
- `id` is the stable identity, never changes
- `key` is user-editable display name for `{{key}}` syntax
- Tag references in BindableValue use `tagId` (the stable `id`)
- `description` and `format` are optional editor aids

### 2.2 ID Generation

**File:** `src/v2/schema/bindable.ts` — `function generateTagId(): string` returns `"tag-" + nanoid(10)`

---

## 3. Text Token Parsing / Serialization

### 3.1 Parser

**File:** `src/v2/schema/bindable.ts`

```
parseBindableText(raw: string, tagMap: Map<string, string>): BindableText
```

Algorithm:
1. Scan `raw` for `{{key}}` patterns using regex `/{{([a-zA-Z_][a-zA-Z0-9_]*)}}/g`
2. Split string into segments: `[literal, tag, literal, tag, ...]`
3. For each `{{key}}`, look up `tagMap` (key → tagId). If not found, create a pending reference (tagId = "unknown:" + key, flagged for resolution later)
4. Assign stable `id` to each token via `tokenId()`
5. Return `{ _type: 'bindableText', tokens }`

### 3.2 Serializer

```
serializeBindableText(bt: BindableText): string
```

Concatenates: literal tokens → `.text`, tag tokens → `.raw`

### 3.3 Resolver

```
resolveBindableText(bt, tagValues, tags, mode): string
```

For each token:
- literal → `.text`
- tag → look up `tagValues[tagId]`, apply type coercion from `tags.get(tagId)?.type`, fallback to `.raw` if mode='preserve', `''` if mode='empty'

### 3.4 Location

All in `src/v2/schema/bindable.ts`. The shared `placeholders.ts` becomes a legacy compatibility layer that wraps `resolveBindableText`.

---

## 4. Property Binding UI

### 4.1 Variable Icon → Bottom Sheet

**Files modified:**
- `web/src/v2/editor/panels/PropertiesPanel.tsx` — add binding button next to each merge-tag-capable property
- `web/src/v2/editor/panels/BindingSheet.tsx` (NEW) — bottom sheet for choosing binding mode

**Flow:**
1. Each property that supports merge tags (as defined in `PropertyMetadata.supportsMergeTags`) shows a small variable icon `{x}` next to the input
2. Tapping the icon opens a bottom sheet (`BindingSheet`)
3. The sheet has two tabs: **Fixed** (literal value) and **Tag** (bound to merge tag)
4. In **Fixed** mode: standard input control (same as today)
5. In **Tag** mode: dropdown/autocomplete of available merge tags, with type filter (only tags whose type matches the property type), plus optional fallback value input

### 4.2 BindingSheet Component

**File:** `web/src/v2/editor/panels/BindingSheet.tsx` (NEW)

Props:
```typescript
interface BindingSheetProps {
  propertyKey: string;
  propertyLabel: string;
  propertyType: 'text' | 'color' | 'number' | 'image';
  currentValue: BindableValue<unknown>;
  mergeTags: MergeTag[];
  onCommit: (value: BindableValue<unknown>) => void;
  onClose: () => void;
}
```

Internal state:
- `mode: 'fixed' | 'tag'`
- `selectedTagId: string | null`
- `fallbackValue: string`

Rendered as a `MobileSheet` or inline panel overlay.

### 4.3 Type-to-Tag-Type Mapping

```typescript
const PROPERTY_TYPE_TO_TAG_TYPES: Record<string, MergeTagType[]> = {
  text: ['text', 'number', 'currency', 'date', 'url'],
  color: ['color'],
  number: ['number', 'currency'],
  image: ['image', 'url'],
};
```

Only compatible tag types are shown in the dropdown.

---

## 5. Create-Tag Flow from Properties

### 5.1 Trigger

In the BindingSheet's Tag tab, if no suitable tag exists, show a "Create new tag" button.

### 5.2 Flow

1. User taps "Create new tag"
2. Inline form appears with fields: Key (auto-suggested from property name), Type (pre-filled from property type), Label, Default Value
3. On submit: dispatches `ADD_MERGE_TAG` command to document store
4. New tag's `id` is immediately available in the dropdown
5. The binding auto-selects the newly created tag

### 5.3 Files

- `web/src/v2/editor/panels/CreateTagInline.tsx` (NEW) — small inline form
- `web/src/v2/commands/types.ts` (MODIFY) — add `AddMergeTagCommand`, `RemoveMergeTagCommand`, `UpdateMergeTagCommand`
- `web/src/v2/commands/commands.ts` (MODIFY) — add handlers

---

## 6. Expanded Data Workspace

### 6.1 Current

`DataGallery.tsx` — 3 tabs: Import / Rows / Tags

### 6.2 Target

6 tabs: **Preview** / **Tags** / **Rows** / **Import** / **Mapping** / **Errors**

### 6.3 Tab Details

| Tab | Content | File |
|-----|---------|------|
| **Preview** | Live canvas preview with row selector, prev/next, "Show on canvas" toggle | `DataGallery.tsx` (inline) |
| **Tags** | CRUD list of merge tags with edit-in-place for key/type/label/default | `DataTagsTab.tsx` (NEW) |
| **Rows** | Variant cards grid (existing, move from current Rows tab) | `DataRowsTab.tsx` (NEW, extract) |
| **Import** | Drag-and-drop CSV/JSON + sample preview (existing, move) | `DataImportTab.tsx` (NEW, extract) |
| **Mapping** | Column-to-tag mapping matrix (existing, move from Import tab) | `DataMappingTab.tsx` (NEW, extract) |
| **Errors** | Validation error list grouped by row (existing errors, move) | `DataErrorsTab.tsx` (NEW) |

### 6.4 File Structure

```
web/src/v2/editor/galleries/
├── DataGallery.tsx              ← MODIFY: becomes tab orchestrator
├── DataPreviewTab.tsx           ← NEW
├── DataTagsTab.tsx              ← NEW
├── DataRowsTab.tsx              ← NEW (extracted from DataGallery)
├── DataImportTab.tsx            ← NEW (extracted from DataGallery)
├── DataMappingTab.tsx           ← NEW (extracted from DataGallery)
├── DataErrorsTab.tsx            ← NEW
├── FullScreenGallery.tsx        ← No change
└── ...
```

### 6.5 DataTagsTab Details

Each tag row shows:
- Tag icon (by type)
- `{{key}}` display (editable inline)
- Type badge (dropdown to change)
- Label (editable inline)
- Default value (editable inline)
- Required toggle
- Delete button (with confirmation)

This tab dispatches `UPDATE_MERGE_TAG` and `REMOVE_MERGE_TAG` commands.

---

## 7. Show Tags / Show Data Toggle

### 7.1 Editor Store State

**File:** `web/src/v2/stores/editorStore.ts` (MODIFY)

Add:
```typescript
// In EditorState interface:
showMergeTags: boolean;       // Highlight tag tokens on canvas
showMergeData: boolean;       // Resolve tags with preview row data
toggleShowMergeTags: () => void;
toggleShowMergeData: () => void;
```

### 7.2 Show Tags Mode

When `showMergeTags = true`:
- `ElementRenderer` passes a flag to `TextRenderer`
- `TextRenderer` renders tag tokens with a highlighted background (pale blue/yellow) and shows the tag key
- Non-text element props don't change visually but the properties panel shows binding info

Implementation:
- `useMergePreview` returns a `showTagHighlight` flag
- `TextRenderer` accepts `highlightTags?: boolean` prop
- Tag tokens get `<span style={highlightStyle}>` wrapper

### 7.3 Show Data Mode

When `showMergeData = true` and a preview row is selected:
- Same as current preview behavior (resolve tags)
- When `showMergeData = false`: always show raw tokens even if preview row selected

### 7.4 Toggle Location

- **Mobile:** `MobileTopBar` — two toggle buttons (👁 Tags, 📊 Data)
- **Desktop:** `EditorToolbar` — same two toggle buttons

**Files:**
- `web/src/v2/editor/toolbar/MobileTopBar.tsx` (MODIFY)
- `web/src/v2/editor/toolbar/EditorToolbar.tsx` (MODIFY)

---

## 8. Store Architecture

### 8.1 Decision: Split mergeStore

**Rationale:** The current `mergeStore` mixes two concerns:
1. **Runtime data** (rows, headers, column mapping, preview index, errors) — ephemeral, not persisted in document
2. **Tag definitions** (columns array synced from document.mergeTags) — should be document state

**Split:**

| Store | Concern | Location |
|-------|---------|----------|
| `documentStore.mergeTags` | Tag definitions (source of truth) | Already exists |
| `mergeDataStore` (rename) | Runtime CSV/JSON data, mapping, preview | `web/src/v2/stores/mergeDataStore.ts` (NEW) |

### 8.2 mergeDataStore Interface

**File:** `web/src/v2/stores/mergeDataStore.ts` (NEW, replaces mergeStore.ts)

```typescript
interface MergeDataState {
  rows: Record<string, string>[];
  headers: string[];
  columnMapping: Record<string, string>;  // csvHeader → tagId (was tag.key)
  previewRowIndex: number | null;
  importSource: 'csv' | 'json' | null;
  importFilename: string | null;
  errors: MergeError[];

  // Actions
  setRows: (rows: Record<string, string>[]) => void;
  setHeaders: (headers: string[]) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setPreviewRow: (index: number | null) => void;
  setImportMeta: (source: 'csv' | 'json' | null, filename: string | null) => void;
  setErrors: (errors: MergeError[]) => void;
  reset: () => void;

  // Resolution
  getResolvedRow: (rowIndex: number, tags: MergeTag[]) => Record<string, unknown>;
  getResolvedValue: (tagId: string, rowIndex: number, tags: MergeTag[]) => unknown;

  // Validation
  validate: (tags: MergeTag[]) => MergeError[];
}
```

Key change: `columnMapping` now maps `csvHeader → tagId` (string UUID) instead of `csvHeader → tag.key`. Resolution functions take `tags: MergeTag[]` from document store.

### 8.3 documentStore Changes

**File:** `web/src/v2/stores/documentStore.ts` (MODIFY)

Add merge tag commands to dispatch:
- `ADD_MERGE_TAG` — creates a tag with generated `id`, appends to `document.mergeTags`
- `REMOVE_MERGE_TAG` — removes by `id`, also cleans up any `BindableValue` references
- `UPDATE_MERGE_TAG` — updates `key`, `label`, `type`, `defaultValue`, `required`, `description`, `format` by `id`

These are handled in `applyCommand` (commands.ts).

### 8.4 Cleanup: Remove tag references on delete

When `REMOVE_MERGE_TAG` is dispatched:
1. Remove from `document.mergeTags`
2. Walk all scenes → all elements → all props
3. For each `BindableText`, remove tag tokens referencing the deleted tagId
4. For each `BindableValue` that is a tag binding to the deleted tagId, convert to literal with fallback value

This is a document-level operation in `applyCommand`.

---

## 9. Hooks and Utilities

### 9.1 New Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useBindableValue(prop, mergeTags)` | `web/src/v2/hooks/useBindableValue.ts` | Returns `{binding, displayValue, isTagBound, resolvedValue}` for a single BindableValue |
| `useMergePreview(element)` | `web/src/v2/hooks/useMergePreview.ts` | **MODIFY** — use token-based resolution instead of regex |
| `useMergeTags()` | `web/src/v2/hooks/useMergeTags.ts` | Returns `{tags, tagMap, addTag, removeTag, updateTag}` |
| `useShowMergeTags()` | `web/src/v2/hooks/useMergePreview.ts` | Returns `showMergeTags` boolean from editorStore |
| `useShowMergeData()` | `web/src/v2/hooks/useMergePreview.ts` | Returns `showMergeData` boolean from editorStore |
| `useTagAutocomplete(filter)` | `web/src/v2/hooks/useTagAutocomplete.ts` | Filtered tag list for autocomplete dropdowns |

### 9.2 Updated useMergePreview

```
web/src/v2/hooks/useMergePreview.ts (MODIFY)
```

Current: regex replaces `{{key}}` in string props.  
New: Checks if `showMergeData` is true. If yes, resolves `BindableText` tokens using `mergeDataStore.getResolvedRow()`. If no, returns serialized raw text.

```typescript
export function useMergePreview(element: V2Element): {
  resolvedProps: Record<string, unknown>;
  isPreviewActive: boolean;
  showTagHighlights: boolean;
}
```

### 9.3 Utility Functions

| Utility | File | Purpose |
|---------|------|---------|
| `resolveBindableText` | `src/v2/schema/bindable.ts` | Token-based resolution |
| `parseBindableText` | `src/v2/schema/bindable.ts` | Legacy string → BindableText |
| `serializeBindableText` | `src/v2/schema/bindable.ts` | BindableText → display string |
| `resolveBindableValue` | `src/v2/schema/bindable.ts` | Resolve single BindableValue |
| `extractReferencedTagIds` | `src/v2/schema/bindable.ts` | Walk document, find all tag IDs used |
| `migratePropsToBindable` | `src/v2/schema/migration.ts` | v2→v3 migration |
| `parseCSV`, `parseJSON` | Move to `web/src/v2/utils/parsers.ts` | Extracted from mergeStore |

---

## 10. Reusable Components

### 10.1 New Components

| Component | File | Purpose |
|-----------|------|---------|
| `BindingSheet` | `web/src/v2/editor/panels/BindingSheet.tsx` | Bottom sheet for Fixed/Tag mode selection |
| `TagAutocomplete` | `web/src/v2/components/TagAutocomplete.tsx` | Searchable dropdown of merge tags filtered by type |
| `TagToken` | `web/src/v2/components/TagToken.tsx` | Renders a single `{{key}}` token with optional highlight |
| `BindableTextDisplay` | `web/src/v2/components/BindableTextDisplay.tsx` | Renders BindableText as rich text with highlighted tag tokens |
| `TagTypeIcon` | `web/src/v2/components/TagTypeIcon.tsx` | Icon by merge tag type (Aa, #, 123, 🖼, etc.) |
| `TagTypeBadge` | `web/src/v2/components/TagTypeBadge.tsx` | Small colored badge showing tag type |
| `CreateTagInline` | `web/src/v2/editor/panels/CreateTagInline.tsx` | Inline form to create a tag from properties |
| `EditableTagKey` | `web/src/v2/components/EditableTagKey.tsx` | Inline editable tag key with validation |
| `MergeErrorList` | `web/src/v2/editor/galleries/DataErrorsTab.tsx` | Error rows grouped and filterable |

### 10.2 Component Locations

```
web/src/v2/
├── components/                     ← NEW directory
│   ├── TagAutocomplete.tsx
│   ├── TagToken.tsx
│   ├── BindableTextDisplay.tsx
│   ├── TagTypeIcon.tsx
│   ├── TagTypeBadge.tsx
│   └── EditableTagKey.tsx
├── editor/
│   ├── panels/
│   │   ├── BindingSheet.tsx        ← NEW
│   │   ├── CreateTagInline.tsx     ← NEW
│   │   ├── PropertiesPanel.tsx     ← MODIFY
│   │   └── MobileBottomPanel.tsx   ← MODIFY
│   └── galleries/
│       ├── DataGallery.tsx         ← MODIFY
│       ├── DataPreviewTab.tsx      ← NEW
│       ├── DataTagsTab.tsx         ← NEW
│       ├── DataRowsTab.tsx         ← NEW
│       ├── DataImportTab.tsx       ← NEW
│       ├── DataMappingTab.tsx      ← NEW
│       └── DataErrorsTab.tsx       ← NEW
```

---

## 11. Schema Migration Plan

### 11.1 Bump Schema Version

**File:** `src/v2/schema/document.ts`

```typescript
export const V2_DOCUMENT_VERSION = 3; // was 2
```

The `schemaVersion` literal in `v2DocumentSchema` becomes `z.literal(3)`.

### 11.2 Migration Function

**File:** `src/v2/schema/migration.ts` (MODIFY)

```typescript
export function migrateV2ToV3(doc: V2DocumentV2): V2DocumentV3
```

Step-by-step:
1. For each `mergeTag` without `id`, generate `id = "tag-" + nanoid(10)`
2. Add `description: ''` and `format: undefined` to each merge tag
3. Walk all scenes → elements → props
4. For each string property that has `supportsMergeTags` in its element definition:
   - If it contains `{{...}}` patterns, parse into `BindableText`
   - Tag tokens reference tag by `key` → look up tag `id` for `tagId`
   - If key not found in tags, create a new tag automatically (with warning)
   - If no `{{...}}` patterns, wrap as `{ _type: 'bindableText', tokens: [{ _type: 'literal', id: tokenId(), text: value }] }`
5. For non-merge-tag properties, keep as-is (or optionally wrap in literal)
6. Bump `schemaVersion` to 3

### 11.3 Validation Update

**File:** `src/v2/schema/document.ts` — the `v2DocumentSchema` (or renamed to `v3DocumentSchema`) must accept the new prop shapes. This means element prop schemas either:
- **Option A:** Loosen Zod validation for props (accept `unknown` and validate at runtime)
- **Option B:** Create separate V3 element schemas with `BindableValue` prop types

**Recommendation: Option A** — keep `props: z.record(z.string(), z.unknown())` for elements (already the case — the discriminated union schemas validate structure, not prop internals). Add a `validateBindableProps()` runtime check separate from Zod.

### 11.4 Backward Compatibility

- `resolvePlaceholders` in `src/shared/placeholders.ts` remains for Remotion renderer
- Renderer gets migrated to use `resolveBindableText` once v3 is stable
- Old v2 documents fail validation on `schemaVersion !== 3` — migration must run on load

### 11.5 Migration Entry Point

**File:** `web/src/v2/stores/documentStore.ts` — `loadDocument` function

```typescript
loadDocument: (doc: unknown) => {
  let validated: V2Document;
  if ((doc as any).schemaVersion === 2) {
    validated = migrateV2ToV3(doc as V2DocumentV2);
  } else {
    validated = validateDocument(doc);
  }
  // ... rest of loading
}
```

---

## 12. Test Plan

### 12.1 Unit Tests

| File | Tests |
|------|-------|
| `src/v2/schema/bindable.test.ts` | `parseBindableText` (plain, single tag, multiple tags, unknown tag, adjacent tags), `serializeBindableText` (round-trip), `resolveBindableText` (all types, missing values, preserve mode, empty mode), `tokenId` uniqueness |
| `src/v2/schema/schema.test.ts` | Updated validDocument with BindableText props, MergeTag with id, v3 schema validation, migration from v2→v3 |
| `src/v2/schema/migration.test.ts` | Migration: plain text, single tag, multiple tags, unknown tags → auto-create, color props, image src props |
| `web/src/v2/stores/mergeDataStore.test.ts` | CSV parsing, JSON parsing, column mapping with tag IDs, resolution with type coercion, validation |
| `web/src/v2/commands/commands.test.ts` | ADD_MERGE_TAG, REMOVE_MERGE_TAG (with cleanup), UPDATE_MERGE_TAG |

### 12.2 Integration Tests

| Test | Description |
|------|-------------|
| Bind text property → tag → verify canvas shows tag | Full flow through BindingSheet |
| Create tag from properties → verify appears in Data workspace | Create-tag flow |
| Import CSV → map columns to tags → preview row | Data import flow |
| Toggle Show Tags → verify tag highlighting | Canvas toggle |
| Toggle Show Data → verify resolution / raw display | Canvas toggle |
| Delete tag → verify all bindings cleaned up | Tag lifecycle |

### 12.3 Manual QA Checklist

- [ ] All 43 existing tests still pass after migration
- [ ] Open existing v2 document → auto-migrated to v3
- [ ] Create new text element → content is BindableText with `{{headline}}` tag token
- [ ] BindingSheet: switch between Fixed and Tag modes
- [ ] Create tag from properties persistent across reload
- [ ] Data workspace: all 6 tabs functional
- [ ] Column mapping works with tag IDs
- [ ] Show Tags highlights tokens on canvas
- [ ] Show Data toggles preview resolution
- [ ] Mobile and desktop layouts both work
- [ ] Undo/redo for tag CRUD operations

---

## 13. Commit Sequence

### Phase A: Schema Foundation (no UI changes)
```
Commit 1: Add bindable.ts with types, schemas, parse/serialize/resolve utilities
Commit 2: Add bindable.test.ts with comprehensive unit tests
Commit 3: Add id field to MergeTag schema, bump schemaVersion to 3
Commit 4: Add migrateV2ToV3 function with tests
Commit 5: Update document.ts exports, schema/index.ts
```

### Phase B: Store Architecture
```
Commit 6: Add merge tag commands (ADD/REMOVE/UPDATE_MERGE_TAG) to commands/types.ts
Commit 7: Add command handlers to commands/commands.ts (including tag cleanup on delete)
Commit 8: Create mergeDataStore.ts (extract from mergeStore, use tagId for mapping)
Commit 9: Update documentStore.ts loadDocument to run migration
Commit 10: Update mergeStore consumers to use mergeDataStore
Commit 11: Remove old mergeStore.ts
```

### Phase C: Hooks
```
Commit 12: Create useBindableValue.ts hook
Commit 13: Update useMergePreview.ts for token-based resolution + showMergeData toggle
Commit 14: Create useMergeTags.ts hook
Commit 15: Add showMergeTags/showMergeData to editorStore
```

### Phase D: Reusable Components
```
Commit 16: TagTypeIcon, TagTypeBadge
Commit 17: TagToken, BindableTextDisplay
Commit 18: TagAutocomplete
Commit 19: EditableTagKey
```

### Phase E: Binding UI
```
Commit 20: BindingSheet component
Commit 21: Update PropertiesPanel with variable icon + binding sheet integration
Commit 22: CreateTagInline component
Commit 23: Update MobileBottomPanel ContentPanel for BindableText
```

### Phase F: Data Workspace
```
Commit 24: DataPreviewTab
Commit 25: DataTagsTab (full CRUD)
Commit 26: DataRowsTab (extract)
Commit 27: DataImportTab (extract)
Commit 28: DataMappingTab (extract, use tagId)
Commit 29: DataErrorsTab
Commit 30: Refactor DataGallery to 6-tab orchestrator
```

### Phase G: Canvas Toggles
```
Commit 31: Show Tags toggle in MobileTopBar and EditorToolbar
Commit 32: Update TextRenderer for tag highlighting
Commit 33: Show Data toggle integration
```

### Phase H: Cleanup & Polish
```
Commit 34: Remove deprecated code (old placeholders regex in properties panel)
Commit 35: Update InlineTextEditor for BindableText
Commit 36: Final integration test pass, fix TS errors
Commit 37: Update README / documentation
```

---

## 14. Risks

### High Risk

| Risk | Mitigation |
|------|------------|
| **Schema migration breaks existing documents** | Run migration on load, not in-place. Keep v2 schema validation. Add extensive migration tests with real-world document samples. |
| **Performance regression with token-based resolution** | Token resolution is O(n) per text field. Cache resolved values per row. Measure before/after. |
| **Complexity of BindableValue<T> in Zod** | Keep element props loosely typed (`z.record(z.string(), z.unknown())`). Add runtime type guards for BindableValue. Zod validates document structure, not prop internals. |
| **Breaking Remotion renderer** | Keep `resolvePlaceholders` as legacy API. Update renderer in a separate phase once v3 is stable. |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| **Tag ID stability across copy/paste** | When duplicating element, clone tokens with new token IDs but keep same tag IDs. Tag IDs are document-global. |
| **User confusion with two IDs (token id vs tag id)** | Token IDs are internal (never shown). Tag IDs are internal (never shown). Only `{{key}}` is user-visible. |
| **InlineTextEditor with BindableText** | contentEditable div returns plain text. On commit, run `parseBindableText` to re-tokenize. Preserve existing tag references by matching keys. |
| **Undo/redo for tag deletion with bindable cleanup** | The REMOVE_MERGE_TAG command must walk all elements and convert tag bindings to literals. This is a bulk document mutation — snapshot entire document before/after. |

### Low Risk

| Risk | Mitigation |
|------|------------|
| **Column mapping with tagId vs tag key** | Migration: old column mapping (csvHeader → tag.key) is converted to (csvHeader → tag.id) by looking up key→id. |
| **Mobile performance with 6 data tabs** | Tabs are lazy-rendered. Only active tab's content is mounted. |
| **Duplicate tag keys** | Validation: `ADD_MERGE_TAG` and `UPDATE_MERGE_TAG` check for duplicate keys. Frontend validation + Zod refinement. |

---

## Appendix: File Change Summary

### New Files (25)

```
src/v2/schema/bindable.ts
src/v2/schema/bindable.test.ts
web/src/v2/stores/mergeDataStore.ts
web/src/v2/hooks/useBindableValue.ts
web/src/v2/hooks/useMergeTags.ts
web/src/v2/hooks/useTagAutocomplete.ts
web/src/v2/components/TagAutocomplete.tsx
web/src/v2/components/TagToken.tsx
web/src/v2/components/BindableTextDisplay.tsx
web/src/v2/components/TagTypeIcon.tsx
web/src/v2/components/TagTypeBadge.tsx
web/src/v2/components/EditableTagKey.tsx
web/src/v2/editor/panels/BindingSheet.tsx
web/src/v2/editor/panels/CreateTagInline.tsx
web/src/v2/editor/galleries/DataPreviewTab.tsx
web/src/v2/editor/galleries/DataTagsTab.tsx
web/src/v2/editor/galleries/DataRowsTab.tsx
web/src/v2/editor/galleries/DataImportTab.tsx
web/src/v2/editor/galleries/DataMappingTab.tsx
web/src/v2/editor/galleries/DataErrorsTab.tsx
web/src/v2/stores/mergeDataStore.test.ts
web/src/v2/commands/commands.mergeTag.test.ts
src/v2/schema/migration.test.ts
web/src/v2/utils/parsers.ts
web/src/v2/utils/parsers.test.ts
```

### Modified Files (15)

```
src/v2/schema/document.ts              — add id to MergeTag, bump version, add v3 schema
src/v2/schema/migration.ts             — add migrateV2ToV3
src/v2/schema/index.ts                 — re-export bindable types
src/shared/placeholders.ts             — add deprecated notice / compat wrapper
web/src/v2/stores/documentStore.ts     — add merge tag dispatch cases, migration on load
web/src/v2/stores/editorStore.ts       — add showMergeTags, showMergeData
web/src/v2/commands/types.ts           — add ADD/REMOVE/UPDATE_MERGE_TAG
web/src/v2/commands/commands.ts        — add merge tag handlers
web/src/v2/hooks/useMergePreview.ts    — token-based resolution
web/src/v2/editor/ElementRenderer.tsx  — pass highlight flags
web/src/v2/editor/Editor.tsx           — pass mergeDataStore
web/src/v2/editor/panels/PropertiesPanel.tsx — binding icon + sheet integration
web/src/v2/editor/panels/MobileBottomPanel.tsx — BindableText-aware ContentPanel
web/src/v2/editor/toolbar/MobileTopBar.tsx — add Show Tags/Data toggles
web/src/v2/editor/toolbar/EditorToolbar.tsx — add Show Tags/Data toggles
web/src/v2/editor/renderers/TextRenderer.tsx — tag highlighting
web/src/v2/editor/renderers/InlineTextEditor.tsx — BindableText re-parse on commit
web/src/v2/index.ts                    — export new hooks/components
```

### Deleted Files (1)

```
web/src/v2/stores/mergeStore.ts        — replaced by mergeDataStore.ts
```
