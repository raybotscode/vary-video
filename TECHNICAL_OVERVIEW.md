# Vary.video — Full Technical Overview

> Purpose of this document: give an AI/agent (ChatGPT, Claude, Codex) complete context on the Vary.video project — what is built, how it works, what is planned — so it can help plan and implement the next features.
> Last updated: 2026-08-02

---

## 1. What the Product Is

**Vary.video** is a batch video-variant generator. The core idea:

> Create ONE template with placeholder variables (`{{name}}`, `{{price}}`, `{{location}}`), drop in a CSV/JSON dataset (or type rows in the app), and get back hundreds of personalised videos — each rendered in multiple aspect ratios, delivered as individual files or a ZIP.

It is built on **Remotion 4.x** (React-based video rendering, headless Chrome) plus an Express API and a Vite/React frontend.

**Live demo:** `vary-video.pages.dev` (Cloudflare Pages, static frontend)
**Repo:** `/home/raymo/vary-video` (local), GitHub `raybotscode/vary-video`

### The vision (where this is heading)

1. **Batch variants** — one template → N personalised videos from a dataset (✅ built)
2. **Visual composer** — users assemble their own template from a block palette, no code (🟡 partially built)
3. **API + MCP** — AI agents and external systems trigger renders programmatically (❌ planned)
4. **Prompt-to-template** — user types "15-second property video, navy/white gradient, show price, bedrooms, agent name" → LLM generates a template spec → appears in the dropdown (❌ planned — see §12)

---

## 2. Architecture (Current)

```
┌──────────────────────────┐        ┌──────────────────────────────────────────────┐
│  Frontend (static)       │        │  Render API (Node/Express, port 3001)        │
│  Cloudflare Pages        │        │  Runs on Ray's mini PC (Windows/WSL)         │
│  Vite + React SPA        │  HTTP  │                                              │
│  vary-video.pages.dev    │◄──────►│  /api/render/*                                │
│                          │  CORS  │  /api/compositions                           │
└──────────────────────────┘        │  ────────────────────────────────            │
                                    │  Remotion renderer (headless Chrome + ffmpeg)│
                                    │  Job queue: in-memory Map<string, RenderJob> │
                                    │  Output: public/renders/*.mp4                │
                                    └──────────────────────────────────────────────┘
                                              ▲
                                              │ cloudflared tunnel (remote testing)
                                              │
```

### Key constraints (IMPORTANT — these shape all decisions)

- **The frontend is 100% static** on Cloudflare Pages — no server-side code there. It talks to the render API over HTTP.
- **The render API CANNOT run on Cloudflare Workers / Vercel serverless** — Remotion needs Node.js + headless Chrome + ffmpeg. It runs on a real machine (currently the mini PC, port 3001).
- **Remote testing:** `cloudflared tunnel --url http://localhost:3001` + frontend runtime override (`?api=<tunnel>/api` or `window.__VARY_API_URL`), persisted in localStorage.
- **Render is CPU-bound** — headless Chrome encodes MP4. Roughly 45s per variant per format on the mini PC.

---

## 3. Tech Stack

| Layer | Tech |
|---|---|
| Video rendering | Remotion 4.x (`@remotion/renderer`, headless Chrome) |
| Compositions | React + TypeScript + Zod schemas |
| Frontend | Vite + React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Validation | Zod (shared schemas between frontend & API) |
| Data import | Client-side CSV/JSON parsing (`web/src/utils/csv-json.ts`) |
| ZIP export | `archiver` |
| Tests | Vitest (24 tests) |
| Deployment | Cloudflare Pages (frontend), mini PC (API), cloudflared (tunnel) |

---

## 4. Repo Layout

```
/home/raymo/vary-video/
├── web/                          # Frontend (Vite + React)
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx          # Landing
│       │   ├── Dashboard.tsx     # Main app: quick mode + composer mode
│       │   ├── SceneComposer.tsx # Routes to Dashboard(initialMode="composer")
│       │   └── RenderHistory.tsx # Past jobs
│       ├── components/
│       │   ├── TemplateForm.tsx      # Quick mode: pick template, edit copy
│       │   ├── VariantEditor.tsx     # Manual variant rows
│       │   ├── VariantTable.tsx      # CSV/JSON imported rows
│       │   ├── FormatSelector.tsx    # 16:9 / 1:1 / 9:16 / 4:5
│       │   ├── BlockPalette.tsx      # Composer: available scene blocks
│       │   ├── SceneTimeline.tsx     # Composer: ordered block sequence
│       │   ├── BlockEditor.tsx       # Composer: edit selected block content
│       │   ├── BrandSettings.tsx     # Colors, logo, background
│       │   ├── PlaceholderHelp.tsx   # {{placeholder}} helper
│       │   ├── RenderProgress.tsx    # Progress + per-variant/per-format downloads
│       │   └── Navbar.tsx / Footer.tsx / Layout.tsx
│       ├── utils/
│       │   ├── blocks.ts         # Composer block definitions + helpers
│       │   ├── templates.ts      # Frontend template registry
│       │   ├── placeholder.ts    # Variant/placeholder helpers
│       │   └── csv-json.ts       # CSV/JSON import parsing
│       └── api/client.ts         # API client, types, base URL resolution
│
├── api/                          # Backend (Express + Remotion)
│   └── src/
│       ├── index.ts              # Express entry, CORS, /api/health, /api/compositions
│       ├── routes/render.ts      # POST /batch, GET /status/:jobId, /download, /download-zip
│       ├── services/renderer.ts  # Remotion render orchestration
│       └── validation/composition.ts
│
└── src/                          # Remotion compositions (video templates)
    ├── Root.tsx                  # Composition registry (register here to appear)
    ├── compositions/
    │   ├── index.ts
    │   ├── InsuranceAd/          # Template 1: insurance ad
    │   ├── WebinarPromo/         # Template 2: webinar promo (Hero/Details/Outro scenes)
    │   ├── ProductLaunch/        # Template 3: product launch (Intro/Features/Pricing)
    │   ├── RealEstate/           # Template 4: property (Hero/Details/CTA)
    │   ├── SocialClip/           # Template 5: short-form social (Hook/Body/Outro)
    │   ├── SceneBlockPlayer/     # GENERIC JSON-driven template (the big one)
    │   │   ├── SceneBlockPlayer.tsx
    │   │   └── schema.ts         # blocks[], brandSettings, fps, width, height, data
    │   └── blocks/
    │       ├── registry.ts       # Block definitions (id, name, category, defaults)
    │       ├── adapters.tsx      # Adapters mapping block ids → template scenes
    │       ├── TextOverlay.tsx   # Generic text block
    │       └── DataCallout.tsx   # Generic value+label block
    └── templates/registry.ts     # Server-side template definitions + Zod schemas
```

---

## 5. Template System (Two Kinds)

### 5a. Hand-coded compositions (current templates)

Each template is a React component registered in `src/Root.tsx`:

```tsx
<Composition
  id="RealEstate"
  component={RealEstate}
  durationInFrames={450}
  fps={30}
  width={1920}
  height={1080}
  defaultProps={defaultRealEstateProps}
/>
```

Each has a **Zod schema** (`src/templates/registry.ts`) defining:
- Copy fields with `{{placeholder}}` templating (e.g. `headlineTemplate: '{{property_name}}'`)
- Brand fields: `brandColor`, `secondaryColor`, `accentColor`, `logoUrl`, `backgroundType` (`solid|gradient|image`), `backgroundColor`, `backgroundImageUrl`
- `data` record: placeholder → value map (one per variant)

**Current templates:**

| ID | Category | Use case |
|---|---|---|
| `InsuranceAd` | ad | Insurance ad |
| `WebinarPromo` | ad | Webinar/event promo |
| `ProductLaunch` | product | Product launch (intro/features/pricing) |
| `RealEstate` | property | Property listing (hero/details/CTA) |
| `SocialClip` | social | Short-form social video |
| `SceneBlockPlayer` | generic | **JSON-driven template (see §6)** |

### 5b. SceneBlockPlayer — the generic JSON-driven template (THE key piece)

`SceneBlockPlayer` is a composition that renders **any sequence of blocks** from a JSON spec — this is what makes user-created templates and prompt-to-template possible without writing React code.

Schema (`src/compositions/SceneBlockPlayer/schema.ts`):

```ts
{
  blocks: [{
    blockId: string,          // e.g. "property-hero", "text-overlay"
    content: { key: string }, // block content, values may contain {{placeholders}}
    durationFrames?: number,  // optional, default from block definition
    transitionFrames?: number // optional
  }],
  brandSettings: {
    brandColor, secondaryColor, accentColor, logoUrl,
    backgroundType: 'solid' | 'gradient' | 'image',
    backgroundColor, backgroundImageUrl?
  },
  fps: number = 30,
  width: number = 1920,
  height: number = 1080,
  data: { placeholder: value }   // merged per-variant
}
```

The renderer auto-calculates total duration from block durations (`getSequenceDuration`).

---

## 6. Block System

Blocks are the building units of a template — each is a "scene" with a defined visual style, content slots, default duration and category.

### Block definition (registry.ts)

```ts
type SceneBlockDefinition = {
  id: string;               // "property-hero"
  name: string;             // "Property Hero"
  description: string;
  icon: string;             // 2-letter badge
  category: 'intro' | 'feature' | 'cta' | 'detail' | 'hook' | 'body' | 'outro';
  defaultDurationFrames: number;
  compatibleSchemas: string[];  // which templates can use it ('any' = all)
  needsBrandSettings: boolean;
  defaultContent: Record<string, string>;
}
```

### Current block registry (10 blocks)

| ID | Name | Category | Compatible |
|---|---|---|---|
| `product-intro` | Product Intro | intro | ProductLaunch |
| `features-grid` | Features Grid | feature | ProductLaunch |
| `pricing-card` | Pricing Card | cta | ProductLaunch |
| `property-hero` | Property Hero | intro | RealEstate |
| `property-details` | Property Details | detail | RealEstate |
| `agent-cta` | Agent CTA | cta | RealEstate |
| `social-hook` | Social Hook | hook | SocialClip |
| `social-body` | Social Body | body | SocialClip |
| `social-outro` | Social Outro | outro | SocialClip |
| `brand-frame` | Brand Frame | outro | any |
| `text-overlay` | Text Overlay | body | any |
| `data-callout` | Data Callout | feature | any |

Blocks have a `blockRenderers` map: template-specific adapters (`adapters.tsx`) + generic renderers (`TextOverlay`, `DataCallout`).

---

## 7. Frontend — Two Modes

### Quick mode (built, works)
1. Pick a template (dropdown)
2. Edit copy fields (with `{{placeholder}}` hints)
3. Add variants: type rows manually OR import CSV/JSON
4. Pick formats (16:9, 1:1, 9:16, 4:5 — multi-select)
5. Render → progress bar → individual downloads + ZIP

### Composer mode (partially built)
1. Pick a base template
2. **BlockPalette** — add/remove scene blocks
3. **SceneTimeline** — reorder blocks, set durations
4. **BlockEditor** — edit selected block's content
5. **BrandSettings** — colors, logo, background
6. Same render flow as quick mode

**Current limitation:** composer mode edits content of EXISTING blocks; it does not yet let users create NEW block types, upload their own images, or pick animation styles per block. That's the planned work (see §9, §10).

---

## 8. API Surface (Current)

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/compositions` | List templates + schemas |
| POST | `/api/render/batch` | Start batch render |
| GET | `/api/render/status/:jobId` | Poll progress |
| GET | `/api/render/download/:jobId/:index` | Download one variant file |
| GET | `/api/render/download-zip/:jobId` | Download all as ZIP |
| GET | `/api/health` | Health check |

### POST /api/render/batch body

```json
{
  "compositionId": "SceneBlockPlayer",
  "template": { ... template defaults (brand, blocks) ... },
  "variants": [ { "property_name": "The Elm Residence", "price": "€745,000", ... } ],
  "formats": ["16:9", "9:16", "1:1", "4:5"]
}
```

Returns `{ jobId, estimatedTimeSeconds, statusUrl }`. Jobs are held in an **in-memory Map** (lost on restart — fine for v0, needs persistence for commercial).

Render flow (routes/render.ts): for each variant × each format → `renderBatch` with width/height overrides → unique sequential index → `downloads[]` + `downloadLabels[]` ("Variant 1 — 9:16").

### Known pitfalls (documented in code/skill)
- **Silent extra-arg ignore:** JS silently ignores extra args to functions that don't declare them — this caused the 9:16-landscape bug. When adding render params, update the `renderBatch` signature.
- **ZIP duplicates:** download indices must be unique per (variant, format) or `archiver` silently skips.

---

## 9. PLANNED: Per-Variant Brand Overrides (Colors in CSV)

**Status: NOT built. Requested. High priority — small change.**

### What
Today brand settings (brandColor, backgroundColor, backgroundImageUrl, etc.) are template-level — the SAME for every variant. Real-world use needs per-variant branding: "€745k listing in navy, €390k listing in green."

### How it works
Extend the variant data model so each variant row can carry brand overrides. Two compatible approaches:

**Option A (recommended, simplest):** Allow `{{placeholders}}` inside brand settings, e.g. `brandColor: "{{brand_color}}"`. Then a CSV column `brand_color` per row changes that variant's color. Implementation: in the render pipeline, resolve brand settings through the same placeholder resolver as copy fields.

**Option B (more powerful):** Allow brand settings to be an array/object per variant:
```json
{ "brandColor": "#1A365D", "backgroundColor": "#F7FAFC", "backgroundType": "image", "backgroundImageUrl": "https://cdn.example.com/listing-1.jpg" }
```
Variant row = `{ "data": {...}, "brand": {...} }`.

**Recommendation:** Implement A now (small, covers the 80% case), keep schema compatible with B later. Also add per-variant `logoUrl` and `propertyImageUrl`/`productImageUrl` — image-per-row is arguably more valuable than color-per-row.

### Validation
Zod schemas updated; `validateTemplateForComposition` extended; frontend VariantEditor/VariantTable show brand override columns when template supports them.

---

## 10. PLANNED: Per-Block Animation Presets (Buttons, not timeline)

**Status: NOT built. Requested.**

### What
Users pick an animation style per block/scene via **preset buttons** — NOT a clunky keyframe timeline:
- Ease in from right / left / top / bottom
- Bounce in from right / left
- Fade in / fade out
- Zoom in / zoom out
- Slide + fade combinations
- None (static)

### How it works
1. **Animation registry** (new file, e.g. `src/compositions/blocks/animations.ts`): each preset is a pure function of `(frame, blockStartFrame, blockDuration)` → CSS/transform values, computed inside the Remotion component. Remotion runs per-frame, so this is just a `useCurrentFrame()` computation.
2. **Schema:** add `animationIn?: string` and `animationOut?: string` to each block item in `SceneBlockPlayer` schema (and to composer block model).
3. **Frontend:** BlockEditor gets an animation picker — a row of buttons with icons/labels per preset (e.g. `← Ease In`, `→ Bounce In`, `↑ Slide Up`, `Fade`, `Zoom`).
4. **Renderer:** SceneBlockPlayer wraps each block in a `<Sequence>` and applies the preset's transform/opacity based on local frame.

### Important
- Presets are computed in the Remotion renderer (server-side), not CSS transitions — this keeps output deterministic across formats/resolutions.
- Keep preset count small (~10) for v1; they compose: `animationIn` + `animationOut` per block.
- This is one of the highest perceived-value features for non-technical users. Cheap to build, big wow.

---

## 11. PLANNED: API + MCP for AI Agents

**Status: NOT built. Requested. — This is the differentiation play.**

### Why
Ray's thesis: the real market isn't "humans clicking in a UI" — it's **AI agents needing video output**. A marketing agent, a real-estate CRM bot, an n8n workflow, a ChatGPT/Claude session — they should be able to say "render 50 property videos" and get back files. Nobody in the batch-video space is MCP-first yet. Creatomate has an API but no MCP.

### API v1 (REST)
- `POST /api/v1/templates` — create/update a template spec (JSON)
- `GET /api/v1/templates` — list
- `POST /api/v1/render` — create render job (compositionId + template + variants + formats)
- `GET /api/v1/render/:jobId` — status
- `GET /api/v1/render/:jobId/files` — file URLs
- `GET /api/v1/render/:jobId/zip` — ZIP download
- API keys (`Authorization: Bearer <key>`), per-account rate limits, webhook on completion

### MCP server (Model Context Protocol)
An MCP server exposing tools:
- `list_templates`
- `get_template_schema`
- `render_videos(template, variants, formats)` → jobId
- `get_render_status(jobId)`
- `get_render_downloads(jobId)`
- `prompt_to_template(description, style)` → creates template spec (ties into §12)

Any MCP client (Claude Desktop, ChatGPT, custom agents via `mcp` skill) can then drive Vary.video.

### Auth & multi-tenancy (needed for commercial)
- Accounts/orgs, API keys, per-account template isolation
- Render quotas by plan
- Webhook notifications
- Persisted jobs (SQLite/Postgres instead of in-memory Map)

---

## 12. PLANNED: Prompt-to-Template (The Big One)

**Status: NOT built. Architecture-ready. — This is the strategic moat.**

### The concept
User types:
> "A 15-second property video. Show price, address, bedrooms, agent name. Clean modern style, navy blue and white gradient."

System → LLM → **template spec** → appears in dropdown → user enters variants → renders.

### IMPORTANT architectural decision (critical)
**The LLM should generate a JSON template SPEC for the existing SceneBlockPlayer — NOT a new React component file.**

Generating raw React components (`RealEstateAd/index.tsx`, editing `Root.tsx`, compiling) is:
- Fragile (compile errors, Remotion API drift)
- A security risk (arbitrary code execution on the render box)
- Slow (needs build/rebuild cycle per template)

Generating a JSON spec against the block registry + brand settings + animation presets:
- Reuses the proven `SceneBlockPlayer` renderer
- No compilation, no code execution — just validated data
- Instant (spec validation only)
- Safe (Zod-validated, bounded to known blocks)

### Pipeline
```
User prompt + style
   │
   ▼
LLM (with block registry + brand schema + animation presets as context)
   │  generates
   ▼
Template spec JSON: { blocks: [{blockId, content, animationIn}], brandSettings }
   │
   ▼
Zod validation → preview frame(s) (render a still)
   │
   ▼
Saved as user template → appears in dropdown → variant data → batch render
```

### Style system
Second input for "design styles": `corporate blue`, `warm earth tones`, `neon gaming`, `minimal mono` — maps to a curated set of colour palettes, fonts, animation presets, background treatments. Stored as a `stylePresets` registry so the LLM can reference them by name instead of inventing hex codes blindly.

### Security & sandboxing
- LLM output is data-only (JSON), validated by Zod — no code path.
- Placeholder extraction: LLM declares which placeholders exist; UI renders them as CSV columns.
- Rate-limit / cost-cap template generation per account.

---

## 13. PLANNED: Infrastructure — Hetzner (NOT Lambda)

**Status: Decision point. Ray's mini PC is the current host; Hetzner is the recommended commercial host.**

### Why NOT Lambda (initially)
- Remotion Lambda (AWS) is the "right" answer at huge scale, but it's operationally heavy: AWS account, IAM, bundling the composition for Lambda, S3 for output, per-render cost, cold starts, debugging complexity.
- For a solo operator at <1000 renders/day, the complexity tax is not worth it.

### Why Hetzner (recommended)
- **One box runs everything:** Express API + Remotion renderer + Chrome + ffmpeg + (later) Postgres. No serverless split-brain.
- **Fixed predictable cost:** a dedicated/cloud box with 8–16 vCPU + 32–64GB RAM runs ~€40–90/mo. Mini PC stays as dev/test.
- **CPU-bound renders scale linearly:** more cores = more parallel renders. Remotion supports `parallel` renderer concurrency.
- **Keeps current code path identical** — the API/renderservice doesn't change; only the host does.
- Can still migrate to Lambda LATER if demand explodes (the job-queue abstraction makes this a swap, not a rewrite).

### Recommended Hetzner setup (when commercial)
- Hetzner Cloud `CCX33`/`CCX43` (dedicated vCPU, 8–16 cores) or a dedicated server (AX42+)
- Ubuntu + Node 20 + Chromium deps (the lib-fix pattern from the mini PC, just via apt this time)
- `pm2` or systemd for the API process
- Caddy/nginx reverse proxy + TLS (or keep cloudflared tunnel)
- SQLite first, Postgres when multi-tenant billing lands
- Render queue: in-memory → BullMQ/Redis or pg-boss when scale demands

### Cost reality check (for commercial pricing)
- 1 variant × 1 format ≈ 45s render on mini PC; ~15–20s on a good Hetzner box.
- Budget render cost ≈ €0.01–0.05/variant at Hetzner scale. Pricing tiers (€49–499/mo) must include render credits; overage per extra render.

---

## 14. Commercial Positioning (summary)

| Item | Answer |
|---|---|
| Vertical wedge | **Real estate first** — Ray has industry contacts; property blocks already exist |
| Who pays | Real-estate agents/brokerages, e-commerce teams, agencies (white-label) |
| Price points | $79–149/mo (agents), $149–499/mo (pro/e-commerce), $199–999/mo (agency) |
| Differentiator | Visual composer + **MCP/API for AI agents** + prompt-to-template |
| Direct competitors | Creatomate ($59–399/mo), Shotstack (API-first) — demand proven, UX is the wedge |

---

## 15. Priority Order (suggested for next build cycle)

1. **Per-variant brand overrides** (CSV colors/images) — small, unlocks the "variants" story properly
2. **Animation presets** — buttons per block, big perceived value, cheap
3. **Asset upload** (R2/cloudflare or local upload endpoint) — images per variant/template
4. **API v1 + API keys + persisted jobs** — commercial foundation
5. **MCP server** — the differentiation play
6. **Prompt-to-template** — the moat, sits on top of 1–5
7. **Hetzner deploy** — commercial infrastructure
8. **Billing** (Stripe) + accounts — last, only when users exist

---

## 16. Key Files Cheat-Sheet (for agents)

| File | Purpose |
|---|---|
| `src/Root.tsx` | Register compositions (add new template here) |
| `src/templates/registry.ts` | Template defs + Zod schemas + defaults |
| `src/compositions/SceneBlockPlayer/schema.ts` | Generic template schema (blocks/brand/data) |
| `src/compositions/blocks/registry.ts` | Block definitions + renderer map |
| `src/compositions/blocks/animations.ts` | *(planned)* animation preset registry |
| `api/src/routes/render.ts` | Batch render job orchestration |
| `api/src/services/renderer.ts` | Remotion render calls (watch silent-arg-ignore) |
| `web/src/pages/Dashboard.tsx` | Main app (quick + composer modes) |
| `web/src/components/BlockEditor.tsx` | *(extend)* per-block content + animation picker |
| `web/src/components/VariantTable.tsx` | *(extend)* brand override columns |
| `web/src/utils/csv-json.ts` | CSV/JSON import |
| `web/src/api/client.ts` | API types + client |

---

*Hand this doc to any coding agent along with the specific feature request. The block system + SceneBlockPlayer are the foundation everything else builds on — preserve them.*
