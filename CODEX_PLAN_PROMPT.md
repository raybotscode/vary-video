# Codex: Phase 0/1/2 File-Level Implementation Plan for Vary.video

You are the senior architect for the Vary.video project. Your task is INSPECTION AND PLANNING ONLY. Do NOT modify, create, or delete any source files. Do NOT run any build/test commands that change state. Produce a file-level implementation plan and write it to `CODEX_SPEC_phase012.md` in the repo root.

## Project

- Repo: /home/raymo/vary-video
- Stack: Remotion 4.x (React/TS compositions), Express + Zod API (`api/`), Vite + React frontend (`web/`), Cloudflare Pages (static frontend), render API runs on a local machine (mini PC) because Remotion needs Node + Chromium + FFmpeg.
- The full development brief is `DEVELOPMENT_PLAN.md` in the repo root. READ IT FIRST, in full. It defines the model roles (you = planner/reviewer; DeepSeek = implementer), non-negotiable principles (mobile-first, touch-friendly, tenant-aware, progressive complexity), target architecture (SQLite + Drizzle later, Hetzner for commercial, API v1 routes, capability registry), and 13 phases.

## Context you should know

- The current system: quick mode (pick template → edit copy → import/enter variants → pick formats → batch render → download/ZIP), plus a partially built block-based composer and a generic JSON-driven composition `SceneBlockPlayer` (blocks + brandSettings + data).
- Duplication already identified: `web/src/utils/templates.ts` hand-maintains the same 5 template definitions as `src/templates/registry.ts`. Block registry exists in BOTH `web/src/utils/blocks.ts` and `src/compositions/blocks/registry.ts` (currently in sync, 12 blocks).
- Baseline: 24/24 tests pass, all typechecks clean, web production build passes, smoke render verified 16:9 + 9:16 output through the live API. Sample CSVs exist in `samples/`, a smoke script in `scripts/smoke-test.sh`, and `TECHNICAL_OVERVIEW.md` documents the full architecture.
- Known architectural constraint: the render API CANNOT run on serverless (Remotion needs Chrome). Keep it on a real machine.
- The AI/prompt-to-template feature must generate VALIDATED JSON specs for SceneBlockPlayer — never executable React components, never modify the composition registry at runtime.
- New DB/API code must be tenant-aware from day one (organisation_id ownership fields), even before accounts launch.

## What to produce

Read the current codebase thoroughly (web/src, api/src, src/compositions, src/templates, src/components). Then produce a detailed FILE-LEVEL IMPLEMENTATION PLAN covering:

### Phase 0 completion (finish the baseline audit)
The audit is partially done (tests/typechecks/builds/smoke/samples). Remaining deliverables per DEVELOPMENT_PLAN §6: a written `docs/current-state-audit.md` covering everything already verified PLUS the not-yet-run checks (CSV/JSON import confirmation, tunnel override behaviour, per-template render times, dead-code inventory, Zod-schema-vs-runtime confirmation). Specify exactly what the audit doc must contain and what scripts/checks are still needed.

### Phase 1: Mobile-first UI foundation (DEVELOPMENT_PLAN §7)
- Design tokens (CSS custom properties)
- Responsive app shell (navbar/footer/container/toasts/dialogs)
- Dashboard single-column mobile workflow + desktop 2-3 column workspace
- Mobile composer interaction model (bottom tabs, sheets, vertical list, move-up/down buttons)
- Responsive variant editor (card-per-variant on mobile, table on desktop)
- Responsive render results
- Playwright viewport tests + screenshots
For each: exact files to modify, new files to create, shared components to extract.

### Phase 2: Canonical capability registry (DEVELOPMENT_PLAN §8)
- Single source of truth for templates/blocks/animation presets/style presets
- How to consolidate the template duplication (web/src/utils/templates.ts vs src/templates/registry.ts) — recommend the cleanest consolidation that keeps both frontend and backend working
- `GET /api/v1/capabilities` (and related endpoints)
- Capability versioning/hash
- Frontend integration (composer + quick mode read from the registry)

## Required plan structure

For every task include:
1. **Files to modify** (exact paths)
2. **New files to create** (exact paths)
3. **Shared types to consolidate** (where the duplication lives now, what the target shared module is)
4. **Tests to add** (exact test file paths, what they cover)
5. **Risks** (specific to this codebase: the silent-extra-arg renderer footgun, the sceneOffset/startFrame coupling in adapters.tsx, the transitionFrames logic in SceneBlockPlayer, etc.)
6. **Commit boundaries** (small reviewable commits grouped by feature — name each commit)
7. **Verification steps** (commands to run: typecheck, tests, build, render smoke)

Also add a short "Architecture risks Codex sees" section — anything in the current code that will bite during Phases 1-2.

## Constraints

- Preserve SceneBlockPlayer and the block system. Do not propose a replacement template system.
- Mobile-first: 320px minimum, 44px touch targets, no horizontal page scroll.
- No large UI framework unless clearly justified.
- Do NOT introduce the database/accounts in Phases 1-2 (that's Phase 5/10) — but note where tenant-awareness will slot in.
- Keep API v1 routes additive; existing routes keep working.

## Output

Write the complete plan to `/home/raymo/vary-video/CODEX_SPEC_phase012.md`. Make it concrete enough that an implementer (DeepSeek) can execute it file-by-file without re-deriving decisions. When finished, print a one-line summary of the plan's size and its top 3 risks.
