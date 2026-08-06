/**
 * V2 Document Store — Zustand store for the V2Document state.
 *
 * This is the single source of truth for the document. All mutations go
 * through dispatch() which wraps history tracking. The editor store reads
 * from here but never mutates directly.
 *
 * History is scene-scoped (only the active scene is snapshotted) to keep
 * memory manageable.
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
  const history = new HistoryManager();

  const pushHistory = (doc: V2Document, description: string) => {
    history.push(doc, get().activeSceneIndex, description);
    set({document: doc, canUndo: history.canUndo(), canRedo: history.canRedo()});
  };

  const initialDoc = createEmptyDocument();

  return {
    document: initialDoc,
    activeSceneIndex: 0,
    canUndo: false,
    canRedo: false,

    dispatch: (command: EditorCommand) => {
      const {document, activeSceneIndex} = get();

      // Handle undo/redo at store level
      if (command.type === 'UNDO') {
        const prevScene = history.undo();
        if (prevScene) {
          const newDoc = {
            ...document,
            scenes: document.scenes.map((s, i) =>
              i === activeSceneIndex ? prevScene : s,
            ),
          };
          set({document: newDoc, canUndo: history.canUndo(), canRedo: history.canRedo()});
        }
        return;
      }

      if (command.type === 'REDO') {
        const nextScene = history.redo();
        if (nextScene) {
          const newDoc = {
            ...document,
            scenes: document.scenes.map((s, i) =>
              i === activeSceneIndex ? nextScene : s,
            ),
          };
          set({document: newDoc, canUndo: history.canUndo(), canRedo: history.canRedo()});
        }
        return;
      }

      // Apply the command
      const result = applyCommand(document, activeSceneIndex, command);

      if (result.shouldRecord) {
        pushHistory(result.document, `${command.type} ${((command as any).elementId ?? '')}`);
      } else {
        set({document: result.document, canUndo: history.canUndo(), canRedo: history.canRedo()});
      }
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
      history.clear();
      history.push(validated, 0, 'Load document');
      set({
        document: validated,
        activeSceneIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    },

    reset: () => {
      const fresh = createEmptyDocument();
      history.clear();
      history.push(fresh, 0, 'Reset');
      set({
        document: fresh,
        activeSceneIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    },
  };
});
