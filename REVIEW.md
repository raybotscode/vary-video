# vary-video — Product Review

## What It Is

**vary-video** is a batch video rendering platform that turns structured data (CSV files, API calls, or AI prompts) into polished, branded videos at scale. Think of it as "mail merge for video" — you define a template with dynamic fields, feed it a spreadsheet of data, and get hundreds of unique, professional videos back.

It's built for people who need to produce many variations of similar videos — not one-off edits, but systematic, data-driven video production.

## Who It's For

### Marketing Teams
Product launch videos for 50 SKUs. Real estate listings with different properties. Social media ads with localized text for 12 markets. One template, one CSV, done.

### Content Creators
YouTube intros, testimonial compilations, event promos. Upload your content, pick a template, let the AI figure out the rest.

### Agencies & Production Houses
Client needs 200 variations of a product video for A/B testing? That's a CSV upload and a render job — not 200 hours of editing.

### SaaS Platforms & Developers
REST API with JSON payloads. Embed video generation into your own product. Webhook callbacks for render completion. API key auth coming soon.

### E-Commerce
Product videos at scale. Upload a product catalog CSV, generate a video per product. Different backgrounds, text, pricing — all from one template.

## What We've Built

### Core Architecture

**Monorepo** — TypeScript throughout, shared types between API and frontend.

- **Frontend:** React + Vite + TailwindCSS — fast, modern, component-driven
- **API:** Express + SQLite (Drizzle ORM) — lightweight, zero-config persistence
- **Renderer:** Remotion (React-based video engine) — programmatic video generation
- **AI:** OpenRouter integration — template generation from natural language prompts

### Template System

8 production templates, each with:
- Zod-validated schemas for type-safe data
- Dynamic text, image, and colour fields
- Entry and exit animations (14 presets)
- Content blocks: headings, body text, CTAs, images, backgrounds, overlays, progress bars, countdown timers
- Graceful degradation — missing CSV data means blocks hide, not crashes

**Available templates:**
1. **ProductLaunch** — hero shots, pricing, CTAs
2. **RealEstate** — property photos, agent details, location info
3. **InsuranceAd** — trust messaging, coverage highlights
4. **SocialClip** — fast-paced social content
5. **WebinarPromo** — speaker info, date/time, registration
6. **Testimonial** — customer quotes, star ratings, company logos
7. **EventPromo** — venue, date, lineup, ticket info
8. **YouTubeIntro** — channel branding, episode titles

### AI Template Generation

Describe what you want in plain English. The AI:
1. Scores all 8 templates against your prompt
2. Picks the best match (score ≥ 8 = reuse directly, lower = compose from blocks)
3. Generates colour schemes, text content, and layout suggestions
4. Returns a ready-to-render template spec

Two modes:
- **Quick Prompt** — single text box, instant generation
- **AI Wizard** — 4-step guided flow: pick type → enter details → choose style → generate

### Video Rendering

Remotion-based pipeline supporting:
- **4 aspect ratios:** 16:9 (landscape), 1:1 (square), 9:16 (vertical/story), 4:5 (Instagram)
- **Batch rendering** — multiple variants × multiple formats in one job
- **Live progress** — real-time percentage tracking via polling
- **Retry** — failed renders can be retried with one click
- **Download** — individual files or ZIP archives

### Preview System

3 scale presets for rapid iteration:
- **Fast (480px)** — sub-second previews during editing
- **Medium (720px)** — good balance of speed and quality
- **Full (1080px)** — production-quality preview

Structured error responses with classification and retryable flags — no more cryptic "render failed" messages.

### Data Pipeline

- **CSV upload** — drag-and-drop with column mapping
- **Sample data** — one-click demo for every template
- **JSON API** — programmatic variant submission
- **Graceful defaults** — missing colours fall back to template defaults, missing text/images hide the block entirely

### Media & Assets

- **Pixabay integration** — search and use stock images directly
- **Image URL support** — any publicly accessible image
- **Placeholder system** — `{{column_name}}` syntax in templates

### Infrastructure

- **SQLite** — zero-config database, portable, single-file
- **Persistent job queue** — renders survive server restarts
- **AI cost tracking** — token usage and estimated cost per generation
- **Download management** — track who downloaded what

## Technical Stats

- **304 tests** across 29 test files — all passing
- **~50 commits** on main — clean git history
- **TypeScript strict mode** — full type safety
- **8 templates**, 14 animations, 13 block types
- **4 aspect ratios**, 3 preview scales
- **Zero external dependencies for DB** — just SQLite

## What's Next

- **Authentication** — user accounts, API keys, rate limiting
- **Hetzner deployment** — production hosting with GPU rendering
- **Public REST API** — developer-facing documentation
- **MCP server** — AI agent integration
- **Billing** — Stripe integration for usage-based pricing
- **Stock audio** — Freesound integration for background music
- **Webhook callbacks** — notify external systems on render completion
- **Template marketplace** — community-contributed templates

## The Bottom Line

vary-video turns "I need 100 videos" from a production nightmare into a CSV upload. It's built to be deployed, extended, and monetized — not just prototyped. The architecture is clean, the test coverage is solid, and the UX is designed for humans, not engineers.

If you need branded video at scale, this is the tool.
