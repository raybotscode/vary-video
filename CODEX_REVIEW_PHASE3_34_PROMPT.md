# Codex Review Prompt — Phase 3 Commits 3-4

## Context

Vary.video Phase 3: Per-Variant Branding and Media. Two more commits landed on `main`:

**Commit 3** (`af16573`): API media validation with remote probing
- `api/src/services/mediaValidation.ts` — URL validation with local checks + HTTP HEAD probing
- `api/src/routes/v1/media.ts` — three endpoints (validate, validate-batch, accepted-types)
- Comprehensive SSRF protection (private IPs, IPv6, redirects, protocol downgrade)

**Commit 4** (`af16573`): Remotion image rendering with treatment controls
- `src/compositions/media/treatment.ts` — pure CSS helpers for image treatment
- `src/compositions/media/ResponsiveImage.tsx` — shared image renderer
- `src/compositions/blocks/ImageBlock.tsx` — media-image block renderer
- Block renderers now receive `imageTreatment` prop

Also: Codex review of Commits 1-2 fixed (resolution for quick templates, server-side media field derivation, SSRF protection, block safety).

## Task

Review the diff from `4d2271e` (Phase 2 merge) to HEAD. Check for:
1. Security: Are URL validations comprehensive? Any SSRF bypasses?
2. Rendering: Does the image treatment system work correctly?
3. Architecture: Is the media/ResponsiveImage pattern clean?
4. Test coverage: Are treatment tests sufficient?
5. Integration: Do all the pieces fit together?

## Key files to review
- `api/src/services/mediaValidation.ts` — URL validation
- `api/src/routes/v1/media.ts` — API endpoints
- `src/compositions/media/treatment.ts` — CSS helpers
- `src/compositions/media/ResponsiveImage.tsx` — image renderer
- `src/compositions/blocks/ImageBlock.tsx` — block renderer
- `src/compositions/blocks/registry.ts` — BlockRenderProps with imageTreatment

## Output

Write review to `CODEX_REVIEW_phase3_commits34.md`. APPROVE or REQUEST_CHANGES.
