/**
 * V2 History Manager — undo/redo stack for document state snapshots.
 *
 * Stores lightweight snapshots of just the active scene (not the full document)
 * to keep memory usage manageable. Each push takes a snapshot, undo/redo
 * returns a new scene slice that is patched back into the document.
 */

import type {V2Document, V2Scene} from '@vary/v2/schema/document';

const MAX_HISTORY = 100;

interface HistoryEntry {
  scene: V2Scene;
  description: string;
}

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private currentIndex = -1;

  /** Take a snapshot of the active scene and push it onto the undo stack. */
  push(document: V2Document, activeSceneIndex: number, description: string): void {
    const scene = document.scenes[activeSceneIndex];
    if (!scene) return;

    // Discard any redo entries (branching)
    this.entries = this.entries.slice(0, this.currentIndex + 1);
    this.entries.push({scene: structuredClone(scene), description});

    // Trim oldest if over limit
    if (this.entries.length > MAX_HISTORY) {
      this.entries.shift();
    }
    this.currentIndex = this.entries.length - 1;
  }

  /** Undo: return the previous scene snapshot, or null. */
  undo(): V2Scene | null {
    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return structuredClone(this.entries[this.currentIndex].scene);
  }

  /** Redo: return the next scene snapshot, or null. */
  redo(): V2Scene | null {
    if (this.currentIndex >= this.entries.length - 1) return null;
    this.currentIndex++;
    return structuredClone(this.entries[this.currentIndex].scene);
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.entries.length - 1;
  }

  /** Get the current scene snapshot without moving the pointer. */
  current(): V2Scene | null {
    if (this.currentIndex < 0) return null;
    return structuredClone(this.entries[this.currentIndex].scene);
  }

  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
  }
}
