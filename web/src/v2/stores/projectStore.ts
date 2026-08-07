/**
 * V2 Project Store — localStorage persistence for V2 editor projects.
 *
 * Auto-saves on every document change (debounced 2s).
 * Provides CRUD: save, load, delete, duplicate.
 * Persists across page reloads via localStorage key "vary-video-v2-projects".
 */

import {create} from 'zustand';
import type {V2Document} from '@vary/v2/schema/document';

// ─── Types ─────────────────────────────────────────────────────────

export interface SavedV2Project {
  id: string;
  name: string;
  lastModified: string;    // ISO date string
  aspectRatio: string;     // e.g. "16:9"
  sceneCount: number;
  elementCount: number;
  documentJSON: string;    // serialized V2Document
}

export interface V2ProjectState {
  projects: SavedV2Project[];
  currentProjectId: string | null;

  // CRUD
  saveProject: (doc: V2Document) => void;
  loadProject: (id: string) => V2Document | null;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => string; // returns new project ID

  // Read
  getProjects: () => SavedV2Project[];
  getProject: (id: string) => SavedV2Project | undefined;

  // Current tracking
  setCurrentProject: (id: string | null) => void;

  // Bulk
  hydrate: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = 'vary-video-v2-projects';

function readAll(): SavedV2Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(projects: SavedV2Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    // localStorage full — log but don't crash
    console.warn('Failed to save V2 projects to localStorage:', e);
  }
}

function summarizeDocument(doc: V2Document): Pick<SavedV2Project, 'aspectRatio' | 'sceneCount' | 'elementCount'> {
  return {
    aspectRatio: doc.defaultAspectRatio ?? '16:9',
    sceneCount: doc.scenes.length,
    elementCount: doc.scenes.reduce((sum, s) => sum + s.elements.length, 0),
  };
}

function generateProjectId(): string {
  return `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Store ─────────────────────────────────────────────────────────

export const useV2ProjectStore = create<V2ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,

  hydrate: () => {
    const projects = readAll();
    set({projects});
  },

  saveProject: (doc: V2Document) => {
    const {projects, currentProjectId} = get();
    const id = currentProjectId ?? doc.id ?? generateProjectId();
    const summary = summarizeDocument(doc);

    const entry: SavedV2Project = {
      id,
      name: doc.name || 'Untitled',
      lastModified: new Date().toISOString(),
      documentJSON: JSON.stringify(doc),
      ...summary,
    };

    const idx = projects.findIndex((p) => p.id === id);
    const next = [...projects];
    if (idx >= 0) {
      next[idx] = entry;
    } else {
      next.unshift(entry); // newest first
    }

    writeAll(next);
    set({projects: next, currentProjectId: id});
  },

  loadProject: (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return null;
    try {
      return JSON.parse(project.documentJSON) as V2Document;
    } catch {
      return null;
    }
  },

  deleteProject: (id: string) => {
    const {projects, currentProjectId} = get();
    const next = projects.filter((p) => p.id !== id);
    writeAll(next);
    set({
      projects: next,
      currentProjectId: currentProjectId === id ? null : currentProjectId,
    });
  },

  duplicateProject: (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return '';

    const newId = generateProjectId();
    let doc: V2Document;
    try {
      doc = JSON.parse(project.documentJSON);
    } catch {
      return '';
    }

    doc.id = newId;
    doc.name = `${project.name} (Copy)`;

    const entry: SavedV2Project = {
      ...project,
      id: newId,
      name: doc.name,
      lastModified: new Date().toISOString(),
      documentJSON: JSON.stringify(doc),
    };

    const next = [entry, ...get().projects];
    writeAll(next);
    set({projects: next, currentProjectId: newId});
    return newId;
  },

  getProjects: () => {
    return get().projects;
  },

  getProject: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  setCurrentProject: (id: string | null) => {
    set({currentProjectId: id});
  },
}));

// Auto-hydrate on first import
useV2ProjectStore.getState().hydrate();
