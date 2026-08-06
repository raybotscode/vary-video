# V2 Editor — Code Review

**Date:** 2026-08-05  
**Reviewer:** Raybot (manual review after Zustand migration)  
**Files reviewed:** 19 files in `web/src/v2/`

---

## Architecture Verdict: ✅ SOLID

The Zustand + command dispatcher architecture is sound. Clean separation between document state (persistent) and editor state (ephemeral). All 17 EditorCommand variants have handlers. TypeScript strict mode passes.

---

## What's Solid

### 1. Document Store (`stores/documentStore.ts`)
- ✅ `dispatch(EditorCommand)` — single entry point for all mutations
- ✅ HistoryManager integration — undo/redo handled at store level
- ✅ Scene-scoped snapshots (not full document) — memory efficient
- ✅ `loadDocument()` validates via Zod, clears history cleanly
- ✅ `createEmptyDocument()` returns a valid V2Document with defaults
- ✅ Convenience getters: `getActiveScene()`, `getElements()`, `getElement(id)`

### 2. Editor Store (`stores/editorStore.ts`)
- ✅ Correctly separated — selection, interaction, panel state
- ✅ `InteractionState` captures all needed data for drag/resize/rotate
- ✅ `ResizeHandle` covers all 8 corners + midpoints
- ✅ All interaction methods exist and snapshot `startTransform`
- ✅ `stageScale` clamped to 0.25-2.0

### 3. Command System (`commands/`)
- ✅ `types.ts` — 17 command variants, clean discriminated union
- ✅ `history.ts` — 100-entry stack, branch-on-push-after-undo, deep clones
- ✅ `commands.ts` — all handlers are pure functions, return `{document, shouldRecord}`
- ✅ Element factory creates elements from registry defaults with unique IDs

### 4. Coordinate System (`utils/coordinates.ts`)
- ✅ `calculateStageRect()` — fits-by-height or fits-by-width, centers
- ✅ `screenToNormalized()` — clamps to 0-1
- ✅ `screenDeltaToNormalized()` — critical for drag/resize/rotate
- ✅ `normalizedToScreen()` — dual conversion available

### 5. Editor Shell & Stage
- ✅ `Editor.tsx` — clean 3-panel layout (Layers | Stage | Properties)
- ✅ Keyboard shortcuts: Delete, Ctrl+D, Ctrl+Z/Y, Escape, arrow nudge
- ✅ `Stage.tsx` — ResizeObserver for responsive scaling, gradient background support
- ✅ Element renderers sorted by zIndex before rendering

### 6. Renderers
- ✅ `TextRenderer` — font size scaled by stage scale factor
- ✅ `ImageRenderer` — placeholder when no valid src
- ✅ `ShapeRenderer` — rectangle, circle, line support
- ✅ `ElementRenderer` — dispatcher by element type, handles selection outline

### 7. Panels
- ✅ `PropertiesPanel` — reads `PropertyMetadata` from registry, groups by category
- ✅ Supports: text, number, slider, color (swatches + hex input), select, boolean
- ✅ Transform section: X, Y, Width, Height, Rotation, Z-Index, Opacity
- ✅ Nullable width/height with auto-toggle
- ✅ `LayersPanel` — visibility toggle, lock toggle, reorder, delete, duplicate
- ✅ `EditorToolbar` — undo/redo buttons, add text/shape/image, delete/duplicate, zoom

### 8. Selection
- ✅ `SelectionOverlay` — dashed blue outline, 8 resize handles, rotation handle
- ✅ Correct cursor styles per handle (nwse-resize, ns-resize, etc.)
- ✅ Handles are positioned absolutely with CSS offsets
- ✅ Overlay renders on a separate z-index layer (zIndex + 1000)

### 9. Exports (`index.ts`)
- ✅ Clean barrel exports: Editor, stores, commands, utilities

---

## What's Incomplete / Needs Work

### 🔴 CRITICAL

#### 1. Drag/resize/rotate interaction hooks are stubbed
**Files:** `editorStore.ts` lines 121-123, 144-146, 165-167  
**Issue:** `updateDrag()`, `updateResize()`, and `updateRotate()` are no-ops. They capture state but don't transform it.  
**Impact:** Users can start dragging but nothing moves during the drag.  
**Fix needed:** Create `useDrag.ts`, `useResize.ts`, `useRotate.ts` hooks that:
- Listen to `pointermove` on window (with `setPointerCapture`)
- Convert screen deltas to normalized coordinates using `screenDeltaToNormalized()`
- Call `documentStore.dispatch()` during move
- Commit final position on pointerup
- Store should NOT create history entries during drag (ephemeral), only on commit

#### 2. Drag wired inline in Stage.tsx, not via dedicated hook
**File:** `Stage.tsx` lines 89-108  
**Issue:** Drag logic is inlined in the Stage component's `handlePointerMove`. This works for basic dragging but:
- Doesn't use `setPointerCapture` (loses tracking if cursor leaves stage)
- Doesn't support resize/rotate
- Mixes concerns (Stage should delegate to interaction hooks)
**Fix needed:** Extract to `useDrag.ts` hook.

#### 3. Drag starts from SelectionOverlay, not element
**File:** `SelectionOverlay.tsx` line 85 (`onPointerDown={onDragStart}`)  
**Issue:** The drag starts when clicking the selection overlay's bounding div, but the `ElementRenderer` also has its own `onPointerDown` for selection. The overlay's drag start won't fire for the initial mousedown — the element gets selected first on first click, then the second click starts the drag on the overlay.  
**Recommended flow:** 
1. Click on element → select it
2. mousedown on selected element → start drag
3. Move → update position
4. mouseup → commit

#### 4. Resize/rotate handle interactions not implemented
**Files:** `SelectionOverlay.tsx` — handles rendered but `useResize.ts` and `useRotate.ts` don't exist  
**Impact:** Resize handles and rotation handle are visible but non-functional.  
**Fix needed:** Implement resize math per handle corner (8 handles), rotation math (atan2 from element center).

### 🟡 MEDIUM

#### 5. No `_ephemeral` flag honored in dispatch
**File:** `documentStore.ts` line 81  
**Issue:** The `EphemeralCommand` type is defined in `types.ts` (line 146-148) but `dispatch()` in `documentStore.ts` only accepts `EditorCommand`, not `EphemeralCommand`. The comment says "Interaction commands can set `_ephemeral: true`" but this isn't actually implemented.  
**Impact:** Every SET_POSITION during drag creates an undo entry, flooding history.  
**Fix:** Either extend dispatch to accept ephemeral commands, or use a separate `dispatchEphemeral()` method.

#### 6. Z-order in LayersPanel uses direct zIndex mutation, not MOVE_ELEMENT command
**File:** `panels/LayersPanel.tsx` lines 65-73  
**Issue:** The move-up/move-down buttons dispatch `SET_ELEMENT_PROP` with `key: 'zIndex'` instead of the `MOVE_ELEMENT` command. This works but bypasses array reordering — elements stay in the same array position but with different zIndex.  
**Impact:** If zIndex gaps close up after repeated moves, elements can overlap incorrectly.  
**Fix:** Either use `MOVE_ELEMENT` to reorder in the array, or implement zIndex gap management (reindex all elements on move).

#### 7. No add-element dialog for setting zIndex position
**File:** `EditorToolbar.tsx` and `commands.ts`  
**Issue:** When adding an element via `ADD_ELEMENT`, it goes to the end of the array with zIndex=10. This ignores the existing element count.  
**Impact:** New elements may appear behind existing ones.  
**Fix:** Set zIndex = scene.elements.length * 10 on creation.

#### 8. StageScale not used in Stage.tsx
**File:** `editorStore.ts` — `stageScale` state exists, `EditorToolbar` has zoom buttons  
**Issue:** The `stageScale` is read by the toolbar for display, but `Stage.tsx` doesn't actually apply the CSS scale transform.  
**Impact:** Zoom buttons change the scale number but the stage doesn't zoom.  
**Fix:** Apply `transform: scale(stageScale)` to the stage container.

#### 9. Image element cannot actually load images
**File:** `ImageRenderer.tsx`  
**Issue:** Image elements show a placeholder unless `props.src` is a valid non-template URL. The properties panel has no image upload/picker.  
**Impact:** Image elements are decorative only in the editor.  
**Fix:** Later phase — integrate Pixabay picker or URL input with preview.

### 🟢 LOW

#### 10. Font rendering limited to web-safe fonts
**Issue:** The font selector offers 5 fonts (Inter, Arial, Georgia, Montserrat, Roboto) but only Inter is loaded via `@remotion/google-fonts` in the v1 renderer. In the DOM editor, they'll render if system fonts are available.  
**Impact:** Fonts may look different between editor and renderer.

#### 11. No text wrapping preview for constrained dimensions
**File:** `TextRenderer.tsx`  
**Issue:** When height is set, text uses flex alignment. But there's no overflow handling or line clamping.  
**Impact:** Long text may overflow the element bounds.

#### 12. No inline text editing
**Status:** Deferred to Phase 4 as planned.  
**Current state:** Text content editable only via Properties panel.

#### 13. No snapping or alignment guides
**Status:** Deferred to Phase 4 as planned.

#### 14. Arrow key nudge creates one undo entry per keypress
**File:** `Editor.tsx` lines 79-94  
**Issue:** Each nudge dispatches `NUDGE_ELEMENT` which records history. Holding an arrow key floods the undo stack.  
**Fix:** Debounce nudge commands, or group rapid nudges into a single undo entry.

#### 15. No multi-select support
**Status:** Single selection only, as planned for Phase 3.

---

## TypeScript & Test Status

- ✅ `tsc -b --noEmit` passes for all v2 code
- ✅ 384 tests pass (33 test files; 319 v1 + 24 schema + 21 registry + 20 editor)
- ⚠️ 8 pre-existing TS errors in v1 web components (unrelated to v2)

---

## Summary

| Area | Status |
|---|---|
| Architecture (Zustand + commands) | ✅ Excellent |
| Document store + history | ✅ Complete |
| Editor store (selection, interaction) | ✅ State defined, actions exist |
| Command system (17 types) | ✅ All implemented |
| Stage viewport + scaling | ✅ Working |
| Element renderers (3 types) | ✅ Working |
| Selection overlay + handles | ✅ Rendered |
| Properties panel (schema-driven) | ✅ Working |
| Layers panel | ✅ Working |
| Editor toolbar | ✅ Working |
| Keyboard shortcuts | ✅ Working |
| Undo/redo | ✅ Working |
| **Drag interaction** | ⚠️ Partial (inline in Stage, no pointer capture) |
| **Resize interaction** | ❌ Not implemented |
| **Rotate interaction** | ❌ Not implemented |
| **Ephemeral commands** | ❌ Typed but not wired |
| **Stage zoom** | ❌ Toolbar wired, CSS not applied |
| **Image loading** | ⚠️ Placeholder only |

### Recommendation

**Ship Phase 3 as-is**, then tackle these Phase 3.5 items before Phase 4:

1. Extract drag to `useDrag.ts` hook with `setPointerCapture`
2. Implement `useResize.ts` with handle-specific math
3. Implement `useRotate.ts` with atan2 math
4. Wire `_ephemeral` flag in dispatch (suppress undo during drag)
5. Apply stageScale CSS transform
6. Fix add-element zIndex to use element count

These 6 items would make the editor fully interactive. Then Phase 4 (inline text, snapping, Remotion integration) builds on a complete editor.
