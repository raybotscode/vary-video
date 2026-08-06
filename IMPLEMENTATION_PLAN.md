# Vary.video v2 Editor — Export & Aspect Ratio Implementation Plan

## Table of Contents
1. [Codebase Analysis](#codebase-analysis)
2. [File-by-File Changes](#file-by-file-changes)
3. [New Files to Create](#new-files-to-create)
4. [State Management Approach](#state-management-approach)
5. [Data Flow](#data-flow)
6. [UI Component Tree for Export Panel](#ui-component-tree-for-export-panel)
7. [Render Pipeline](#render-pipeline)
8. [Edge Cases](#edge-cases)
9. [Estimated Complexity & Implementation Order](#estimated-complexity--implementation-order)

---

## Codebase Analysis

### Architecture Summary

**Store Layer:**
- `documentStore.ts` — Zustand store; source of truth for `V2Document`. Has `dispatch()`, undo/redo, `getElement()`, `getElements()`, `getActiveScene()`. Document `name` defaults to `'Untitled'`.
- `editorStore.ts` — Zustand store for ephemeral UI state: selection, interaction, stage viewport (`aspectRatio`, `stageScale`), panel toggles (`mobileLayersOpen`, `mobileSheetOpen`), playback, inline editing. Follows a `openX`/`closeX` boolean-toggle pattern for panels.
- `mergeDataStore.ts` — Zustand store for CSV/JSON merge data. Fields: `rows: Record<string, string>[]`, `headers: string[]`, `previewRowIndex`, `columnMapping`, `importSource`, `importFilename`. Actions: `setRows`, `setHeaders`, `setPreviewRow`, `reset`, `getResolvedValues`.

**Editor Layout (mobile):**
```
┌─ MobileTopBar (48px) ──────────────────────┐
│ [✕] [↩][↪][🗑][⊕]  spacer  [16:9][9:16][1:1] [▶][☰] │
├─────────────────────────────────────────────┤
│               Stage Viewport                │
├─────────────────────────────────────────────┤
│        MobileBottomPanel (260-45vh)         │
│   [data row nav] [tab bar] [tab content]    │
└─────────────────────────────────────────────┘
+ MobileLayersSheet (portal overlay, on ☰ tap)
```

**Bottom Sheet Pattern (MobileLayersSheet.tsx):**
- Uses `createPortal(content, document.body)`
- Fixed backdrop overlay at `zIndex: 10998` with `rgba(0,0,0,0.4)`
- Sheet at `zIndex: 10999`, `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`
- `borderTopLeftRadius: 20`, `maxHeight: '60vh'`
- Slide-up animation: `@keyframes layersheet-up { from: translateY(100%); to: translateY(0); }`
- Header: title, subtitle/count, close button (×)
- Scrollable content body
- Toggle via `open` boolean in editorStore

**Existing Render Infrastructure:**
- **API endpoint:** `POST /api/render/batch` — accepts `{compositionId, template, variants, formats}` (formats is `['16:9','1:1','9:16','4:5']`)
- **API endpoint:** `GET /api/render/status/:jobId` — returns `{status, progress, completedVariants, totalVariants, downloads[], downloadLabels[], error, formats[]}`
- **API endpoint:** `GET /api/render/download/:jobId/:variantIndex` — file download
- **API endpoint:** `GET /api/render/download-zip/:jobId` — ZIP download via `archiver`
- **renderer.ts:** `renderBatch()` uses Remotion bundler, calls `renderMedia()` for each variant × format combination
- **API client:** `apiClient.startBatchRender()`, `apiClient.getRenderStatus()`, `apiClient.getZipDownloadUrl()`
- **Remotion composition:** `SceneBlockPlayer` registered in `src/Root.tsx` with `calculateMetadata` that reads `width`, `height`, `fps`, `blocks` from input props

**Document Schema:**
- `V2Document.name` (string, min 1, max 200) — project title
- `V2Document.description` (string, max 1000)
- `V2Document.metadata` (Record<string, unknown>) — extensible
- `V2Document.defaultAspectRatio` — the default/starting ratio
- `V2Document.supportedAspectRatios` — which ratios are enabled

**Key Pattern: Aspect Ratio Handling**
- `editorStore.aspectRatio` holds current viewport ratio (type: `AspectRatio = '16:9' | '9:16' | '1:1'`)
- `editorStore.setAspectRatio(ratio)` sets it
- `Stage.tsx` recalculates `stageRect` via `calculateStageRect(containerWidth, containerHeight, aspectRatio)` on aspect ratio change
- Document has `defaultAspectRatio` and `supportedAspectRatios`
- Elements have `responsiveOverrides` per aspect ratio for repositioning

---

## File-by-File Changes

### 1. `/home/raymo/vary-video/web/src/v2/stores/editorStore.ts`

**Changes:**

```typescript
// Add to EditorState interface:
export interface EditorState {
  // ... existing fields ...

  // ─── Export ─────────────────────────────────────────────────
  exportPanelOpen: boolean;
  
  // ─── Export Actions ──────────────────────────────────────────
  openExportPanel: () => void;
  closeExportPanel: () => void;
}

// Add to initial state:
exportPanelOpen: false,

// Add actions:
openExportPanel: () => set({exportPanelOpen: true}),
closeExportPanel: () => set({exportPanelOpen: false}),
```

This follows the identical `mobileLayersOpen`/`openMobileLayers`/`closeMobileLayers` pattern already used in the store (lines 58-59, 140, 232-233).

### 2. `/home/raymo/vary-video/web/src/v2/editor/toolbar/MobileTopBar.tsx`

**Changes:**
1. Replace three `AspectRatioBtn` components with a single `CyclingAspectRatioBtn`
2. Add `ExportBtn` next to it
3. Remove the three separate `<AspectRatioBtn>` calls

**New `CyclingAspectRatioBtn` component logic:**
```typescript
import {ASPECT_RATIOS} from '@vary/v2/schema/document';

function CyclingAspectRatioBtn() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  
  const handleCycle = () => {
    const currentIdx = ASPECT_RATIOS.indexOf(aspectRatio);
    const nextIdx = (currentIdx + 1) % ASPECT_RATIOS.length;
    setAspectRatio(ASPECT_RATIOS[nextIdx]);
  };
  
  return (
    <button onClick={handleCycle} title={`Aspect ratio: ${aspectRatio} (tap to cycle)`} style={{
      background: '#2D3748',
      border: '1px solid #374151',
      color: '#D1D5DB',
      fontSize: 11, fontWeight: 600, cursor: 'pointer',
      padding: '4px 8px', borderRadius: 6,
      minWidth: 36, minHeight: 32,
      whiteSpace: 'nowrap',
    }}>{aspectRatio}</button>
  );
}
```

**New `ExportBtn` component:**
```typescript
function ExportBtn() {
  const openExportPanel = useEditorStore((s) => s.openExportPanel);
  return (
    <TopBtn onClick={openExportPanel} title="Export" 
      style={{color: '#34D399', fontWeight: 700}}>
      ⬇
    </TopBtn>
  );
}
```

**Layout change:** Replace lines 67-70 (three `AspectRatioBtn` calls) with:
```tsx
<CyclingAspectRatioBtn />
<ExportBtn />
```

The freed space from 3 buttons → 2 buttons gives room for the Export button without crowding.

### 3. `/home/raymo/vary-video/web/src/v2/editor/Editor.tsx`

**Changes:**
1. Import `MobileExportSheet` from `'./panels/MobileExportSheet'`
2. Add `<MobileExportSheet />` in the render tree, alongside `<MobileLayersSheet />` (after line 193)

```tsx
import MobileExportSheet from './panels/MobileExportSheet';

// In JSX, after <MobileLayersSheet />:
<MobileExportSheet />
```

### 4. `/home/raymo/vary-video/web/src/v2/schema/document.ts`

**No changes needed.** The document already has:
- `name` field (line 278) — project title
- `metadata` field (line 285) — extensible storage
- `ASPECT_RATIOS` constant (line 23) — already exported and used

For project naming, we'll use `document.name` (editable) and `document.metadata` for export-specific settings if needed.

---

## New Files to Create

### 1. `/home/raymo/vary-video/web/src/v2/stores/exportStore.ts`

A dedicated Zustand store for export panel state that persists across panel open/close cycles.

```typescript
/**
 * Export Store — Zustand store for export panel state.
 * 
 * Persists settings, progress, and download URLs across
 * panel open/close cycles so users don't lose their place.
 */

import {create} from 'zustand';
import type {AspectRatio} from '@vary/v2/schema/document';

export type RowSelectionMode = 'all' | 'single' | 'range';

export interface ExportSettings {
  selectedRatios: AspectRatio[];   // at least one required
  rowMode: RowSelectionMode;
  singleRowIndex: number;          // 0-based, for 'single' mode
  rangeFrom: number;                // 0-based, for 'range' mode
  rangeTo: number;                  // 0-based inclusive, for 'range' mode
}

export interface VariantProgress {
  /** Key like "16:9-row-3" */
  key: string;
  label: string;                   // e.g. "16:9 — Row 3"
  progress: number;                // 0-100
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export interface ExportState {
  // Settings (persist across open/close)
  settings: ExportSettings;
  
  // Render job
  jobId: string | null;
  isRendering: boolean;
  
  // Progress per variant
  variants: VariantProgress[];
  
  // Actions
  setSettings: (settings: Partial<ExportSettings>) => void;
  setSelectedRatios: (ratios: AspectRatio[]) => void;
  setRowMode: (mode: RowSelectionMode) => void;
  setSingleRowIndex: (index: number) => void;
  setRangeFrom: (from: number) => void;
  setRangeTo: (to: number) => void;
  
  startRender: (jobId: string, variants: VariantProgress[]) => void;
  updateVariantProgress: (key: string, progress: number, status?: string) => void;
  completeVariant: (key: string, downloadUrl: string) => void;
  failVariant: (key: string, error: string) => void;
  completeAll: () => void;
  failAll: (error: string) => void;
  
  reset: () => void;
}

const defaultSettings: ExportSettings = {
  selectedRatios: ['16:9'],
  rowMode: 'all',
  singleRowIndex: 0,
  rangeFrom: 0,
  rangeTo: 0,
};

export const useExportStore = create<ExportState>((set, get) => ({
  settings: {...defaultSettings},
  jobId: null,
  isRendering: false,
  variants: [],

  setSettings: (partial) => set((s) => ({settings: {...s.settings, ...partial}})),
  
  setSelectedRatios: (ratios) => set((s) => ({
    settings: {...s.settings, selectedRatios: ratios.length > 0 ? ratios : ['16:9']}
  })),
  
  setRowMode: (rowMode) => set((s) => ({settings: {...s.settings, rowMode}})),
  setSingleRowIndex: (singleRowIndex) => set((s) => ({settings: {...s.settings, singleRowIndex}})),
  setRangeFrom: (rangeFrom) => set((s) => ({settings: {...s.settings, rangeFrom}})),
  setRangeTo: (rangeTo) => set((s) => ({settings: {...s.settings, rangeTo}})),

  startRender: (jobId, variants) => set({jobId, isRendering: true, variants}),
  
  updateVariantProgress: (key, progress, status) => set((s) => ({
    variants: s.variants.map((v) => 
      v.key === key ? {...v, progress, status: (status as any) ?? v.status} : v
    )
  })),
  
  completeVariant: (key, downloadUrl) => set((s) => ({
    variants: s.variants.map((v) => 
      v.key === key ? {...v, progress: 100, status: 'completed', downloadUrl} : v
    )
  })),
  
  failVariant: (key, error) => set((s) => ({
    variants: s.variants.map((v) => 
      v.key === key ? {...v, status: 'failed', error} : v
    )
  })),
  
  completeAll: () => set({isRendering: false}),
  failAll: (error) => set({isRendering: false}),
  
  reset: () => set({
    settings: {...defaultSettings},
    jobId: null,
    isRendering: false,
    variants: [],
  }),
}));
```

**Key design decision:** A separate `exportStore` rather than putting export state in `editorStore`. Rationale:
- Export state is complex (settings, progress tracking, download URLs)
- `editorStore` is already ~250 lines; adding export would bloat it
- Export state should survive panel close/reopen independently from editor UI state
- The `mergeDataStore` already follows this pattern of a separate store for a specific domain

### 2. `/home/raymo/vary-video/web/src/v2/editor/panels/MobileExportSheet.tsx`

The main export panel component. This is the largest new file (~400-500 lines).

```typescript
/**
 * Mobile Export Sheet — bottom sheet for configuring and running exports.
 * 
 * Slides up from the bottom when the Export button (⬇) is tapped.
 * Pattern: identical to MobileLayersSheet.tsx.
 * 
 * Sections:
 * 1. Header: "Export Video" with close button
 * 2. Aspect Ratio Selection: checkboxes for 16:9, 9:16, 1:1
 * 3. Row Selection: All / Single / Range, with inputs
 * 4. Export button
 * 5. Progress section (visible during/after render)
 * 6. Downloads section (visible when render has completed outputs)
 */

import {useState, useCallback} from 'react';
import {createPortal} from 'react-dom';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {useMergeDataStore} from '../../stores/mergeDataStore';
import {useExportStore} from '../../stores/exportStore';
import {apiClient} from '../../../api/client';
import {ASPECT_RATIOS, ASPECT_DIMENSIONS} from '@vary/v2/schema/document';
import type {AspectRatio} from '@vary/v2/schema/document';

export default function MobileExportSheet() {
  const open = useEditorStore((s) => s.exportPanelOpen);
  const close = useEditorStore((s) => s.closeExportPanel);
  
  const document = useDocumentStore((s) => s.document);
  const mergeRows = useMergeDataStore((s) => s.rows);
  
  const settings = useExportStore((s) => s.settings);
  const setSelectedRatios = useExportStore((s) => s.setSelectedRatios);
  const setRowMode = useExportStore((s) => s.setRowMode);
  const setSingleRowIndex = useExportStore((s) => s.setSingleRowIndex);
  const setRangeFrom = useExportStore((s) => s.setRangeFrom);
  const setRangeTo = useExportStore((s) => s.setRangeTo);
  const isRendering = useExportStore((s) => s.isRendering);
  const variants = useExportStore((s) => s.variants);
  const jobId = useExportStore((s) => s.jobId);
  const startRender = useExportStore((s) => s.startRender);
  const updateVariantProgress = useExportStore((s) => s.updateVariantProgress);
  const completeVariant = useExportStore((s) => s.completeVariant);
  const failVariant = useExportStore((s) => s.failVariant);
  const completeAll = useExportStore((s) => s.completeAll);
  const failAll = useExportStore((s) => s.failAll);

  const hasData = mergeRows.length > 0;
  const totalRows = mergeRows.length;

  // Compute which rows to render
  const selectedRowIndices = computeRowIndices(settings, totalRows);

  // Compute total variants: selectedRatios × selectedRowIndices
  const totalVariants = settings.selectedRatios.length * selectedRowIndices.length;

  // Handle export
  const handleExport = async () => {
    if (settings.selectedRatios.length === 0 || selectedRowIndices.length === 0) return;
    
    // Build variant list and progress entries
    const variantEntries: Array<{key: string; label: string; ratio: AspectRatio; rowIndex: number}> = [];
    for (const ratio of settings.selectedRatios) {
      for (const rowIdx of selectedRowIndices) {
        variantEntries.push({
          key: `${ratio}-row-${rowIdx}`,
          label: `${ratio} — Row ${rowIdx + 1}`,
          ratio,
          rowIndex: rowIdx,
        });
      }
    }

    const initialVariants = variantEntries.map((e) => ({
      key: e.key,
      label: e.label,
      progress: 0,
      status: 'queued' as const,
    }));

    // Build the SceneBlockPlayer-compatible template from the document
    const template = buildTemplateFromDocument(document);
    
    // Build variants array for API
    const apiVariants = selectedRowIndices.map((rowIdx) => {
      return mergeRows[rowIdx]; // Record<string, string>
    });

    try {
      const response = await apiClient.startBatchRender({
        compositionId: 'SceneBlockPlayer',
        template,
        variants: apiVariants,
        formats: settings.selectedRatios as any[], // reuse format dimension mapping
      });

      startRender(response.jobId, initialVariants);

      // Poll for progress
      pollRenderProgress(response.jobId, variantEntries);
    } catch (err) {
      failAll(err instanceof Error ? err.message : 'Export failed');
    }
  };

  // Polling logic (simplified — detailed in implementation)
  const pollRenderProgress = async (jobId: string, entries: typeof variantEntries) => {
    // Poll GET /api/render/status/:jobId every 2 seconds
    // When downloads appear, map them back to variant keys
    // Update progress per variant
  };

  if (!open) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{
        position: 'fixed', inset: 0, zIndex: 10998,
        background: 'rgba(0,0,0,0.4)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 10999, maxHeight: '80vh',
        background: '#1A202C',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        display: 'flex', flexDirection: 'column',
        animation: 'exportsheet-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <Header onClose={close} />

        {/* Scrollable content */}
        <div style={{flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24}}>
          {/* 1. Aspect Ratio Selection */}
          <AspectRatioSection 
            selected={settings.selectedRatios}
            onChange={setSelectedRatios}
          />

          {/* 2. Row Selection */}
          <RowSelectionSection
            mode={settings.rowMode}
            singleRowIndex={settings.singleRowIndex}
            rangeFrom={settings.rangeFrom}
            rangeTo={settings.rangeTo}
            totalRows={totalRows}
            hasData={hasData}
            onModeChange={setRowMode}
            onSingleChange={setSingleRowIndex}
            onRangeFromChange={setRangeFrom}
            onRangeToChange={setRangeTo}
          />

          {/* 3. Export Button */}
          <ExportButtonSection
            onClick={handleExport}
            disabled={isRendering || settings.selectedRatios.length === 0 || selectedRowIndices.length === 0}
            totalVariants={totalVariants}
          />

          {/* 4. Progress Section */}
          {variants.length > 0 && (
            <ProgressSection variants={variants} jobId={jobId} isRendering={isRendering} />
          )}

          {/* 5. Downloads Section */}
          {variants.some((v) => v.status === 'completed') && (
            <DownloadsSection variants={variants} jobId={jobId} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes exportsheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}
```

### 3. `/home/raymo/vary-video/web/src/v2/editor/panels/ExportSections.tsx`

Extracted sub-components to keep the main sheet file manageable:

- **`Header`** — Title "Export Video", close button
- **`AspectRatioSection`** — Checkbox list for 16:9, 9:16, 1:1 with at-least-one validation
- **`RowSelectionSection`** — Radio/toggle for All/Single/Range, number inputs for Single and Range, "37 rows loaded" display
- **`ExportButtonSection`** — Big "Export X Videos" button with variant count
- **`ProgressSection`** — Per-variant progress bars with labels
- **`DownloadsSection`** — Individual download links + "Download All as ZIP" button

Each section follows the styling patterns from MobileBottomPanel.tsx and MobileLayersSheet.tsx:
- Dark theme: background `#1A202C`, text `#E2E8F0`/`#9CA3AF`/`#6B7280`
- Accent color: `#3B82F6` for active/selected
- Borders: `#2D3748` / `#374151`
- Border radius: 6-8 for inputs, 20 for sheet top

### 4. `/home/raymo/vary-video/web/src/v2/editor/panels/EditableTitle.tsx`

A small inline-edit component for the project name:

```typescript
/**
 * EditableTitle — click-to-edit project title.
 * 
 * Used in MobileTopBar (next to back button) or could be placed 
 * as a standalone field in settings.
 * 
 * Updates document.name via dispatch.
 */

import {useState, useRef, useEffect, useCallback} from 'react';
import {useDocumentStore} from '../../stores/documentStore';

interface EditableTitleProps {
  style?: React.CSSProperties;
}

export default function EditableTitle({style}: EditableTitleProps) {
  const name = useDocumentStore((s) => s.document.name);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      // Need to add a RENAME_DOCUMENT command type, or use metadata
      dispatch({type: 'SET_DOCUMENT_NAME', name: trimmed} as any);
    }
    setEditing(false);
  }, [value, name, dispatch]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(name); setEditing(false); }}}
        style={{
          background: '#2D3748', border: '1px solid #3B82F6',
          color: '#E2E8F0', fontSize: 13, fontWeight: 600,
          padding: '4px 8px', borderRadius: 6, width: 160,
          ...style,
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Tap to rename project"
      style={{
        background: 'none', border: 'none',
        color: '#D1D5DB', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', padding: '6px 8px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: 160,
        ...style,
      }}
    >
      {name || 'Untitled'}
    </button>
  );
}
```

**Note:** This requires a new command type `SET_DOCUMENT_NAME` to be added to the command types and `applyCommand` in `commands.ts`. Alternatively, use `SET_DOCUMENT_META` and store the name in `document.metadata.__title`. The simpler approach is adding a `SET_DOCUMENT_NAME` command — just a few lines in `commands/types.ts` and `commands/commands.ts`.

### 5. `/home/raymo/vary-video/web/src/v2/commands/types.ts` (modification)

Add:
```typescript
export interface SetDocumentNameCommand {
  type: 'SET_DOCUMENT_NAME';
  name: string;
}
```
And add it to the `EditorCommand` union type.

### 6. `/home/raymo/vary-video/web/src/v2/commands/commands.ts` (modification)

Add a case in `applyCommand`:
```typescript
case 'SET_DOCUMENT_NAME': {
  return {
    document: {...document, name: command.name, updatedAt: new Date().toISOString()},
    shouldRecord: true,
  };
}
```

---

## State Management Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    documentStore (Zustand)                   │
│  document: V2Document  ← source of truth                    │
│  - name, scenes, elements, mergeTags, metadata               │
│  dispatch(command) → applyCommand() → history tracking       │
└─────────────────┬───────────────────────────────────────────┘
                  │ reads
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│editorStore│ │mergeData │ │exportStore│
│(Zustand)  │ │Store     │ │(NEW)      │
│           │ │(Zustand) │ │           │
│aspectRatio│ │rows[]    │ │settings   │
│selection  │ │headers[] │ │jobId      │
│panels:    │ │previewRow│ │variants[] │
│ layers    │ │          │ │progress   │
│ export ◄──│─│──────────│─│──────────►│
│ (NEW)     │ │          │ │downloads  │
└──────────┘ └──────────┘ └──────────┘
```

**Why a separate exportStore:**
1. Export state is complex (settings + progress tracking + download URLs)
2. Must survive panel close/reopen independently
3. `editorStore` is already at ~250 lines; adding export would create a monolith
4. The `mergeDataStore` already follows this pattern of a domain-specific store
5. Clean separation of concerns — editor UI state vs. export job state

**Persistence strategy:**
- Export settings survive close in the `exportStore` (Zustand in-memory, same JS session)
- Export progress survives close in the `exportStore` — the job keeps running on the server
- On re-open, if `jobId` is still set, poll the API for latest status
- "Reset" button clears the store

---

## Data Flow

### User Action → Store → Render → Download

```
1. User taps ⬇ Export button
   → editorStore.openExportPanel()
   → MobileExportSheet renders (portal)

2. User configures settings in panel:
   → Checkboxes: useExportStore.setSelectedRatios()
   → Row mode: useExportStore.setRowMode()
   → Number inputs: useExportStore.setSingleRowIndex() / setRangeFrom() / setRangeTo()

3. User taps "Export X Videos":
   → MobileExportSheet.handleExport()
   → Build template from documentStore.document
   → Build variants from mergeDataStore.rows
   → Call apiClient.startBatchRender({compositionId:'SceneBlockPlayer', template, variants, formats})
   → Server returns {jobId, estimatedTimeSeconds, statusUrl}
   → exportStore.startRender(jobId, initialVariants)

4. Poll loop (every 2s):
   → GET /api/render/status/:jobId
   → Update exportStore.variants[i].progress, .status, .downloadUrl
   → On completion: exportStore.completeAll()

5. User downloads:
   → Individual files: <a href={downloadUrl} download>
   → ZIP: <a href={apiClient.getZipDownloadUrl(jobId)} download>
```

### Template Building Flow

The key challenge is converting the `V2Document` (v2 editor data model) into the `SceneBlockPlayer` template format that the render API expects.

```typescript
function buildTemplateFromDocument(document: V2Document, ratio: AspectRatio): Record<string, unknown> {
  const dims = ASPECT_DIMENSIONS[ratio];
  const scene = document.scenes[0]; // or active scene
  
  // Convert V2Elements to block sequence items
  const blocks = scene.elements.map((el) => {
    const blockId = elementTypeToBlockId(el.type);
    const content = el.propsToContent(); // extract text/image props
    return {
      blockId,
      content,
      layout: buildLayout(el.transform, dims),
      animation: buildAnimation(el.animation),
    };
  });

  return {
    blocks,
    brandSettings: document.metadata?.brandSettings ?? {
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#FF6B5B',
      logoUrl: '',
      backgroundType: scene.background.type,
      backgroundColor: scene.background.type === 'solid' ? scene.background.color : scene.background.type === 'gradient' ? scene.background.color1 : '#F7FAFC',
    },
    fps: document.fps,
    width: dims.width,
    height: dims.height,
    // data will be merged per-variant by the render API
  };
}
```

**Critical design question:** The v2 editor stores elements as `V2Element[]` (text, image, shape) with position/transform data. The `SceneBlockPlayer` expects `blocks[]` with `blockId`, `content`, `layout`, `animation`. There needs to be a conversion/adapter layer.

**Recommendation:** Build an adapter module `web/src/v2/export/templateAdapter.ts` that converts `V2Document + AspectRatio → SceneBlockPlayerProps`. This keeps the conversion logic testable and separate from the UI.

### Alternative Approach: V2NativeComposition

For a simpler initial implementation (and one that avoids the v2→SceneBlockPlayer conversion entirely), consider creating a new Remotion composition `V2NativeComposition` that directly renders a `V2Document`:

1. Register `V2NativeComposition` in `src/Root.tsx`
2. The composition receives the full `V2Document` as props (serialized)
3. It renders elements using the existing `ElementRenderer` logic but in a Remotion context
4. This avoids the v2→SceneBlockPlayer adapter altogether

**This is the recommended approach for Phase 1** — it's simpler and more direct. The SceneBlockPlayer adapter can be built later when the block-based pipeline is needed.

---

## UI Component Tree for Export Panel

```
MobileExportSheet (createPortal to document.body)
├── Backdrop (fixed, onClick=close)
└── Sheet (fixed, bottom:0, borderTopLeftRadius:20)
    ├── Header
    │   ├── Title ("Export Video")
    │   ├── Subtitle (variant count, e.g. "3 formats × 37 rows = 111 videos")
    │   └── Close Button (×)
    │
    ├── Scrollable Content
    │   ├── AspectRatioSection
    │   │   ├── Section Label ("Aspect Ratios")
    │   │   ├── Checkbox "16:9 Landscape"   (1920×1080)
    │   │   ├── Checkbox "9:16 Vertical"    (1080×1920)
    │   │   └── Checkbox "1:1 Square"       (1920×1920)
    │   │
    │   ├── Divider
    │   │
    │   ├── RowSelectionSection
    │   │   ├── Section Label ("Data Rows")
    │   │   ├── Info text: "37 rows loaded" or "No data loaded — using single export"
    │   │   ├── Radio: "All rows" (default)
    │   │   ├── Radio: "Single row" + NumberInput
    │   │   └── Radio: "Range" + NumberInput "from" + NumberInput "to"
    │   │
    │   ├── Divider
    │   │
    │   ├── ExportButtonSection
    │   │   ├── "Export X Videos" button (green/blue, prominent)
    │   │   └── Estimated time display
    │   │
    │   ├── Divider (only visible if render has started)
    │   │
    │   ├── ProgressSection (conditional)
    │   │   ├── Overall progress bar
    │   │   │   ├── "X of Y completed"
    │   │   │   └── Percentage
    │   │   └── Per-variant progress list
    │   │       └── VariantRow × N
    │   │           ├── Label: "16:9 — Row 3"
    │   │           ├── Mini progress bar
    │   │           └── Status badge (queued/rendering/completed/failed)
    │   │
    │   └── DownloadsSection (conditional — show when any variant completed)
    │       ├── Section Label ("Downloads")
    │       ├── DownloadRow × N
    │       │   ├── Label: "16:9 — Row 3"
    │       │   └── Download button/link
    │       └── "Download All as ZIP" button
    │
    └── @keyframes exportsheet-up animation
```

---

## Render Pipeline

### Current Render Pipeline (v1 / Dashboard)

```
Dashboard.tsx
  → apiClient.startBatchRender({compositionId, template, variants, formats})
  → POST /api/render/batch
  → renderRouter.post('/batch')
    → validates with composition schema
    → creates job in DB + in-memory Map
    → async: renderBatch() per variant × format
      → @remotion/bundler → serveUrl
      → renderMedia({serveUrl, composition, codec:'h264', crf:18, ...})
      → outputPath → jobOutputs Map
    → periodic DB sync every 5s
  → returns {jobId, estimatedTimeSeconds, statusUrl}
  
Dashboard polls:
  → apiClient.getRenderStatus(jobId)
  → GET /api/render/status/:jobId
  → returns {status, progress, completedVariants, downloads[], ...}
```

### V2 Editor Export Pipeline

The v2 editor export will use the **same API endpoints** — no backend changes needed:

```
MobileExportSheet.handleExport()
  → Build template from V2Document
  → Build variants from mergeDataStore rows
  → apiClient.startBatchRender({compositionId:'SceneBlockPlayer', template, variants, formats})
  → Same POST /api/render/batch pipeline
  
MobileExportSheet polls:
  → apiClient.getRenderStatus(jobId)
  → Updates exportStore.variants progress
```

**Format mapping:**
```typescript
const FORMAT_DIMENSIONS: Record<AspectRatio, {width: number; height: number}> = {
  '16:9': {width: 1920, height: 1080},
  '9:16': {width: 1080, height: 1920},
  '1:1':  {width: 1920, height: 1920},
};
```

The existing `render.ts` already supports these formats (line 35-40). They map to the `FORMAT_PRESETS` which control width/height during `renderMedia()`.

### What Needs to Change on the Backend?

**Minimal changes needed:**

1. The `compositionId` needs to support `'V2NativeComposition'` (or keep using `'SceneBlockPlayer'` with an adapter).
2. The `batchRequestSchema` in `render.ts` already supports `formats: ['16:9','1:1','9:16','4:5']` — the aspect ratios from the v2 editor are a subset.
3. Add the new composition ID to `knownCompositionIds` in `validation/composition.ts`.

**No structural backend changes required** — the existing batch render pipeline handles:
- Multi-format rendering (per variant × format)
- Progress tracking
- File downloads
- ZIP packaging
- DB persistence

---

## Edge Cases

### Empty Data
- **No merge data loaded:** Row selection section shows "No data loaded" and the "All rows" option defaults to a single render with no row data (just the template). The export still works — it renders one variant with empty `data: {}`.
- **0 rows:** Same as above. The "37 rows loaded" display shows "0 rows loaded" with a warning style.

### No Rows Selected
- **Single mode, index out of bounds:** Clamp to valid range. Show validation error if index ≥ totalRows.
- **Range mode, from > to:** Swap them automatically. Clamp both to [0, totalRows-1].
- **Range mode, from == to:** Valid — renders just that one row.

### At Least One Aspect Ratio Required
- If user unchecks all ratios, keep the last one checked (or disable uncheck of the last one).
- The export button is disabled if `selectedRatios.length === 0`.
- Show a validation message: "Select at least one aspect ratio."

### Render Failures
- **API unreachable:** Catch in `handleExport()`, show error toast/inline message in the panel.
- **Server returns 400 (invalid template):** Show the error message from the response. Highlight which part of the template is invalid.
- **Individual variant fails:** Mark that variant as 'failed' in `exportStore.variants`. Show error message. Other variants continue rendering.
- **All variants fail:** `exportStore.failAll(errorMessage)`. Show error in progress section.

### Network Errors During Polling
- If the poll request fails (network error), retry up to 3 times with exponential backoff.
- If all retries fail, show "Connection lost — check your network" and stop polling.
- The render continues on the server; user can re-open the panel and it will pick up the latest status from the server.

### Panel Close During Render
- Closing the panel does NOT cancel the render job (it runs on the server).
- On re-open, if `jobId` is in `exportStore`, poll the server for current status immediately.
- The progress and download URLs persist in the `exportStore`.

### Very Large Row Counts
- If `totalRows > 500`, show a warning: "Rendering 500+ videos may take a long time."
- Consider adding a "Max rows" safety limit (e.g., 1000) with a warning.

### Project Name Edge Cases
- Empty name: Revert to "Untitled" on blur.
- Very long name (200+ chars): Truncate in display, full name in tooltip.
- Name with only whitespace: Revert to "Untitled".

---

## Estimated Complexity & Implementation Order

### Complexity Estimates

| Feature | Complexity | Files | Est. Lines | Risk |
|---------|-----------|-------|-----------|------|
| Cycling Aspect Ratio Button | Low | 1 | ~40 changed | None — straightforward |
| Export Button in Header | Low | 1 | ~10 added | None |
| exportStore | Medium | 1 new | ~120 | Low — follows mergeDataStore pattern |
| MobileExportSheet shell | Medium | 1 new | ~150 | Low — follows MobileLayersSheet pattern |
| ExportSections (sub-components) | Medium-High | 1 new | ~300 | Medium — most UI complexity |
| Project Name (EditableTitle) | Low | 2 changed | ~60 + command | Low |
| SET_DOCUMENT_NAME command | Low | 2 changed | ~20 | Low |
| Template adapter v2→SceneBlockPlayer | High | 1 new | ~200 | High — complex data transformation |
| OR: V2NativeComposition (Remotion) | Medium-High | 1 new | ~150 | Medium — simpler, new composition |
| Polling integration | Low | 0 (in sheet) | ~50 | Low — uses existing API |
| Export to index.ts | Low | 2 changed | ~5 | Low |

### Recommended Implementation Order

**Phase 1: Foundation (1-2 hours)**
1. **Add SET_DOCUMENT_NAME command** — types.ts + commands.ts
2. **Cycling Aspect Ratio Button** — MobileTopBar.tsx
3. **Export Button** — MobileTopBar.tsx (just the button, panel starts as stub)
4. **exportStore** — new file
5. **exportPanelOpen state** — editorStore.ts

**Phase 2: Export Panel UI (2-3 hours)**
6. **MobileExportSheet shell** — structure, backdrop, portal, open/close
7. **ExportSections.tsx** — AspectRatioSection, RowSelectionSection, ExportButtonSection
8. **Wire to Editor.tsx** — add `<MobileExportSheet />`

**Phase 3: Render Integration (2-4 hours)**
9. **V2NativeComposition** — new Remotion composition that renders V2Document directly
10. **Template adapter** (if needed) — v2 document → API-compatible format
11. **handleExport + polling** — wire up the export button to the API
12. **ProgressSection + DownloadsSection** — progress bars, download links

**Phase 4: Polish (1-2 hours)**
13. **Project naming** — EditableTitle in MobileTopBar
14. **Edge case handling** — validation, error states, empty data
15. **Styling polish** — animations, responsive tweaks, loading states

**Total estimated effort:** 6-11 hours for full implementation.

### Key Risk: V2 → SceneBlockPlayer Adapter

The biggest architectural risk is the **mismatch between the v2 editor data model and the SceneBlockPlayer Remotion composition**. The v2 editor stores:
- `V2Element[]` with `type: 'text' | 'image' | 'shape'`, `transform` (normalized 0-1 coords), `props` (type-specific), `timing`, `animation`, `responsiveOverrides`
- Scene-level: `background`, `durationFrames`

The `SceneBlockPlayer` expects:
- `blocks[]` with `blockId`, `content: Record<string, string>`, `layout: Record<string, ElementLayout>`, `animation: BlockAnimationSettings`, `imageTreatment`, `transition`
- `brandSettings`, `data: Record<string, string>`

**Mitigation strategies (in order of preference):**

1. **V2NativeComposition (recommended for Phase 3):** Create a new Remotion composition that accepts the full `V2Document` as props and renders elements directly in a Remotion context. This bypasses the adapter entirely. The composition:
   - Uses `useCurrentFrame()`, `useVideoConfig()` from Remotion
   - Maps `V2Element[]` to positioned `<div>` elements with CSS transforms
   - Handles text, image, shape rendering
   - Supports playback timing per element
   - Handles background rendering

2. **Adapter module:** If V2NativeComposition is too complex, build an adapter that converts `V2Document` → `SceneBlockPlayer` props format. This requires understanding the block system (block IDs, content schemas, layout formats).

3. **Pre-render approach:** Use the existing `ElementRenderer` from the DOM editor but capture frames via canvas/MediaRecorder instead of Remotion. This is more complex but avoids the Remotion dependency.

---

## Summary of All Changes

### Modified Files (7):
1. `web/src/v2/stores/editorStore.ts` — add `exportPanelOpen`, `openExportPanel`, `closeExportPanel`
2. `web/src/v2/editor/toolbar/MobileTopBar.tsx` — replace 3 ratio buttons with cycling button, add export button
3. `web/src/v2/editor/Editor.tsx` — import and render `<MobileExportSheet />`
4. `web/src/v2/commands/types.ts` — add `SET_DOCUMENT_NAME` command type
5. `web/src/v2/commands/commands.ts` — add handler for `SET_DOCUMENT_NAME`
6. `web/src/v2/index.ts` — export `useExportStore` (optional, for consumers)
7. `api/src/validation/composition.ts` — add `V2NativeComposition` to `knownCompositionIds` (if new composition)

### New Files (5):
1. `web/src/v2/stores/exportStore.ts` — export state management
2. `web/src/v2/editor/panels/MobileExportSheet.tsx` — main export panel
3. `web/src/v2/editor/panels/ExportSections.tsx` — sub-component sections
4. `web/src/v2/editor/panels/EditableTitle.tsx` — inline project name editor
5. `src/compositions/V2Native/V2Native.tsx` — Remotion composition for v2 document rendering

### No Backend API Changes Required
The existing `/api/render/batch`, `/api/render/status/:jobId`, `/api/render/download/:jobId/:variantIndex`, and `/api/render/download-zip/:jobId` endpoints work as-is for the v2 export flow. Only the `compositionId` validation needs updating if a new composition is added.
