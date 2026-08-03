# Phase 4: Commits 7-11 — Frontend Controls + API Updates

Continue Phase 4 implementation. Commits 1-6 are already landed:
- Shared animation/transition types and schemas
- Animation utility functions (fade, slide, zoom, bounce with spring)
- SceneBlockPlayer animation integration
- Transition utility functions (crossfade, slide, zoom, wipe)
- SceneBlockPlayer transition integration
- All 9 animation presets enabled in capability registry

231 tests passing, typecheck clean.

## What to implement

### Commit 7: Style preset picker + brand settings integration

Create:
- `web/src/utils/stylePresets.ts` — `stylePresetToTemplatePatch()` maps style preset → brand settings patch
- `web/src/utils/stylePresets.test.ts` — tests for mapping
- `web/src/components/StylePresetPicker.tsx` — grid/list of style presets with preview swatches

Modify:
- `web/src/components/BrandSettings.tsx` — add StylePresetPicker above manual color fields
- `web/src/pages/Dashboard.tsx` — store selectedStylePresetId, pass styles from useCapabilities()
- `web/src/hooks/useCapabilities.ts` — return styles and animations from capabilities
- `web/src/index.css` — style preset picker styles

The style preset maps:
- style.colors.primary → brandColor
- style.colors.secondary → secondaryColor
- style.colors.accent → accentColor
- style.colors.background → backgroundColor
- style.backgroundTreatment === 'solid' → backgroundType: 'solid'
- else → backgroundType: 'gradient'
- Do NOT clear logoUrl, backgroundImageUrl, or media URLs

### Commit 8: Frontend animation controls per block

Create:
- `web/src/components/AnimationControls.tsx` — entry/exit animation pickers with duration/intensity/easing sliders
- `web/src/utils/animationControls.ts` — filter animation options by direction (in/out), normalize config
- `web/src/utils/animationControls.test.ts`

Modify:
- `web/src/components/BlockEditor.tsx` — add AnimationControls section after content fields
- `web/src/pages/Dashboard.tsx` — include animation in composerBlockSequence serialization
- `web/src/index.css` — animation control styles (44px touch targets, mobile-first)

Controls:
- Entry picker: none, fade-in, slide-in-left, slide-in-right, slide-in-up, slide-in-down, zoom-in, bounce-in
- Exit picker: none, fade-out
- Duration slider: 0-60 frames, default 12
- Intensity slider: 0-1, step 0.05, default 0.35
- Easing select: linear, ease-in, ease-out, ease-in-out, spring (only for presets that support it)

### Commit 9: Frontend transition controls between blocks

Create:
- `web/src/components/TransitionControls.tsx` — transition type/direction/duration/easing picker
- `web/src/utils/transitions.ts` — normalize transition config, defaults
- `web/src/utils/transitions.test.ts`

Modify:
- `web/src/components/SceneTimeline.tsx` — add transition controls between blocks (not after last block)
- `web/src/pages/Dashboard.tsx` — include transition in serialization
- `web/src/index.css` — transition control styles

Controls:
- Type select: crossfade, slide, zoom, wipe
- Direction select (for slide/wipe): left, right, up, down
- Duration: 0-60, default 12
- Easing: linear, ease-in, ease-out, ease-in-out

### Commit 10: API validation updates

Modify:
- `api/src/validation/composition.test.ts` — test that SceneBlockPlayer with animation/transition passes validation
- `api/src/routes/v1/capabilities.test.ts` — already updated in Commit 6, verify

No new API endpoints needed — capabilities already exposed.

### Commit 11: Verify tests and typecheck

Run full test suite and typecheck. Ensure everything passes.

## Key files to read first
- `web/src/components/BrandSettings.tsx` — current brand settings UI
- `web/src/components/BlockEditor.tsx` — current block editor
- `web/src/components/SceneTimeline.tsx` — current timeline
- `web/src/pages/Dashboard.tsx` — current dashboard state management
- `web/src/hooks/useCapabilities.ts` — current capabilities hook
- `web/src/utils/capabilityAdapters.ts` — current capability adapters
- `web/src/index.css` — current styles (design tokens are defined here)

## Constraints
- Mobile-first: 320px minimum, 44px touch targets
- Use existing design tokens (--space-*, --radius-*, --color-*, etc.)
- No new dependencies
- Keep existing components working — additive changes only
- All new fields optional with defaults

## Verification
After all changes:
```bash
npm test
npm run typecheck
```
