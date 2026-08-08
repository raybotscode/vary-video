/**
 * V2 Editor Store — Zustand store for ephemeral editor UI state.
 *
 * This store holds ALL temporary editor state that is NEVER persisted
 * in the document: selection, drag/resize/rotate state, zoom, panel
 * toggles, etc.
 *
 * The document store is the source of truth for the V2Document; this
 * store tracks what the user is currently doing with it.
 */

import {create} from 'zustand';
import type {Transform, AspectRatio} from '@vary/v2/schema/document';

// ─── Interaction Types ──────────────────────────────────────────────

export type InteractionType = 'none' | 'dragging' | 'resizing' | 'rotating';

export type ResizeHandle =
  | 'tl' | 'tr' | 'br' | 'bl'
  | 'tm' | 'mr' | 'bm' | 'ml';

export interface InteractionState {
  type: InteractionType;
  elementId: string | null;
  /** Screen-space anchor (where the pointer was on mousedown) */
  startMouseX: number;
  startMouseY: number;
  /** Snapshot of the element's transform at interaction start */
  startTransform: Transform | null;
  /** Which resize handle is being dragged (resize only) */
  handle?: ResizeHandle;
}

// ─── Store ──────────────────────────────────────────────────────────

export interface EditorState {
  // ─── Selection ──────────────────────────────────────────────
  selectedElementId: string | null;

  // ─── Interaction ────────────────────────────────────────────
  interaction: InteractionState;

  // ─── Stage Viewport ─────────────────────────────────────────
  stageScale: number;
  stagePanX: number;
  stagePanY: number;
  aspectRatio: AspectRatio;

  // ─── Panel State ────────────────────────────────────────────
  layersExpanded: boolean;
  propertiesExpanded: boolean;
  showAdvanced: boolean;
  activePropertyGroup: string | null;

  // ─── Mobile ─────────────────────────────────────────────────
  mobileSheetOpen: boolean;
  mobileLayersOpen: boolean;
  /** Toggles the mobile tools strip (zoom/grid/snap/delete/duplicate) over the scene navigator */
  toolsPanelOpen: boolean;
  activeGallery: string | null;

  // ─── Export ─────────────────────────────────────────────────
  exportPanelOpen: boolean;

  // ─── Playback ──────────────────────────────────────────────
  playing: boolean;
  currentFrame: number;
  /** Incremented each time playback is started; forces remount of animated elements */
  playbackKey: number;

  // ─── Inline Text Editing ────────────────────────────────────
  inlineEditElementId: string | null;

  // ─── Merge Preview Toggles ───────────────────────────────────
  showMergeTags: boolean;
  showMergeData: boolean;

  // ─── Grid & Snap ────────────────────────────────────────────
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // ─── Selection Actions ──────────────────────────────────────
  selectElement: (id: string | null) => void;

  // ─── Drag Actions ───────────────────────────────────────────
  startDrag: (id: string, mouseX: number, mouseY: number, transform: Transform) => void;
  updateDrag: (mouseX: number, mouseY: number) => void;
  endDrag: () => void;

  // ─── Resize Actions ─────────────────────────────────────────
  startResize: (id: string, handle: ResizeHandle, mouseX: number, mouseY: number, transform: Transform) => void;
  updateResize: (mouseX: number, mouseY: number) => void;
  endResize: () => void;

  // ─── Rotate Actions ─────────────────────────────────────────
  startRotate: (id: string, mouseX: number, mouseY: number, transform: Transform) => void;
  updateRotate: (mouseX: number, mouseY: number) => void;
  endRotate: () => void;

  // ─── Stage Actions ──────────────────────────────────────────
  setStageScale: (scale: number) => void;
  setAspectRatio: (ratio: AspectRatio) => void;

  // ─── Panel Actions ──────────────────────────────────────────
  toggleLayers: () => void;
  toggleProperties: () => void;
  toggleAdvanced: () => void;
  setActivePropertyGroup: (group: string | null) => void;
  openMobileSheet: () => void;
  closeMobileSheet: () => void;
  openMobileLayers: () => void;
  closeMobileLayers: () => void;
  /** Toggle the mobile tools strip (zoom/grid/snap/delete/duplicate) */
  toggleToolsPanel: () => void;
  openGallery: (type: string) => void;
  closeGallery: () => void;
  openExportPanel: () => void;
  closeExportPanel: () => void;
  togglePlayback: () => void;
  setCurrentFrame: (frame: number) => void;

  // ─── Inline Edit Actions ────────────────────────────────────
  startInlineEdit: (id: string) => void;
  endInlineEdit: () => void;

  // ─── Merge Preview Toggle Actions ─────────────────────────────
  toggleShowMergeTags: () => void;
  toggleShowMergeData: () => void;

  // ─── Grid & Snap Actions ─────────────────────────────────────
  toggleShowGrid: () => void;
  toggleSnapToGrid: () => void;
}

const defaultInteraction: InteractionState = {
  type: 'none',
  elementId: null,
  startMouseX: 0,
  startMouseY: 0,
  startTransform: null,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // ─── State ──────────────────────────────────────────────────
  selectedElementId: null,
  interaction: defaultInteraction,
  stageScale: 1,
  stagePanX: 0,
  stagePanY: 0,
  aspectRatio: '16:9',
  layersExpanded: true,
  propertiesExpanded: true,
  showAdvanced: false,
  activePropertyGroup: null,
  mobileSheetOpen: false,
  mobileLayersOpen: false,
  toolsPanelOpen: false,
  activeGallery: null,
  exportPanelOpen: false,
  playing: false,
  currentFrame: 0,
  playbackKey: 0,
  inlineEditElementId: null,
  showMergeTags: false,
  showMergeData: false,
  showGrid: false,
  snapToGrid: true,
  gridSize: 0.05,

  // ─── Selection ──────────────────────────────────────────────
  selectElement: (id) => {
    set({selectedElementId: id});
  },

  // ─── Drag ───────────────────────────────────────────────────
  startDrag: (id, mouseX, mouseY, transform) => {
    set({
      interaction: {
        type: 'dragging',
        elementId: id,
        startMouseX: mouseX,
        startMouseY: mouseY,
        startTransform: {...transform},
      },
    });
  },

  updateDrag: (_mouseX, _mouseY) => {
    // The actual position update happens via the document store's dispatch.
    // This just maintains the interaction state; the useDrag hook coordinates.
  },

  endDrag: () => {
    set({interaction: defaultInteraction});
  },

  // ─── Resize ─────────────────────────────────────────────────
  startResize: (id, handle, mouseX, mouseY, transform) => {
    set({
      interaction: {
        type: 'resizing',
        elementId: id,
        startMouseX: mouseX,
        startMouseY: mouseY,
        startTransform: {...transform},
        handle,
      },
    });
  },

  updateResize: (_mouseX, _mouseY) => {
    // Coordinated by useResize hook
  },

  endResize: () => {
    set({interaction: defaultInteraction});
  },

  // ─── Rotate ─────────────────────────────────────────────────
  startRotate: (id, mouseX, mouseY, transform) => {
    set({
      interaction: {
        type: 'rotating',
        elementId: id,
        startMouseX: mouseX,
        startMouseY: mouseY,
        startTransform: {...transform},
      },
    });
  },

  updateRotate: (_mouseX, _mouseY) => {
    // Coordinated by useRotate hook
  },

  endRotate: () => {
    set({interaction: defaultInteraction});
  },

  // ─── Stage ──────────────────────────────────────────────────
  setStageScale: (scale) => {
    set({stageScale: Math.max(0.25, Math.min(2, scale))});
  },
  setAspectRatio: (ratio) => set({aspectRatio: ratio}),

  // ─── Panels ─────────────────────────────────────────────────
  toggleLayers: () => set((s) => ({layersExpanded: !s.layersExpanded})),
  toggleProperties: () => set((s) => ({propertiesExpanded: !s.propertiesExpanded})),
  toggleAdvanced: () => set((s) => ({showAdvanced: !s.showAdvanced})),
  setActivePropertyGroup: (group) => set({activePropertyGroup: group}),
  openMobileSheet: () => set({mobileSheetOpen: true}),
  closeMobileSheet: () => set({mobileSheetOpen: false}),
  openMobileLayers: () => set({mobileLayersOpen: true}),
  closeMobileLayers: () => set({mobileLayersOpen: false}),
  toggleToolsPanel: () => set((s) => ({toolsPanelOpen: !s.toolsPanelOpen})),
  openGallery: (type) => set({activeGallery: type}),
  closeGallery: () => set({activeGallery: null}),
  openExportPanel: () => set({exportPanelOpen: true}),
  closeExportPanel: () => set({exportPanelOpen: false}),
  togglePlayback: () => set((s) => {
    const nextPlaying = !s.playing;
    return {
      playing: nextPlaying,
      // Increment playbackKey when starting playback to force remount animations
      playbackKey: nextPlaying ? s.playbackKey + 1 : s.playbackKey,
    };
  }),
  setCurrentFrame: (frame) => set({currentFrame: frame} as Partial<EditorState>),

  startInlineEdit: (id) => set({inlineEditElementId: id}),
  endInlineEdit: () => set({inlineEditElementId: null}),

  // ─── Merge Preview Toggles ───────────────────────────────────
  toggleShowMergeTags: () => set((s) => ({showMergeTags: !s.showMergeTags})),
  toggleShowMergeData: () => set((s) => ({showMergeData: !s.showMergeData})),

  // ─── Grid & Snap Toggles ─────────────────────────────────────
  toggleShowGrid: () => set((s) => ({showGrid: !s.showGrid})),
  toggleSnapToGrid: () => set((s) => ({snapToGrid: !s.snapToGrid})),
}));
