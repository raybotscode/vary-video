# Vary.video — Next Sprint Plan

## Current State (2026-08-04)

**59 commits, 270 tests (25 files), typecheck clean.**

### What's Done (updated)
- ✅ SceneBlockPlayer JSON-driven composition (13 block types)
- ✅ Capability registry (templates, blocks, animations, styles, media)
- ✅ Per-variant branding/media with placeholder resolution
- ✅ 9 entry animations + 4 transition types
- ✅ Audio upload + Remotion muxing with fades
- ✅ SQLite persistent jobs + My Renders page
- ✅ AI prompt-to-template (OpenRouter, Llama 4 Scout)
- ✅ Pixabay stock media browser (images + video)
- ✅ Multi-format rendering (16:9, 1:1, 9:16, 4:5)
- ✅ **Live Preview** — POST /api/v1/preview with renderStill(), PreviewPanel with 500ms debounce (commits aa25b24–928fa06)

### What's Still Missing vs DEVELOPMENT_PLAN.md

| Gap | Impact | Effort | Priority |
|-----|--------|--------|----------|
| No sample CSV data | 🔥 Critical | 1d | **P0** |
| Only 1 exit animation (fade-out) | Medium | 1d | P1 |
| No render retry for failed jobs | Medium | 1d | **P1** |
| No template gallery / picker | Medium | 1.5d | P1 |
| Only 6 templates | Medium | 2d | P1 |
| AI builds from scratch, no template reuse | Medium | 1.5d | P1 |
| No template scoring for AI | High | 2d | P1 |
| No capability version tracking | Low | 0.5d | P2 |
| Mobile dashboard audit | Medium | 2d | P2 |

### New Items Discovered During Preview/AI Work
- **Preview error UX**: Preview failures show raw error text; needs friendly messaging + retry
- **Preview composition size**: renderStill() uses full composition dimensions; should support a `scale` param for faster previews
- **AI prompt cost tracking**: No logging of token usage or model costs per generation
- **Template-to-preview integration**: AI-generated templates should auto-preview immediately

---

## Sprint (4 weeks, no auth/hosting)

### Week 1: Data + Reliability

**1. Sample CSV Data (1d) — P0** ✅ DONE (e657cef)
- `public/samples/real-estate.csv` — property listing data (name, price, beds, baths, sqft, location, agent)
- `public/samples/product-launch.csv` — product data (name, tagline, features, price, CTA)
- `public/samples/social-clip.csv` — social content (hook, body, CTA, brand)
- `public/samples/insurance-ad.csv` — insurance quotes (age, gender, location, company)
- `public/samples/webinar-promo.csv` — webinar promos (event, host, date, audience)
- "Load sample data" button in VariantEditor
- Files: `public/samples/*.csv`, `web/src/components/VariantEditor.tsx`, `web/src/utils/sampleData.ts`
- See: CODEX_SPEC_SAMPLE_CSV.md

**2. Render Retry (1d) — P1** ✅ DONE (23ba1cc)
- POST `/api/v1/renders/:id/retry` — re-queue a failed job ✅
- "Retry" button on failed renders in My Renders ✅
- Re-use original job params (template, variants, formats) ✅
- Files: `api/src/routes/v1/renders.ts`, `web/src/pages/RenderHistory.tsx`

**3. Exit Animations (1d) — P1** ✅ DONE (49fa452)
- slide-out-left, slide-out-right, slide-out-up, slide-out-down, zoom-out ✅
- Currently only `fade-out` exists → now 6 exit animations total ✅
- Files: `src/compositions/animations/presets.ts`, `src/shared/capabilities/animations.ts`

### Week 2: AI Intelligence

**4. AI Template Scoring (2d) — P1**
- `templateScorer.ts` — deterministic scoring by industry/use-case/field match
- Score each template against user's description, send top 5 + blocks to AI
- Reduces token cost and improves output quality
- Files: `api/src/services/templateScorer.ts`, `api/src/services/aiTemplateGenerator.ts`

**5. AI Template Preference (1.5d) — P1**
- `selectionMode`: `existing-template` vs `block-composition`
- When an existing template scores high, AI should reuse it directly
- Update system prompt with reuse rules
- Files: `api/src/services/aiTemplateGenerator.ts`

**6. Template Gallery + New Templates (2d) — P1**
- 2-3 new templates: testimonial, event promo, before/after
- TemplatePicker component with thumbnails/preview cards
- "Use Template" flow: select → auto-load defaults → preview
- Files: `src/templates/*.ts`, `web/src/components/TemplatePicker.tsx`

### Week 3: Polish + Preview Improvements

**7. Preview Improvements (1.5d)**
- Friendly error messages on preview failure
- `scale` param for faster low-res previews (e.g., 480px wide)
- Auto-preview on AI template generation
- Files: `api/src/routes/v1/preview.ts`, `web/src/components/PreviewPanel.tsx`

**8. AI Cost Tracking (0.5d)**
- Log model name, input/output tokens, and estimated cost per generation
- Display in admin/debug panel
- Files: `api/src/services/aiTemplateGenerator.ts`, `api/src/db/schema.ts`

**9. Capability Version Tracking (0.5d)**
- Store registry version hash with renders
- Warn when re-rendering with a newer registry
- Files: `api/src/db/schema.ts`, `api/src/routes/v1/renders.ts`

### Week 4: Mobile + Nice-to-Have

**10. Mobile Dashboard Audit (2d) — P2**
- Fix overflow at 360px/390px/430px
- 44px touch targets everywhere
- Variant editor card view on mobile
- Files: `web/src/index.css`, `VariantEditor.tsx`, `Dashboard.tsx`

**11. Template Preview Images (1d)**
**12. AI Generation Wizard (2d)**
**13. Better Validation UX (1.5d)**

---

## Recommended Build Order (Next 3 Items)

### 1. Sample CSV Data (P0) — BUILD FIRST
**Why**: Without sample data, new users can't demo the product. Every template needs a "just works" experience. Blocks all usability testing and demos. Only 1 day of work.

### 2. Render Retry (P1) — BUILD SECOND
**Why**: Production reliability. Failed renders waste user time and destroy trust. Simple endpoint + UI button. 1 day. High user-visible impact.

### 3. Exit Animations (P1) — BUILD THIRD
**Why**: Videos without exit animations look unfinished. All entry animations exist but blocks just "pop" to the next scene. Quick to add (reuse entry pattern, reverse direction). 1 day. Polishes the product feel.

---

## Skip For Now
- Auth + accounts (deferred)
- Hetzner deployment (deferred)
- Billing / Stripe
- MCP server
- Public REST API
- Playwright tests
- Webhooks
