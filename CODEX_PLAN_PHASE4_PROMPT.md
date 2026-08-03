# Vary.video — Phase 4 Spec: Animation Presets & Transitions

You are the senior architect for the Vary.video project. Your task is INSPECTION AND PLANNING ONLY. Do NOT modify, create, or delete any source files. Produce a file-level implementation plan and write it to `CODEX_SPEC_phase4.md` in the repo root.

## Project
- Repo: /home/raymo/vary-video
- Stack: Remotion 4.x (React/TS compositions), Express + Zod API (`api/`), Vite + React frontend (`web/`)
- Render API runs on a local machine (Remotion needs Node + Chromium + FFmpeg)

## Current State (Phases 0-3 Complete)

### Phase 0: Baseline audit ✅
### Phase 1: Mobile-first UI foundation ✅
- Design tokens, responsive shell, mobile composer, responsive variant editor, feedback primitives
- 14 Playwright e2e tests, 24 unit tests

### Phase 2: Canonical capability registry ✅
- Single source of truth for templates/blocks/animations/styles in `src/shared/capabilities/`
- `GET /api/v1/capabilities` endpoint
- Frontend loads from registry (no more duplication)
- Capability versioning with deterministic hash

### Phase 3: Per-variant branding & media ✅
- 6 generic media field types (logo, backgroundImage, image1, image2, person1, person2)
- Per-variant placeholder resolution (brand colours, media URLs)
- SSRF-hardened media validation (DNS resolution, redirect chain, IPv4/IPv6 denylists)
- Remotion image rendering with treatment controls (cover/contain/fit-width/fit-height, focal point, overlays)
- `media-image` block with `supportsImageTreatment: true`
- Generic naming with `legacyVariantKeys` backward compat
- 185 tests passing, typecheck clean

## What Exists for Phase 4

### Animation Presets (metadata only — `src/shared/capabilities/animations.ts`)
8 presets defined, only `none` is enabled:
- none (enabled)
- fade-in, fade-out (disabled)
- slide-in-left, slide-in-right, slide-in-up, slide-in-down (disabled)
- zoom-in (disabled)
- bounce-in (disabled)

Each has: id, name, description, direction (in/out), parameters ({durationFrames, intensity}), compatibleBlockTypes, status, tags.

### Style Presets (metadata only — `src/shared/capabilities/styles.ts`)
4 presets, all enabled:
- clean-brand, bold-social, property-premium, webinar-dark
Each has: colors, typography, backgroundTreatment, defaultAnimations, suitableIndustries.

### Existing Transition Logic (`src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx`)
The SceneBlockPlayer already has basic crossfade transitions between blocks:
- `transitionFrames` on each block sequence item (default 12)
- Calculates `transitionProgress` based on local frame position
- Renders next block with opacity = transitionProgress, current block with opacity = 1 - transitionProgress
- This is a simple crossfade — no directional movement, no easing

### Block Sequence Schema (`src/compositions/SceneBlockPlayer/schema.ts`)
```ts
const blockSequenceItemSchema = z.object({
  blockId: blockIdSchema,
  content: z.record(z.string(), z.string()).default({}),
  imageTreatment: imageTreatmentSchema.optional(),
  durationFrames: z.number().int().positive().optional(),
  transitionFrames: z.number().int().min(0).optional(),
});
```

### Block Renderers (`src/compositions/blocks/`)
~12 blocks exist. Each receives:
```ts
type BlockRenderProps = {
  frame: number;
  fps: number;
  width: number;
  height: number;
  content: Record<string, string>;
  brand: BrandSettings;
  data: Record<string, string>;
  startFrame: number;
  imageTreatment?: ImageTreatment;
};
```

### What's Missing (Phase 4 scope)
1. **Animation functions** — actual Remotion animation implementations (interpolate, spring, etc.)
2. **Animation presets enabled** — turn disabled presets to enabled once render support exists
3. **Per-block animation** — each block in a sequence should be able to have entry/exit animations
4. **Animation parameters** — durationFrames, intensity, easing exposed as configurable
5. **Transition types** — crossfade exists; add slide, zoom, wipe transitions between blocks
6. **Style presets connected** — style presets should actually apply to brand settings
7. **Frontend animation controls** — UI to select animations per block, transition type between blocks
8. **Frontend style picker** — UI to select a style preset for a template

## Architecture Context

### Key Files
- `src/shared/capabilities/animations.ts` — animation preset metadata
- `src/shared/capabilities/styles.ts` — style preset metadata
- `src/shared/capabilities/types.ts` — AnimationPresetCapability, StylePresetCapability types
- `src/shared/capabilities/schema.ts` — Zod schemas for capabilities
- `src/shared/capabilities/blocks.ts` — block definitions (some have `supportedAnimations`)
- `src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx` — main composition with transition logic
- `src/compositions/SceneBlockPlayer/schema.ts` — block sequence schema
- `src/compositions/blocks/` — individual block renderers
- `web/src/components/` — frontend components

### Remotion Animation Primitives Available
- `interpolate(frame, inputRange, outputRange)` — linear/eased value mapping
- `spring({frame, fps, config})` — physics-based spring animation
- `Easing.inOut(Easing.bezier(...))` — custom easing curves
- `useCurrentFrame()` — current frame in composition
- `useVideoConfig()` — fps, width, height, durationInFrames

### Design Constraints
- Mobile-first: 320px minimum, 44px touch targets
- No large UI framework
- Keep API v1 routes additive
- Schema-validated rendering (all props through Zod)
- SceneBlockPlayer is the foundation — enhance it, don't replace it

## What to Produce

Write a complete file-level implementation plan covering:

### 1. Animation System
- Animation utility functions (`src/compositions/animations/`)
- How each preset maps to Remotion primitives (interpolate, spring, Easing)
- Entry animations (fade-in, slide-in-*, zoom-in, bounce-in)
- Exit animations (fade-out)
- Per-block animation support in SceneBlockPlayer
- Animation parameters (durationFrames, intensity, easing curve)
- How animations compose with transitions

### 2. Transition System
- Enhance the existing crossfade in SceneBlockPlayer
- Add slide transitions (left, right, up, down)
- Add zoom transitions
- Add wipe transitions
- Transition easing curves
- Transition parameters (duration, direction, easing)

### 3. Style Preset Integration
- How style presets connect to brand settings
- "Apply style preset" action in the frontend
- Style preset picker UI

### 4. Frontend Controls
- Animation picker per block (dropdown/sheet)
- Transition picker between blocks
- Animation duration/intensity sliders
- Style preset selector
- Preview of animation/transition in the composer

### 5. API Updates
- Enable disabled animation presets once render support exists
- Capability registry auto-updates (presets are already defined)
- No new API endpoints needed (capabilities already exposed)

### 6. Test Plan
- Unit tests for animation functions
- Unit tests for transition functions
- Integration tests for SceneBlockPlayer with animations
- Visual verification approach

## Required Plan Structure

For every task include:
1. **Files to modify** (exact paths)
2. **New files to create** (exact paths)
3. **Shared types to add/modify**
4. **Tests to add** (exact test file paths, what they cover)
5. **Risks**
6. **Commit boundaries** (small reviewable commits grouped by feature)
7. **Verification steps**

## Output
Write the complete plan to `/home/raymo/vary-video/CODEX_SPEC_phase4.md`. Make it concrete enough that an implementer can execute it file-by-file.
