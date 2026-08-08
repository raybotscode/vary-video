/**
 * V2 Document Store — Zustand store for the V2Document state.
 *
 * This is the single source of truth for the document. All mutations go
 * through dispatch() which wraps history tracking. The editor store reads
 * from here but never mutates directly.
 *
 * History is per-scene: each scene gets its own HistoryManager, keyed by
 * scene ID. Switching scenes updates canUndo/canRedo to reflect that scene's
 * history. Scene CRUD commands (ADD/DELETE/DUPLICATE/MOVE) affect the
 * global scene list; undo/redo within a scene only snapshots that scene.
 */

import {create} from 'zustand';
import type {V2Document, V2Scene, V2Element} from '@vary/v2/schema/document';
import {validateDocument} from '@vary/v2/schema/document';
import {migrateV2ToV3} from '@vary/v2/schema/migration';
import type {EditorCommand} from '../commands/types';
import {applyCommand} from '../commands/commands';
import {HistoryManager} from '../commands/history';

export interface DocumentState {
  // ─── State ──────────────────────────────────────────────────
  document: V2Document;
  activeSceneIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // ─── Core Dispatch ──────────────────────────────────────────
  /** Dispatch a command. Automatically tracks history. */
  dispatch: (command: EditorCommand) => void;

  // ─── Navigation ─────────────────────────────────────────────
  /** Switch the active scene and update undo/redo state. */
  setActiveSceneIndex: (index: number) => void;

  // ─── Convenience Getters ────────────────────────────────────
  getActiveScene: () => V2Scene;
  getElements: () => V2Element[];
  getElement: (id: string) => V2Element | undefined;

  // ─── Serialization ──────────────────────────────────────────
  toJSON: () => string;
  loadDocument: (doc: V2Document) => void;
  reset: () => void;
}

/** Create a fresh empty document. */
export function createEmptyDocument(): V2Document {
  return validateDocument({
    schemaVersion: 3,
    id: 'doc-' + Date.now(),
    name: 'Untitled',
    description: '',
    fps: 30,
    defaultAspectRatio: '16:9',
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    scenes: [{
      id: 'scene-1',
      name: 'Scene 1',
      durationFrames: 90,
      background: {type: 'gradient', color1: '#FFFFFF', color2: '#F7FAFC', angle: 135},
      elements: [],
    }],
    mergeTags: [],
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export const useDocumentStore = create<DocumentState>((set, get) => {
  // Per-scene history: Map<sceneId, HistoryManager>
  const sceneHistories = new Map<string, HistoryManager>();

  function getHistory(sceneId: string): HistoryManager {
    let h = sceneHistories.get(sceneId);
    if (!h) {
      h = new HistoryManager();
      sceneHistories.set(sceneId, h);
    }
    return h;
  }

  function updateUndoRedoState() {
    const {document, activeSceneIndex} = get();
    const sceneId = document.scenes[activeSceneIndex]?.id;
    const h = sceneId ? sceneHistories.get(sceneId) : null;
    set({
      canUndo: h?.canUndo() ?? false,
      canRedo: h?.canRedo() ?? false,
    });
  }

  const pushHistory = (doc: V2Document, description: string) => {
    const sceneId = doc.scenes[get().activeSceneIndex]?.id;
    if (sceneId) {
      const h = getHistory(sceneId);
      h.push(doc, get().activeSceneIndex, description);
    }
    set({document: doc});
    updateUndoRedoState();
  };

  const initialDoc = createEmptyDocument();

  // Initialize history for the first scene
  {
    const firstSceneId = initialDoc.scenes[0]?.id;
    if (firstSceneId) {
      const h = getHistory(firstSceneId);
      h.push(initialDoc, 0, 'Create document');
    }
  }

  return {
    document: initialDoc,
    activeSceneIndex: 0,
    canUndo: false,
    canRedo: false,

    dispatch: (command: EditorCommand) => {
      const {document, activeSceneIndex} = get();

      // Handle undo/redo at store level
      if (command.type === 'UNDO') {
        const sceneId = document.scenes[activeSceneIndex]?.id;
        const h = sceneId ? sceneHistories.get(sceneId) : null;
        if (!h) return;
        const prevScene = h.undo();
        if (prevScene) {
          const newDoc = {
            ...document,
            scenes: document.scenes.map((s, i) =>
              i === activeSceneIndex ? prevScene : s,
            ),
          };
          set({document: newDoc});
          updateUndoRedoState();
        }
        return;
      }

      if (command.type === 'REDO') {
        const sceneId = document.scenes[activeSceneIndex]?.id;
        const h = sceneId ? sceneHistories.get(sceneId) : null;
        if (!h) return;
        const nextScene = h.redo();
        if (nextScene) {
          const newDoc = {
            ...document,
            scenes: document.scenes.map((s, i) =>
              i === activeSceneIndex ? nextScene : s,
            ),
          };
          set({document: newDoc});
          updateUndoRedoState();
        }
        return;
      }

      // Handle SET_ACTIVE_SCENE at store level (navigation, not mutation)
      if (command.type === 'SET_ACTIVE_SCENE') {
        if (command.sceneIndex < 0 || command.sceneIndex >= document.scenes.length) return;
        set({activeSceneIndex: command.sceneIndex});
        updateUndoRedoState();
        return;
      }

      // Apply the command
      const result = applyCommand(document, activeSceneIndex, command);

      // Adjust activeSceneIndex if scene array changed (DELETE, MOVE, etc.)
      const newActiveSceneIndex =
        result.document.scenes.length !== document.scenes.length
          ? Math.min(activeSceneIndex, result.document.scenes.length - 1)
          : activeSceneIndex;

      if (result.shouldRecord) {
        pushHistory(result.document, `${command.type} ${((command as any).elementId ?? '')}`);
        // pushHistory already calls set({document}) + updateUndoRedoState,
        // but it doesn't set activeSceneIndex — patch it up
        if (newActiveSceneIndex !== activeSceneIndex) {
          set({activeSceneIndex: newActiveSceneIndex});
          updateUndoRedoState();
        }
      } else {
        set({
          document: result.document,
          activeSceneIndex: newActiveSceneIndex,
        });
        updateUndoRedoState();
      }
    },

    setActiveSceneIndex: (index: number) => {
      const {document} = get();
      if (index < 0 || index >= document.scenes.length) return;
      set({activeSceneIndex: index});
      updateUndoRedoState();
    },

    getActiveScene: () => {
      const {document, activeSceneIndex} = get();
      return document.scenes[activeSceneIndex] ?? document.scenes[0];
    },

    getElements: () => {
      return get().getActiveScene().elements;
    },

    getElement: (id: string) => {
      return get().getElements().find((el) => el.id === id);
    },

    toJSON: () => JSON.stringify(get().document, null, 2),

    loadDocument: (doc: V2Document) => {
      // Run v2→v3 migration if needed
      let validated: V2Document;
      if ((doc as any).schemaVersion !== undefined && (doc as any).schemaVersion < 3) {
        validated = migrateV2ToV3(doc as any) as V2Document;
      } else {
        validated = validateDocument(doc);
      }
      // Clear all scene histories
      sceneHistories.clear();
      // Initialize history for the first scene
      const firstSceneId = validated.scenes[0]?.id;
      if (firstSceneId) {
        const h = getHistory(firstSceneId);
        h.push(validated, 0, 'Load document');
      }
      set({
        document: validated,
        activeSceneIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    },

    reset: () => {
      const fresh = createEmptyDocument();
      sceneHistories.clear();
      const firstSceneId = fresh.scenes[0]?.id;
      if (firstSceneId) {
        const h = getHistory(firstSceneId);
        h.push(fresh, 0, 'Reset');
      }
      set({
        document: fresh,
        activeSceneIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    },
  };
});
