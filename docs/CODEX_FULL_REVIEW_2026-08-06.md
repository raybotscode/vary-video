# Codex Full Project Review — 2026-08-06

**Source:** Codex CLI deep inspection (135,187 tokens)
**Prompt:** Full project status review via `/tmp/vary-video-full-review.md`

## Executive Summary

The project is a working production app (v1) with a partially-built v2 visual editor on an uncommitted branch. The v1 batch render pipeline works end-to-end. The v2 editor has solid architecture (Zustand + command dispatcher) but has critical bugs in the bindable schema, tag ID generation, and editor transforms. The tree is not typecheck-clean — the uncommitted bindable work has created schema drift between TypeScript types, Zod schemas, and UI assumptions.

---

## What's Solid ✓

- **384 tests pass** (33 test files) — no regressions
- **5 Remotion templates** registered and renderable: InsuranceAd, ProductLaunch, RealEstate, SocialClip, WebinarPromo
- **WebinarPromo** template fully built (5 tests, schema, frontend wiring, API validation)
- **v2 editor architecture** — Zustand stores, 17 command types, history/undo, schema-driven property panels, clean separation of document/editor state
- **SceneBlockPlayer** — JSON-driven composition with 13 block types, 14 animations, 4 transitions
- **v1 features complete** — CSV/JSON import, multi-format, persistent SQLite jobs, AI template scoring, Pixabay browser, sample data, render retry, template gallery, mobile audit

---

## What's Incomplete / Broken ✗

### CRITICAL

1. **Root typecheck fails** — `scripts/render-csv-batch.ts:35` — `Record<string, string>` cast to `VariantRow` missing required fields
2. **Merge-tag binding IDs can be corrupted** — `migration.ts:231` — `migrateV2ToV3()` generates different IDs for keyToId vs stored merge tag
3. **Tag ID mismatch in create/bind flow** — `CreateTagInline` creates `tag.id` → `BindingSheet` dispatches `ADD_MERGE_TAG` without that ID → `commands.ts:276` lets Zod regenerate another ID
4. **v3 schema doesn't actually validate bindable props** — `bindable.ts` defines `BindableText`/`BindableValue`, but `document.ts:129` — textPropsSchema.content still requires plain strings
5. **Properties panel transforms can write `NaN`** — `PropertiesPanel.tsx:134` — `setTransform('x')` dispatches `SET_POSITION` with only `x`, but `commands.ts:151` expects both `x` AND `y`
6. **Template registry mismatch** — `templates.ts:130` includes Testimonial, EventPromo, YouTubeIntro but `src/Root.tsx` only registers 5 templates + SceneBlockPlayer

### MEDIUM

7. **Resize/rotate not committed to history** — pointer-up doesn't commit SET_SIZE/SET_ROTATION
8. **Stage zoom not applied** — Toolbar updates stageScale but Stage.tsx doesn't use it
9. **Duplicate merge stores** — mergeDataStore + old mergeStore both exist

### LOW

10. **v2 editor is test route** — `/v2-editor` not integrated into product flow

---

## Architecture Risks

- Schema drift: TS types, Zod schemas, migrations, and UI disagree on prop types
- Template truth surfaces: 6 different places define what templates exist, and they disagree
- Inline interaction code: drag/resize/rotate in Stage.tsx, not extracted/tested
- No v2→render bridge: editor documents can't be rendered by Remotion yet

---

## Bottom Line: Top 3 Actions

1. **Make the tree typecheck-clean and fix bindable schema/ID bugs**
2. **Resolve template registry mismatch** — implement or hide Testimonial/EventPromo/YouTubeIntro
3. **Finish core v2 editor interaction correctness** — transform commands, resize/rotate history, stage zoom
