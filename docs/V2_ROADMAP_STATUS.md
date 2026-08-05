# V2 ROADMAP STATUS — Phase 0: Current-State Audit

**Status:** IN PROGRESS  
**Branch:** main (frozen at `123f6f4`)  
**Date:** 2026-08-05  

---

## 1. BASELINE METRICS

| Metric | Value |
|--------|-------|
| Commits | 85 |
| Source files (.ts/.tsx) | 187 |
| Test files | 30 |
| Tests passing | 319 / 319 |
| Typecheck | Clean (pre-existing Remotion EventListener type mismatch only) |
| Working tree | Clean |
| Commits ahead of origin | 54 |

### Test Suite Breakdown

| Test file | Tests | Status |
|-----------|-------|--------|
| SceneBlockPlayer/schema.test.ts | 20 | ✅ |
| capabilities.test.ts | 9 | ✅ |
| user-templates.test.ts | 15 | ✅ |
| composition.test.ts | 11 | ✅ |
| media.test.ts | 11 | ✅ |
| placeholders.test.ts | 15 | ✅ |
| preview.test.ts | 10 | ✅ |
| transitions/presets.test.ts | 13 | ✅ |
| mediaFields.test.ts | 13 | ✅ |
| treatment.test.ts | 21 | ✅ |
| registry.test.ts | 5 | ✅ |
| templateScorer.test.ts | 9 | ✅ |
| graceful-defaults.test.ts | 12 | ✅ |
| capabilityAdapters.test.ts | 3 | ✅ |
| audioValidation.test.ts | 10 | ✅ |
| templates/registry.test.ts | 6 | ✅ |
| placeholder.test.ts | 4 | ✅ |
| sampleData.test.ts | 6 | ✅ |
| animationControls.test.ts | 4 | ✅ |
| transitions.test.ts | 3 | ✅ |
| hash.test.ts | 4 | ✅ |
| stylePresets.test.ts | 3 | ✅ |
| client.test.ts | 7 | ✅ |
| WebinarPromo.test.ts | 5 | ✅ |
| (+ 6 more) | — | ✅ |

---

## 2. ARCHITECTURE MAP

### Directory Structure

```
vary-video/
├── api/src/                    # Express API server (port 3001)
│   ├── db/                     # SQLite + Drizzle ORM
│   │   ├── schema.ts           # jobs, jobDownloads, aiGenerations, userTemplates
│   │   └── client.ts           # DB connection
│   ├── routes/
│   │   ├── render.ts           # POST /api/render
│   │   ├── audio.ts            # Audio endpoints
│   │   └── v1/
│   │       ├── capabilities.ts # GET /api/v1/capabilities
│   │       ├── generate-template.ts # POST /api/v1/generate-template
│   │       ├── preview.ts      # POST /api/v1/preview
│   │       ├── renders.ts      # Render job management
│   │       ├── templates.ts    # Template CRUD
│   │       ├── user-templates.ts # User template gallery
│   │       ├── blocks.ts       # Block definitions
│   │       ├── animations.ts   # Animation presets
│   │       ├── styles.ts       # Style presets
│   │       └── media.ts        # Pixabay search
│   └── services/
│       ├── aiTemplateGenerator.ts # OpenRouter AI integration
│       ├── templateScorer.ts   # Template scoring for AI
│       ├── renderer.ts         # Remotion render orchestration
│       ├── variantResolution.ts # CSV/JSON variant processing
│       ├── aiCostTracker.ts    # AI usage tracking
│       ├── pixabay.ts          # Pixabay API
│       ├── audioStorage.ts     # Audio file management
│       └── mediaValidation.ts  # Media file validation
│
├── src/                        # Shared code + Remotion compositions
│   ├── components/             # Shared UI utilities
│   │   ├── DynamicText.tsx     # Auto-sizing text
│   │   ├── FitText.tsx         # Text fitting
│   │   ├── BrandFrame.tsx      # Brand frame overlay
│   │   └── util.ts             # safeHexColor, resolvePlaceholders
│   ├── compositions/
│   │   ├── SceneBlockPlayer/   # Core scene renderer
│   │   │   ├── SceneBlockPlayer.tsx
│   │   │   └── schema.ts       # SceneBlockPlayerProps Zod schema
│   │   ├── blocks/             # Block type definitions
│   │   │   ├── registry.ts     # Block registry + BlockRenderProps
│   │   │   ├── adapters.tsx    # Block → composition adapters
│   │   │   ├── TextOverlay.tsx # Text block renderer
│   │   │   ├── DataCallout.tsx # Data callout renderer
│   │   │   ├── ImageBlock.tsx  # Image block renderer
│   │   │   ├── layoutUtils.ts  # Element layout resolution
│   │   │   └── emptyCheck.ts   # Graceful CSV defaults
│   │   ├── animations/         # Animation presets
│   │   │   ├── presets.ts      # 14 presets (fadeIn, slideUp, etc.)
│   │   │   ├── easing.ts       # Easing functions
│   │   │   └── types.ts        # Animation types
│   │   ├── transitions/        # Scene transitions
│   │   │   ├── presets.ts      # crossfade, slide, wipe, zoom
│   │   │   └── types.ts        # Transition types
│   │   ├── media/              # Media handling
│   │   │   ├── ResponsiveImage.tsx
│   │   │   └── treatment.ts    # Image treatments
│   │   ├── RealEstate/         # Template composition
│   │   ├── ProductLaunch/      # Template composition
│   │   ├── SocialClip/         # Template composition
│   │   ├── InsuranceAd/        # Template composition
│   │   └── WebinarPromo/       # Template composition
│   ├── shared/
│   │   ├── capabilities/       # Capability registry
│   │   │   ├── registry.ts     # Central capability registry
│   │   │   ├── blocks.ts       # Block capabilities
│   │   │   ├── animations.ts   # Animation capabilities
│   │   │   ├── styles.ts       # Style presets
│   │   │   ├── templates.ts    # Template capabilities
│   │   │   ├── media.ts        # Media capabilities
│   │   │   ├── types.ts        # Shared types (ElementLayout, etc.)
│   │   │   ├── schema.ts       # Zod schemas for capabilities
│   │   │   └── hash.ts         # Capability version hashing
│   │   └── placeholders.ts     # Merge tag parsing
│   └── templates/
│       └── registry.ts         # Template definitions
│
├── web/                        # Vite + React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # Main dashboard (684 lines)
│   │   │   ├── Home.tsx        # Landing page
│   │   │   ├── SceneComposer.tsx # Scene composer page
│   │   │   └── RenderHistory.tsx # Render history
│   │   ├── components/
│   │   │   ├── preview/        # Player preview system
│   │   │   │   ├── RemotionPlayerPreview.tsx # Remotion Player wrapper
│   │   │   │   ├── SafePlayerPreview.tsx # Error boundary wrapper
│   │   │   │   ├── EditCanvas.tsx # Interactive canvas (buggy)
│   │   │   │   ├── EditableElement.tsx # Drag/resize/inline (buggy)
│   │   │   │   ├── ElementToolbar.tsx # Floating toolbar
│   │   │   │   ├── EditPanel.tsx # Property sliders
│   │   │   │   ├── LivePreview.tsx # HTML preview (unused)
│   │   │   │   └── MinimalPlayerTest.tsx # Fallback player
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   │   ├── AiWizard.tsx # AI template wizard
│   │   │   │   ├── AiPromptInput.tsx
│   │   │   │   ├── TemplateGallery.tsx
│   │   │   │   ├── UserTemplateGallery.tsx
│   │   │   │   ├── SaveTemplateDialog.tsx
│   │   │   │   └── ...
│   │   │   ├── media/          # Media components
│   │   │   ├── composer/       # Scene composer components
│   │   │   └── ui/             # Shared UI (Toast, Loading, Empty)
│   │   ├── utils/
│   │   │   ├── blocks.ts       # ComposerBlock type
│   │   │   ├── placeholder.ts  # VariantData, resolvePlaceholders
│   │   │   ├── sampleData.ts   # Sample CSV data
│   │   │   ├── animationControls.ts
│   │   │   ├── transitions.ts
│   │   │   ├── stylePresets.ts
│   │   │   ├── mediaFields.ts
│   │   │   ├── capabilityAdapters.ts
│   │   │   └── templates.ts
│   │   ├── api/
│   │   │   └── client.ts       # API client
│   │   └── hooks/
│   │       ├── useCapabilities.ts
│   │       └── useDebouncedPreview.ts
│   └── vite.config.ts
│
├── scripts/
│   ├── batch-render.ts         # CLI batch render
│   ├── render-variant.sh       # Single variant render
│   └── smoke-test.sh           # Smoke test
│
├── data/
│   └── vary.db                 # SQLite database
│
└── docs/
    └── V2_MASTER_ROADMAP.md    # This document
```

---

## 3. REUSE / REBUILD / FREEZE MATRIX

### ✅ REUSE (Proven patterns, adapt for v2)

| System | Files | Rationale |
|--------|-------|-----------|
| **Remotion render pipeline** | `src/Root.tsx`, compositions/*, remotion.config.ts | Core rendering works. v2 needs new document interpreter but same Remotion setup. |
| **Animation presets** | `src/compositions/animations/presets.ts`, `easing.ts`, `types.ts` | 14 presets with easing. Good foundation. v2 adds keyframe model. |
| **Scene transitions** | `src/compositions/transitions/presets.ts`, `types.ts` | crossfade, slide, wipe, zoom. v2 may simplify to per-element only. |
| **Merge tag resolution** | `src/shared/placeholders.ts` | `{{tag}}` parsing and resolution. Proven, tested. |
| **AI template generator** | `api/src/services/aiTemplateGenerator.ts` | OpenRouter integration. v2 changes output schema but same provider pattern. |
| **Template scorer** | `api/src/services/templateScorer.ts` | Scoring algorithm for AI reuse. v2 adapts to new template model. |
| **AI cost tracker** | `api/src/services/aiCostTracker.ts` | Usage tracking. Keep as-is. |
| **Capability registry** | `src/shared/capabilities/registry.ts`, `hash.ts`, `types.ts` | Central registry with versioning. v2 extends with new element types. |
| **Variant resolution** | `api/src/services/variantResolution.ts` | CSV/JSON parsing and tag resolution. v2 keeps same logic. |
| **Pixabay integration** | `api/src/services/pixabay.ts`, `pixabayCache.ts` | Media search. Keep as-is. |
| **Audio validation** | `api/src/services/audioValidation.ts` | Audio file validation. Keep as-is. |
| **Media validation** | `api/src/services/mediaValidation.ts` | File validation. Keep as-is. |
| **DynamicText/FitText** | `src/components/DynamicText.tsx`, `FitText.tsx` | Auto-sizing text for Remotion. v2 renderer uses these. |
| **Zod validation pattern** | Throughout | Schema validation everywhere. v2 uses same pattern with new schemas. |
| **Express API structure** | `api/src/index.ts`, routes/* | API routing pattern. v2 replaces with Cloudflare Workers but same structure. |
| **Batch render script** | `scripts/batch-render.ts` | CLI rendering. v2 adapts. |
| **Sample data utilities** | `web/src/utils/sampleData.ts` | CSV sample data. v2 keeps. |
| **Test infrastructure** | `vitest.config.ts`, all *.test.ts | Vitest setup. v2 uses same. |

### ⚠️ ADAPT (Concept is right, implementation needs rewrite)

| System | Files | What changes |
|--------|-------|-------------|
| **Capability types** | `src/shared/capabilities/types.ts` | ElementLayout becomes v2 Transform model (normalized 0-1, rotation, responsive overrides). |
| **Capability schemas** | `src/shared/capabilities/schema.ts` | Zod schemas for new element model. Same pattern, new types. |
| **Block capabilities** | `src/shared/capabilities/blocks.ts` | Becomes element registry (text, image, shape). Same pattern, new structure. |
| **Animation capabilities** | `src/shared/capabilities/animations.ts` | Adds easing, intensity, delay. Same registry pattern. |
| **Template registry** | `src/templates/registry.ts` | v2 templates use new document model. Same registry pattern. |
| **Render service** | `api/src/services/renderer.ts` | v2 renders from new document model. Same orchestration pattern. |
| **API routes** | `api/src/routes/v1/*` | v2 uses Cloudflare Workers. Same REST patterns, new backend. |
| **DB schema** | `api/src/db/schema.ts` | v2 uses D1. Same table concepts, new schema (users, orgs, templates, versions, jobs). |
| **API client** | `web/src/api/client.ts` | Same fetch patterns, new endpoints. |
| **Dashboard page** | `web/src/pages/Dashboard.tsx` | v2 splits into editor + dashboard. Same page structure concepts. |
| **Template gallery** | `web/src/components/dashboard/TemplateGallery.tsx` | Same UX concept, new backend. |
| **Variant editor** | `web/src/components/VariantEditor.tsx` | Same UX concept, adapts to new tag model. |
| **Style presets** | `web/src/utils/stylePresets.ts`, `src/shared/capabilities/styles.ts` | Same concept, extends with new properties. |

### ❌ FREEZE (Do not modify, retire after v2 parity)

| System | Files | Reason |
|--------|-------|--------|
| **EditCanvas** | `web/src/components/preview/EditCanvas.tsx` | Buggy overlay approach. v2 uses proper DOM editor. |
| **EditableElement** | `web/src/components/preview/EditableElement.tsx` | contentEditable conflicts. v2 uses controlled editor. |
| **ElementToolbar** | `web/src/components/preview/ElementToolbar.tsx` | Part of broken overlay. v2 has properties panel. |
| **EditPanel** | `web/src/components/preview/EditPanel.tsx` | Slider-based editing. v2 has direct manipulation. |
| **LivePreview** | `web/src/components/preview/LivePreview.tsx` | Unused HTML preview. |
| **RemotionPlayerPreview** | `web/src/components/preview/RemotionPlayerPreview.tsx` | Complex wrapper with edit mode. v2 separates editor from player. |
| **SafePlayerPreview** | `web/src/components/preview/SafePlayerPreview.tsx` | Error boundary for broken player. v2 has proper error handling. |
| **Block model** | `web/src/utils/blocks.ts` (ComposerBlock) | Block-centric model. v2 uses element-centric model. |
| **SceneBlockPlayer** | `src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx` | Block-sequence renderer. v2 has element-based scene renderer. |
| **Block adapters** | `src/compositions/blocks/adapters.tsx` | Block → composition adapters. v2 has direct element rendering. |
| **Block registry** | `src/compositions/blocks/registry.ts` | Block type registry. v2 has element type registry. |
| **Layout utils** | `src/compositions/blocks/layoutUtils.ts` | Percentage-based layout. v2 uses normalized coordinates. |
| **Old compositions** | `src/compositions/RealEstate/`, `ProductLaunch/`, etc. | Hardcoded template compositions. v2 generates compositions from JSON. |
| **Transition controls** | `web/src/components/TransitionControls.tsx` | UI for transitions. v2 has timeline-based animation. |
| **Scene timeline** | `web/src/components/SceneTimeline.tsx` | Block-based timeline. v2 has element-based timeline. |
| **Block editor** | `web/src/components/BlockEditor.tsx` | Block editing UI. v2 has element properties panel. |
| **Block palette** | `web/src/components/BlockPalette.tsx` | Block selection. v2 has element library. |

### 🆕 BUILD NEW (No v1 equivalent)

| System | Description |
|--------|-------------|
| **V2 Document Schema** | Element-centric template model with scenes, elements, transforms, responsive overrides |
| **DOM Editor** | Canvas-based editor with drag, resize, rotate, inline text editing |
| **Element Registry** | Typed element definitions (text, image, shape) with editor and renderer components |
| **Selection Model** | Click-to-select, multi-select, keyboard navigation |
| **Undo/Redo System** | History stack for all editor operations |
| **Properties Panel** | Schema-driven right sidebar for element properties |
| **Timeline** | Element-based timeline with overlapping timing |
| **Responsive Overrides** | Per-aspect-ratio layout overrides (16:9, 9:16, 1:1) |
| **Auth System** | Users, organisations, roles, sessions (Cloudflare) |
| **D1 Database** | New schema for multi-user (users, orgs, templates, versions, jobs, assets) |
| **R2 Storage** | Asset storage, rendered outputs, previews |
| **Asset Library** | Per-user image/logo upload and management |
| **Public API** | Versioned REST API with API keys, webhooks |
| **MCP Server** | AI agent integration |

---

## 4. DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vite + React)            │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Dashboard │  │  Editor  │  │ Template Gallery │  │
│  └─────┬────┘  └─────┬────┘  └────────┬─────────┘  │
│        │             │                 │            │
│  ┌─────▼─────────────▼─────────────────▼─────────┐  │
│  │              API Client (fetch)                │  │
│  └─────────────────────┬─────────────────────────┘  │
│                        │                            │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                   API SERVER                         │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Templates │  │ Renders  │  │ AI Generation    │  │
│  └─────┬────┘  └─────┬────┘  └────────┬─────────┘  │
│        │             │                 │            │
│  ┌─────▼─────────────▼─────────────────▼─────────┐  │
│  │           Services Layer                       │  │
│  │  aiTemplateGenerator | renderer | variantRes   │  │
│  │  templateScorer | pixabay | audioValidation    │  │
│  └─────────────────────┬─────────────────────────┘  │
│                        │                            │
│  ┌─────────────────────▼─────────────────────────┐  │
│  │           Data Layer                           │  │
│  │  SQLite (better-sqlite3) | Drizzle ORM         │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              RENDER SERVER                           │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Remotion CLI + Chromium + FFmpeg              │  │
│  │  Renders compositions → MP4/WebM               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Key Dependencies

| Package | Version | Used by | v2 status |
|---------|---------|---------|-----------|
| remotion | ^4.0.482 | Renderer | Keep |
| @remotion/renderer | ^4.0.482 | Server-side render | Keep |
| @remotion/bundler | ^4.0.482 | Bundle for render | Keep |
| @remotion/google-fonts | ^4.0.482 | Font loading | Keep |
| @remotion/layout-utils | ^4.0.482 | DynamicText/FitText | Keep |
| react | ^19.2.7 | All | Keep |
| zod | ^4.3.6 | Validation | Keep |
| express | ^5.2.1 | API server | Replace with CF Workers |
| better-sqlite3 | ^13.0.2 | Database | Replace with D1 |
| drizzle-orm | ^0.45.2 | ORM | Replace with D1 direct |
| archiver | ^8.0.0 | ZIP creation | Keep for render server |
| multer | ^2.2.0 | File upload | Replace with R2 signed URLs |
| cors | ^2.8.6 | CORS | CF Workers handle this |

---

## 5. RISKS

| Risk | Severity | Mitigation |
|------|----------|------------|
| v1 editor bugs leak into v2 | High | Freeze v1 editor code. No modifications. |
| Remotion version compatibility | Medium | Pin Remotion version. Test early. |
| D1 limitations (query size, etc.) | Medium | Design for D1 constraints from start. |
| Normalized coordinate precision | Low | Use float64, test round-trip. |
| contentEditable in v2 editor | High | Use controlled overlay approach (see contenteditable-react skill). |
| Mobile editor performance | Medium | DOM-based editor, limit elements per scene. |
| AI generates invalid templates | Medium | Strict Zod validation, repair attempts, capability registry. |
| Render server reliability | Medium | Job leasing, retries, health checks. |
| Large CSV imports freeze browser | Medium | Web Worker for parsing, chunked processing. |

---

## 6. BRANCH STRATEGY

```
main                          ← v1 frozen (123f6f4)
  └── v2/phase-0-audit        ← this phase
      └── v2/phase-1-schema   ← document schema
          └── v2/phase-2-registry ← element + capability registries
              └── v2/phase-3-editor ← minimal DOM editor
                  └── ...
```

- Each phase gets its own branch
- Merge to `main` only after Codex approval
- v1 code stays on `main` but is frozen
- v2 code lives in new packages/directories

---

## 7. NEXT STEPS

1. **Codex reviews this audit** — validates reuse/rebuild matrix
2. **Create v2 directory structure** — initial packages
3. **Phase 1: Document schema** — v2 template model with Zod
4. **Phase 2: Element registry** — typed element definitions
5. **Phase 3: Minimal DOM editor** — one scene, text/image/shape, drag/resize/rotate
