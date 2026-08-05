/**
 * V2 Editor State — separation of persistent and temporary state.
 *
 * PERSISTENT (saved in document):
 * - scenes, elements, styles, timing, merge tags, responsive overrides
 *
 * TEMPORARY (editor-only, never saved):
 * - selected element IDs, hover state, active tool, drag/resize state,
 *   snapping guides, current frame, zoom, pan, open panels, inline editing
 */

import {useCallback, useRef, useState} from 'react';
import type {V2Document, V2Scene, V2Element, Transform} from '../schema/document';
import {validateDocument} from '../schema/document';

// ─── Editor State Types ───────────────────────────────────────────

export type EditorSelection = {
  elementId: string | null;
  sceneId: string | null;
};

export type DragState = {
  isDragging: boolean;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
};

export type ResizeState = {
  isResizing: boolean;
  handle: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  startX: number;
  startY: number;
  elementStartWidth: number;
  elementStartHeight: number;
  elementStartX: number;
  elementStartY: number;
};

export type RotationState = {
  isRotating: boolean;
  startAngle: number;
  elementStartRotation: number;
  centerX: number;
  centerY: number;
};

export type EditorTool = 'select' | 'text' | 'image' | 'shape';

export type HistoryEntry = {
  document: V2Document;
  description: string;
};

// ─── History Manager ──────────────────────────────────────────────

const MAX_HISTORY = 50;

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private currentIndex = -1;

  push(doc: V2Document, description: string): void {
    // Remove any entries after current position (branching)
    this.entries = this.entries.slice(0, this.currentIndex + 1);
    this.entries.push({document: structuredClone(doc), description});
    if (this.entries.length > MAX_HISTORY) {
      this.entries.shift();
    }
    this.currentIndex = this.entries.length - 1;
  }

  undo(): V2Document | null {
    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return structuredClone(this.entries[this.currentIndex].document);
  }

  redo(): V2Document | null {
    if (this.currentIndex >= this.entries.length - 1) return null;
    this.currentIndex++;
    return structuredClone(this.entries[this.currentIndex].document);
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  current(): V2Document | null {
    if (this.currentIndex < 0) return null;
    return structuredClone(this.entries[this.currentIndex].document);
  }

  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }
}

// ─── Editor State Hook ────────────────────────────────────────────

export type EditorState = {
  // Document
  document: V2Document;
  activeSceneIndex: number;
  activeScene: V2Scene;

  // Selection
  selection: EditorSelection;
  selectedElement: V2Element | null;

  // Tools
  activeTool: EditorTool;

  // Interaction states
  dragState: DragState | null;
  resizeState: ResizeState | null;
  rotationState: RotationState | null;

  // History
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setDocument: (doc: V2Document) => void;
  updateElement: (elementId: string, updates: Partial<V2Element>) => void;
  updateElementTransform: (elementId: string, transform: Partial<Transform>) => void;
  updateElementProps: (elementId: string, props: Record<string, unknown>) => void;
  addElement: (element: V2Element) => void;
  removeElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  setActiveTool: (tool: EditorTool) => void;
  setActiveScene: (index: number) => void;
  toggleElementVisibility: (elementId: string) => void;
  toggleElementLock: (elementId: string) => void;
  moveElementUp: (elementId: string) => void;
  moveElementDown: (elementId: string) => void;
  undo: () => void;
  redo: () => void;

  // Drag/resize/rotation
  startDrag: (state: DragState) => void;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  startResize: (state: ResizeState) => void;
  updateResize: (x: number, y: number) => void;
  endResize: () => void;
  startRotation: (state: RotationState) => void;
  updateRotation: (angle: number) => void;
  endRotation: () => void;
};

export function useEditorState(initialDocument: V2Document): EditorState {
  const historyRef = useRef(new HistoryManager());
  const [document, setDocumentState] = useState<V2Document>(initialDocument);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [selection, setSelection] = useState<EditorSelection>({elementId: null, sceneId: null});
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [rotationState, setRotationState] = useState<RotationState | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const activeScene = document.scenes[activeSceneIndex] ?? document.scenes[0];
  const selectedElement = selection.elementId
    ? activeScene.elements.find(e => e.id === selection.elementId) ?? null
    : null;

  // Push to history and update document
  const pushDocument = useCallback((doc: V2Document, description: string) => {
    historyRef.current.push(doc, description);
    setDocumentState(doc);
    setHistoryVersion(v => v + 1);
  }, []);

  // Set document (full replace)
  const setDocument = useCallback((doc: V2Document) => {
    historyRef.current.clear();
    historyRef.current.push(doc, 'Load document');
    setDocumentState(doc);
    setHistoryVersion(v => v + 1);
  }, []);

  // Update a single element by ID
  const updateElement = useCallback((elementId: string, updates: Partial<V2Element>) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const idx = scene.elements.findIndex(e => e.id === elementId);
    if (idx === -1) return;
    scene.elements[idx] = {...scene.elements[idx], ...updates} as V2Element;
    pushDocument(newDoc, `Update element ${elementId}`);
  }, [document, activeSceneIndex, pushDocument]);

  // Update element transform
  const updateElementTransform = useCallback((elementId: string, transform: Partial<Transform>) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const idx = scene.elements.findIndex(e => e.id === elementId);
    if (idx === -1) return;
    scene.elements[idx].transform = {...scene.elements[idx].transform, ...transform};
    pushDocument(newDoc, `Move/resize ${elementId}`);
  }, [document, activeSceneIndex, pushDocument]);

  // Update element props
  const updateElementProps = useCallback((elementId: string, props: Record<string, unknown>) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const idx = scene.elements.findIndex(e => e.id === elementId);
    if (idx === -1) return;
    scene.elements[idx].props = {...scene.elements[idx].props, ...props};
    pushDocument(newDoc, `Edit ${elementId} properties`);
  }, [document, activeSceneIndex, pushDocument]);

  // Add element
  const addElement = useCallback((element: V2Element) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    scene.elements.push(element);
    pushDocument(newDoc, `Add ${element.type} element`);
    setSelection({elementId: element.id, sceneId: scene.id});
  }, [document, activeSceneIndex, pushDocument]);

  // Remove element
  const removeElement = useCallback((elementId: string) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    scene.elements = scene.elements.filter(e => e.id !== elementId);
    pushDocument(newDoc, `Delete element ${elementId}`);
    if (selection.elementId === elementId) {
      setSelection({elementId: null, sceneId: scene.id});
    }
  }, [document, activeSceneIndex, selection, pushDocument]);

  // Duplicate element
  const duplicateElement = useCallback((elementId: string) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const source = scene.elements.find(e => e.id === elementId);
    if (!source) return;
    const newElement: V2Element = {
      ...structuredClone(source),
      id: `${source.id}-copy-${Date.now()}`,
      name: `${source.name} (copy)`,
      transform: {
        ...source.transform,
        x: Math.min(1, source.transform.x + 0.05),
        y: Math.min(1, source.transform.y + 0.05),
        zIndex: source.transform.zIndex + 1,
      },
    };
    scene.elements.push(newElement);
    pushDocument(newDoc, `Duplicate ${elementId}`);
    setSelection({elementId: newElement.id, sceneId: scene.id});
  }, [document, activeSceneIndex, pushDocument]);

  // Select element
  const selectElement = useCallback((elementId: string | null) => {
    setSelection({elementId, sceneId: activeScene.id});
  }, [activeScene]);

  // Toggle visibility
  const toggleElementVisibility = useCallback((elementId: string) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const el = scene.elements.find(e => e.id === elementId);
    if (el) el.visible = !el.visible;
    pushDocument(newDoc, `Toggle visibility ${elementId}`);
  }, [document, activeSceneIndex, pushDocument]);

  // Toggle lock
  const toggleElementLock = useCallback((elementId: string) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const el = scene.elements.find(e => e.id === elementId);
    if (el) el.locked = !el.locked;
    pushDocument(newDoc, `Toggle lock ${elementId}`);
  }, [document, activeSceneIndex, pushDocument]);

  // Move element up in z-order
  const moveElementUp = useCallback((elementId: string) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const el = scene.elements.find(e => e.id === elementId);
    if (el) el.transform.zIndex = Math.min(1000, el.transform.zIndex + 1);
    pushDocument(newDoc, `Move up ${elementId}`);
  }, [document, activeSceneIndex, pushDocument]);

  // Move element down in z-order
  const moveElementDown = useCallback((elementId: string) => {
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const el = scene.elements.find(e => e.id === elementId);
    if (el) el.transform.zIndex = Math.max(0, el.transform.zIndex - 1);
    pushDocument(newDoc, `Move down ${elementId}`);
  }, [document, activeSceneIndex, pushDocument]);

  // Undo
  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (prev) {
      setDocumentState(prev);
      setHistoryVersion(v => v + 1);
    }
  }, []);

  // Redo
  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (next) {
      setDocumentState(next);
      setHistoryVersion(v => v + 1);
    }
  }, []);

  // Drag handlers
  const startDrag = useCallback((state: DragState) => setDragState(state), []);
  const updateDrag = useCallback((x: number, y: number) => {
    if (!dragState || !selection.elementId) return;
    // Update element position directly (no history until drag ends)
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const el = scene.elements.find(e => e.id === selection.elementId);
    if (el) {
      el.transform.x = Math.max(0, Math.min(1, x));
      el.transform.y = Math.max(0, Math.min(1, y));
      setDocumentState(newDoc);
    }
  }, [dragState, selection, document, activeSceneIndex]);
  const endDrag = useCallback(() => {
    if (dragState) {
      // Push final state to history
      pushDocument(document, `Drag ${selection.elementId}`);
      setDragState(null);
    }
  }, [dragState, document, selection, pushDocument]);

  // Resize handlers (simplified — full implementation in Phase 3)
  const startResize = useCallback((state: ResizeState) => setResizeState(state), []);
  const updateResize = useCallback((_x: number, _y: number) => {
    // TODO: implement resize logic
  }, []);
  const endResize = useCallback(() => {
    if (resizeState) {
      pushDocument(document, `Resize ${selection.elementId}`);
      setResizeState(null);
    }
  }, [resizeState, document, selection, pushDocument]);

  // Rotation handlers
  const startRotation = useCallback((state: RotationState) => setRotationState(state), []);
  const updateRotation = useCallback((angle: number) => {
    if (!rotationState || !selection.elementId) return;
    const newDoc = structuredClone(document);
    const scene = newDoc.scenes[activeSceneIndex];
    if (!scene) return;
    const el = scene.elements.find(e => e.id === selection.elementId);
    if (el) {
      el.transform.rotation = angle;
      setDocumentState(newDoc);
    }
  }, [rotationState, selection, document, activeSceneIndex]);
  const endRotation = useCallback(() => {
    if (rotationState) {
      pushDocument(document, `Rotate ${selection.elementId}`);
      setRotationState(null);
    }
  }, [rotationState, document, selection, pushDocument]);

  return {
    document,
    activeSceneIndex,
    activeScene,
    selection,
    selectedElement,
    activeTool,
    dragState,
    resizeState,
    rotationState,
    canUndo: historyRef.current.canUndo(),
    canRedo: historyRef.current.canRedo(),
    setDocument,
    updateElement,
    updateElementTransform,
    updateElementProps,
    addElement,
    removeElement,
    duplicateElement,
    selectElement,
    setActiveTool,
    setActiveScene: setActiveSceneIndex,
    toggleElementVisibility,
    toggleElementLock,
    moveElementUp,
    moveElementDown,
    undo,
    redo,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    startRotation,
    updateRotation,
    endRotation,
  };
}
