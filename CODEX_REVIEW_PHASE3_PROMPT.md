# Codex Review Prompt — Phase 3 Commits 1-2

## Context

Vary.video Phase 3: Per-Variant Branding and Media. Two commits landed on `main`:

**Commit 1** (`be45b0f`): Shared metadata, schemas, and placeholder resolver
- `src/shared/capabilities/media.ts` — canonical media field definitions
- `src/shared/placeholders.ts` — unified placeholder resolver
- Extended types, schemas, registry, templates, blocks

**Commit 2** (`af16573`): Per-variant prop resolution and media validation
- `api/src/services/variantResolution.ts` — per-variant brand/media resolution
- Updated `makeInputProps` to resolve placeholders per variant
- Render route validates ALL variants for media errors
- SceneBlockPlayer schema accepts `imageTreatment` per block

## Task

Review the Phase 3 diff (from `4d2271e` to `af16573`). Check for:

1. **Correctness**: Does the per-variant resolution correctly map CSV columns to template props? Are there edge cases?
2. **Security**: Are URL validations sufficient? Any bypass vectors?
3. **Type safety**: Are the Zod schemas strict enough? Any `any` types leaking?
4. **Test coverage**: Are the tests comprehensive? Missing edge cases?
5. **Architecture**: Does the separation between shared/API/Remotion make sense?
6. **Performance**: Any concerns with resolving placeholders per variant in a large batch?

## Key files to review

- `src/shared/capabilities/media.ts` — media field definitions
- `src/shared/capabilities/schema.ts` — Zod schemas for media types
- `src/shared/placeholders.ts` — shared placeholder resolver
- `api/src/services/variantResolution.ts` — per-variant resolution
- `api/src/services/renderer.ts` — updated makeInputProps
- `api/src/routes/render.ts` — batch validation
- `src/compositions/SceneBlockPlayer/schema.ts` — image treatment field

## Output

Write your review to `CODEX_REVIEW_phase3_commits12.md` in the project root. Include:
- APPROVE or REQUEST_CHANGES
- List of findings (blocking vs non-blocking)
- Suggested improvements
