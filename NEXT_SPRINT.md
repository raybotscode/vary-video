# Vary.video — Sprint Plan (Updated 2026-08-04)

## Current State

**43+ commits, 297 tests (28 files), typecheck clean.**

### What's Done
- ✅ SceneBlockPlayer JSON-driven composition (13 block types)
- ✅ Capability registry (templates, blocks, animations, styles, media)
- ✅ Per-variant branding/media with placeholder resolution
- ✅ 14 animations (9 entry + 5 exit) + 4 transition types
- ✅ Audio upload + Remotion muxing with fades
- ✅ SQLite persistent jobs + My Renders page
- ✅ AI prompt-to-template (OpenRouter, Llama 4 Scout)
- ✅ AI Template Scoring — scores templates against user prompts, sends top matches
- ✅ AI Template Preference — reuses existing templates when score >= 8
- ✅ Pixabay stock media browser (images + video)
- ✅ Multi-format rendering (16:9, 1:1, 9:16, 4:5)
- ✅ Live Preview — POST /api/v1/preview with renderStill()
- ✅ Sample CSV Data — 5 sample CSVs with "Load Sample Data" button
- ✅ Render Retry — POST /api/v1/renders/:id/retry + retry button
- ✅ Exit Animations — 5 new exit presets (14 total)
- ✅ Graceful CSV Missing Data — blocks hide when essential content is empty
- ✅ Template Gallery — category filters, search, visual cards
- ✅ Mobile Dashboard Audit — 360px/390px fixes, touch targets

### Remaining Items (Not Yet Prioritized)

| Gap | Impact | Effort | Priority |
|-----|--------|--------|----------|
| Only 5 templates | Medium | 2d | P1 |
| Preview error UX (raw errors) | Low | 0.5d | P2 |
| Preview scale param | Low | 0.5d | P2 |
| AI cost tracking | Low | 0.5d | P2 |
| Capability version tracking | Low | 0.5d | P2 |
| AI generation wizard | Medium | 2d | P2 |
| Better validation UX | Medium | 1.5d | P2 |
| Template preview images | Low | 1d | P2 |

### Skip For Now
- Auth + accounts (deferred)
- Hetzner deployment (deferred)
- Billing / Stripe
- MCP server
- Public REST API
- Playwright tests
- Webhooks
