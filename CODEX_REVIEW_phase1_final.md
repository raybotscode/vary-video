# Verdict

APPROVE_WITH_CHANGES

# Per-Finding Resolution

1. **Blocking - download URL double `/api` prefix: resolved.**
   Evidence: `web/src/api/client.ts:108` adds `resolveApiPath`, passes absolute HTTP(S) URLs through unchanged, strips a leading `/api` only when the normalized base already ends in `/api`, and strips trailing slashes from the base before joining. `web/src/api/client.test.ts:4` covers the seven requested shapes: absolute URLs, `/render/...`, `/api/...` with default `/api`, tunnel base ending in `/api`, tunnel origin without `/api`, `/api/...` against a non-`/api` origin, and trailing slash base.

2. **LoadingState/EmptyState dead code: resolved.**
   Evidence: `web/src/pages/Dashboard.tsx:345` wires `LoadingState` into the template-loading `rightSlot`. `web/src/pages/RenderHistory.tsx:12` renders `EmptyState` as the real empty render-history body. These are genuine render paths, not inert imports.

3. **Palette sheet keyboard behavior: resolved.**
   Evidence: `web/src/components/composer/ComposerWorkspace.tsx:39` stores the opener in an explicit `paletteOpenerRef`, and `web/src/components/composer/BlockPaletteSheet.tsx:30` closes the sheet and returns focus to that opener. Escape handling is registered at `web/src/components/composer/BlockPaletteSheet.tsx:37`. The e2e coverage at `web/e2e/dashboard-responsive.spec.ts:120` verifies Escape closes the sheet and focus returns to the Add Block button.

4. **Composer tabs ARIA: partial.**
   Evidence: `web/src/components/composer/ComposerTabs.tsx:55` defines `role="tablist"`, tabs have `role="tab"`, `aria-selected`, `aria-controls`, and roving `tabIndex`, and `web/src/components/composer/ComposerWorkspace.tsx:100` / `web/src/components/composer/ComposerWorkspace.tsx:119` define matching `tabpanel` regions with `aria-labelledby`. Arrow, Home, and End navigation are implemented at `web/src/components/composer/ComposerTabs.tsx:32`.

   Remaining issue: keyboard navigation does not account for the disabled Content tab. When no block is selected, `web/src/components/composer/ComposerTabs.tsx:73` disables Content, but `web/src/components/composer/ComposerTabs.tsx:49` still allows ArrowRight/End from Scenes to call `onChange('content')`. That can make the disabled tab active and render the Content panel despite the "Select a scene first" disabled state. This is not covered by the current e2e test.

5. **`.sr-only` missing: resolved.**
   Evidence: `web/src/index.css:114` defines a standard visually-hidden `.sr-only` utility while keeping the content accessible.

6. **Tests for the fixes: resolved.**
   Evidence from verification:
   - `npm test`: 5 files passed, 31 tests passed.
   - `cd web && npm run typecheck && npm run build`: typecheck passed; Vite production build completed.
   - `cd web && npx playwright test e2e/dashboard-responsive.spec.ts --reporter=line` with the requested `LD_LIBRARY_PATH`: 16 passed.

# New Issues Introduced By The Fixes

- `web/src/components/composer/ComposerTabs.tsx:49`: Arrow/Home/End keyboard navigation can activate the disabled Content tab because the next tab is chosen from `TABS` without filtering or guarding disabled tabs. The fix should either skip disabled tabs during keyboard navigation or avoid disabling the Content tab and instead present an empty/selection-required tabpanel.

# Final Merge Recommendation

The original blocking download URL issue is fixed and the requested test suite passes. I would allow merge after addressing the small tab-keyboard edge case above, or merge with an immediate follow-up if the team accepts that accessibility caveat.
