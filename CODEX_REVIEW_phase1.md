# Phase 1 Mobile-First Foundation Review

## Verdict

REQUEST_CHANGES

The branch largely delivers the responsive foundation and the committed responsive Playwright suite passes, but I found a render-download URL regression that breaks completed render downloads whenever the API returns its current `/api/render/download/...` paths. There are also smaller acceptance gaps around the newly added feedback primitives and mobile sheet keyboard behavior.

## Verification

- `cd web && npm run typecheck` - passed.
- `cd web && npx playwright test e2e/dashboard-responsive.spec.ts` - 14 passed.
- Manual Playwright smoke at 320x800 for dashboard and composer - `scrollWidth === clientWidth` for both.
- Existing dev server on `http://localhost:5173` was used.

## Per-Check Results

- No page-level horizontal scrolling at 320/360/390/430/768/1024/1440: PASS. The committed suite covers 360/390/430/768/1024/1440, and a manual 320px smoke check also passed.
- Core workflows work with touch only, 44px targets: PASS with notes. Main mobile actions, timeline controls, variant controls, nav toggle, and composer tabs use mobile-sized targets. Some desktop `.ghost-button` and `.secondary-button` defaults are below 44px, but mobile-specific controls are mostly corrected.
- Core workflows work with keyboard only: FAIL. Basic buttons/inputs are keyboard reachable and nav Escape works, but the mobile block palette dialog lacks Escape close/focus management, and composer tabs use partial ARIA tab semantics without panel wiring or arrow-key behavior.
- Composer genuinely usable on mobile: PASS with notes. Tabs, sheet, and Up/Down controls remove the drag dependency. Keyboard behavior of the sheet still needs work.
- Variant editor card-per-variant on mobile, table on desktop: PASS. `web/src/index.css:439` through `web/src/index.css:448` transform the table rows into mobile cards.
- Render results responsive: PASS. `web/src/index.css:450` through `web/src/index.css:455` stack result rows into mobile cards.
- Toast/dialog/loading/empty states implemented and used: FAIL. ToastProvider is mounted and used for import errors, but `LoadingState` and `EmptyState` are unused.
- No large UI framework introduced: PASS. Only Playwright was added as a dev dependency.
- Existing render payload behavior preserved: PASS with notes. Quick mode still submits the existing template/variants/formats payload; composer mode still submits `SceneBlockPlayer` with block sequence.
- Tunnel-safe URL resolution centralized: FAIL. The logic is centralized, but the new helper mishandles current API-relative download URLs.
- Tests exist and pass; Playwright viewports match required list: PASS with notes. The responsive suite covers the required 360/390/430/768/1024/1440 set and passes. It does not assert the download URL helper or keyboard Escape behavior for the palette sheet.
- Accessibility: aria labels, roles, focus-visible, keyboard alternatives: FAIL. There are improvements, but the sheet dialog and tab implementation are incomplete.
- No regressions to quick mode / composer / render flow: FAIL. Completed individual render downloads regress due to `/api/api/...` URLs.

## Specific Issues

1. Blocking: individual render downloads are double-prefixed with `/api`.

   `api/src/routes/render.ts:128` stores download URLs as `/api/render/download/${jobId}/${sequentialIndex}`, and `api/src/routes/render.ts:140` returns those exact values in `status.downloads`. The new `resolveApiUrl` implementation in `web/src/api/client.ts:104` through `web/src/api/client.ts:108` blindly calls `apiUrl(pathOrUrl)`, where `apiBase` defaults to `/api` at `web/src/api/client.ts:96`. `RenderProgress` then applies that helper at `web/src/components/RenderProgress.tsx:80` through `web/src/components/RenderProgress.tsx:82`.

   Result: a normal API response download path like `/api/render/download/job/0` becomes `/api/api/render/download/job/0` in local/default deployments. With `window.__VARY_API_URL = "https://api.example.com/api"`, it becomes `https://api.example.com/api/api/render/download/...`. This breaks the individual MP4 links. ZIP downloads still use `apiClient.getZipDownloadUrl(jobId)` and remain `/api/render/download-zip/...`, so this bug is specific to `status.downloads`.

   Recommended fix: update `web/src/api/client.ts` so `resolveApiDownloadUrl` handles all current shapes:
   - absolute `http(s)` URL: return as-is
   - `/api/...`: if `apiBase` ends in `/api`, strip the leading `/api` before joining, or resolve against the origin/base without duplicating
   - `/render/...`: join with `apiBase`
   Add a unit or Playwright-level assertion for `resolveApiDownloadUrl('/api/render/download/job/0')`.

2. Acceptance gap: `LoadingState` and `EmptyState` are dead code.

   `web/src/components/ui/LoadingState.tsx:1` through `web/src/components/ui/LoadingState.tsx:13` and `web/src/components/ui/EmptyState.tsx:14` through `web/src/components/ui/EmptyState.tsx:29` are added, but `rg` only finds their definitions. The checklist explicitly requires toast/dialog/loading/empty states to be implemented and used, not dead code. Toasts are mounted in `web/src/App.tsx:70` and used by `web/src/components/VariantEditor.tsx:80` through `web/src/components/VariantEditor.tsx:83`; loading and empty states are not.

   Recommended fix: use `LoadingState` for the template/composition loading area in `web/src/pages/Dashboard.tsx` or another real async section, and use `EmptyState` for empty render history, zero compatible blocks, or zero variants as appropriate.

3. Acceptance gap: the mobile block palette dialog lacks keyboard close/focus behavior.

   `web/src/components/composer/BlockPaletteSheet.tsx:22` correctly declares `role="dialog"` and `aria-modal="true"`, but there is no Escape handler, no initial focus placement, no return focus to the opening "Add Block" button, and no backdrop/close-on-Escape behavior. The nav menu implements Escape handling at `web/src/components/Navbar.tsx:26` through `web/src/components/Navbar.tsx:39`; the sheet should meet the same keyboard acceptance bar.

   Recommended fix: add Escape handling and focus management in `web/src/components/composer/BlockPaletteSheet.tsx` and/or `web/src/components/composer/ComposerWorkspace.tsx`. Add a Playwright test that opens the sheet, presses Escape, and verifies focus returns to the opener.

4. Accessibility semantics: composer tabs are only partially implemented.

   `web/src/components/composer/ComposerTabs.tsx:19` through `web/src/components/composer/ComposerTabs.tsx:40` use `role="tablist"` and `role="tab"`, but there are no `aria-controls`/`id` links to tab panels, no tab panel roles, and no arrow-key behavior. Native buttons still work with Tab/Enter/Space, so this is not a functional blocker by itself, but once ARIA tab roles are used, the full pattern should be implemented.

   Recommended fix: either downgrade this to a segmented button group without tab roles, or complete the ARIA tab pattern in `web/src/components/composer/ComposerTabs.tsx` and `web/src/components/composer/ComposerWorkspace.tsx`.

5. User-visible polish: `.sr-only` is referenced but not defined.

   `web/src/App.tsx:81` renders `<span className="sr-only">{title}</span>`, but `web/src/index.css` has no `.sr-only` rule. The route title therefore renders visibly at the end of the layout instead of being screen-reader-only.

   Recommended fix: add a standard `.sr-only` utility to `web/src/index.css`, or remove the span if it is not needed.

## Phase 2/3 Risks

- The download URL issue is the main Phase 2 risk because it shows API path normalization is still ambiguous. Capability registry work will likely add more API-produced URLs; centralization is good, but the helper needs explicit path-shape tests before more consumers depend on it.
- Keeping dashboard state in `Dashboard.tsx` is appropriate for this phase. I did not see a premature state refactor into the new presentation directories.
- The composer mobile structure is a reasonable base for per-variant branding in Phase 3, but variant rows still use generic unlabeled inputs at `web/src/components/VariantTable.tsx:34` through `web/src/components/VariantTable.tsx:46`. When per-variant branding adds more fields, add explicit accessible labels or `aria-label`s so mobile card labels are not CSS-only.

## Recommended Fixes Before Merge

- `web/src/api/client.ts`: fix `resolveApiDownloadUrl` path normalization and cover `/api/...`, `/render/...`, and absolute URLs.
- `web/src/components/RenderProgress.tsx`: keep consuming the centralized helper after the helper is fixed.
- `web/src/components/composer/BlockPaletteSheet.tsx` and `web/src/components/composer/ComposerWorkspace.tsx`: add Escape close and focus return for the mobile sheet.
- `web/src/components/composer/ComposerTabs.tsx` and `web/src/components/composer/ComposerWorkspace.tsx`: complete or simplify tab semantics.
- `web/src/pages/Dashboard.tsx` or `web/src/pages/RenderHistory.tsx`: wire `LoadingState` and `EmptyState` into real states.
- `web/src/index.css`: define `.sr-only`.
- `web/e2e/dashboard-responsive.spec.ts`: add assertions for sheet Escape behavior and download URL resolution, or add a smaller unit test if a unit test runner exists later.
