# Codex: Review the Phase 2 Capability Registry Branch

You are the senior architect/reviewer for Vary.video. The feature branch `feat/capability-registry` (off `main`) implements Phase 2 of `DEVELOPMENT_PLAN.md` — the canonical capability registry.

## Your task: REVIEW ONLY. Do not modify source files. Do not commit.

Inspect the diff, review against the acceptance criteria below, write findings to `CODEX_REVIEW_phase2.md`, then print a one-line verdict (APPROVE / APPROVE_WITH_CHANGES / REQUEST_CHANGES).

## What changed (5 commits, per CODEX_SPEC_phase012.md §8)

1. `capabilities: add shared capability types, schemas, and versioned registry`
   - `src/shared/capabilities/`: types.ts, schema.ts (strict Zod), templates.ts (5 templates), blocks.ts (12 blocks), animations.ts + styles.ts (metadata-only presets), registry.ts (builder + compact AI summary + assertKnown* guards), stableStringify.ts (browser-safe), hash.ts (Node-only sha256)
2. `capabilities: make templates and blocks canonical`
   - `src/templates/registry.ts` + `src/compositions/blocks/registry.ts` consume shared metadata (runtime-only attachments stay local)
   - `web/src/utils/templates.ts` + `blocks.ts` become thin adapters
   - `@vary/shared` alias added to web/vite.config.ts + tsconfig.app.json + vitest.config.ts
   - Key fix: dropped deprecated `baseUrl` (TS6 hard error) for modern `paths`
3. `api: expose v1 capabilities`
   - `api/src/routes/v1/`: capabilities/templates/blocks/styles/animations routers + requestContext.ts (tenant-aware placeholder) + index.ts, mounted at /api/v1
   - supertest added for route tests
4. `validation: align scene block schemas`
   - SceneBlockPlayer schema rejects unknown/disabled block IDs at parse time
   - `sceneBlockPlayerTemplateSchema` in registry now imports the canonical schema (no drift)
5. `web: load templates and blocks from capabilities`
   - `useCapabilities` hook: v1 → legacy /api/compositions → local metadata fallback
   - `capabilityAdapters.ts` maps capability records to UI shapes
   - Dashboard uses the hook

## Acceptance criteria (from DEVELOPMENT_PLAN §8)

- [ ] Adding a new block to the registry makes it appear in the composer and AI capability endpoint (metadata-driven — verify no hard-coded lists remain in UI/API paths)
- [ ] The AI does not require a manually updated hard-coded template list (verify frontend templates.ts + blocks.ts no longer hand-maintain data)
- [ ] Disabled blocks cannot be selected (SceneBlockPlayer validation + assertKnown*)
- [ ] Every AI-generated template records capability version (version hash exists in registry + compact summary; frontend keeps capabilityVersion in state — verify wiring)
- [ ] Unknown block IDs fail validation with a useful error
- [ ] `GET /api/v1/capabilities` returns version, generatedAt, templates, blocks, styles, animations, compactSummary
- [ ] Legacy `/api/compositions` and `/api/render/*` still work
- [ ] Tenant-aware request context present (no org id accepted from body)
- [ ] No Node-only crypto in browser bundle (hash.ts isolated; web never imports it)
- [ ] Tests pass: 71 unit + 16 e2e

## Verification commands (run them)

```
cd /home/raymo/vary-video && npm test
npx tsc --noEmit
cd web && npm run typecheck && npm run build
export LD_LIBRARY_PATH=/home/raymo/lib-fix/libs/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
npx playwright test e2e/dashboard-responsive.spec.ts --reporter=line
```

Dev server on :5173 and render API on :3001 may be running (restart API after edits with `cd /home/raymo/vary-video && LD_LIBRARY_PATH=... npm run api` if needed). You can curl `http://localhost:3001/api/v1/capabilities` to verify live.

## Watch for

- Any remaining duplicated metadata (grep for template name/description strings outside src/shared)
- Registry builder caching: `getCapabilityRegistry` caches with stableStringify version — is generatedAt stable enough? Is version-change detection sound?
- Strictness: are the strict Zod schemas actually used at API boundaries, or only tested in isolation?
- The `capabilityVersion` state in Dashboard is captured but not yet sent anywhere — acceptable for Phase 2 (spec says only if API schema allows) — confirm no payload regression
- supertest tests: do they cover 404s and disabled-block exclusion?
- Any web-bundle leak of hash.ts / node:crypto
- Transition/edge risks for Phase 3 (per-variant branding) — does the registry metadata support it?

## Output

Write `CODEX_REVIEW_phase2.md`:
1. Verdict
2. Per-acceptance-criteria results (pass/fail/note with file:line)
3. Specific issues
4. Phase 3+ risks
5. Recommended fixes with exact paths

Be honest and specific. This is the gate before merge.
