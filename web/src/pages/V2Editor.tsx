/**
 * V2 Editor Page — two-view orchestrator.
 *
 * View 1 (projects): V2ProjectsDashboard — list saved projects, create new.
 * View 2 (editor):   Full V2 editor with auto-save back to localStorage.
 *
 * Auto-save: reads directly from the document store every 3 seconds.
 * The Editor manages its own document state via Zustand — this page
 * never stores the document in React state to avoid re-render loops.
 */

import {useState, useCallback, useEffect, useRef} from 'react';
import {Editor, createEmptyDocument} from '../v2';
import type {V2Document} from '@vary/v2/schema/document';
import {useV2ProjectStore} from '../v2/stores/projectStore';
import {useDocumentStore} from '../v2/stores/documentStore';
import V2ProjectsDashboard from '../v2/editor/V2ProjectsDashboard';

export default function V2EditorPage() {
  const [view, setView] = useState<'projects' | 'editor'>('projects');

  const saveProject = useV2ProjectStore((s) => s.saveProject);
  const loadProject = useV2ProjectStore((s) => s.loadProject);
  const setCurrentProject = useV2ProjectStore((s) => s.setCurrentProject);

  // Track the current project ID in a ref (not state, to avoid re-renders)
  const projectIdRef = useRef<string | null>(null);
  // Track whether the document has been explicitly loaded by user action.
  // Only save when dirty — prevents saving the store's initial empty doc.
  const dirtyRef = useRef(false);

  // ─── Auto-save (reads from document store directly) ─────────────

  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const startAutoSave = useCallback(() => {
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    saveIntervalRef.current = setInterval(() => {
      if (!dirtyRef.current) return;
      const doc = useDocumentStore.getState().document;
      if (doc) saveProject(doc);
    }, 3000);
  }, [saveProject]);

  const flushSave = useCallback(() => {
    if (!dirtyRef.current) return;
    const doc = useDocumentStore.getState().document;
    if (doc) saveProject(doc);
  }, [saveProject]);

  const stopAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = undefined;
    }
  }, []);

  // Start auto-save when entering editor, stop when leaving
  useEffect(() => {
    if (view === 'editor') {
      startAutoSave();
    } else {
      stopAutoSave();
    }
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [view, startAutoSave, stopAutoSave]);

  // ─── Navigation ──────────────────────────────────────────────────

  const handleNewProject = useCallback(() => {
    const doc = createEmptyDocument();
    doc.name = 'Untitled';
    projectIdRef.current = null;
    dirtyRef.current = true;
    // Load the document into the editor store
    const loadDoc = useDocumentStore.getState().loadDocument;
    loadDoc(doc);
    setCurrentProject(null);
    setView('editor');
  }, [setCurrentProject]);

  const handleEditProject = useCallback(
    (projectId: string) => {
      const doc = loadProject(projectId);
      if (doc) {
        projectIdRef.current = projectId;
        dirtyRef.current = true;
        const loadDoc = useDocumentStore.getState().loadDocument;
        loadDoc(doc);
        setCurrentProject(projectId);
        setView('editor');
      }
    },
    [loadProject, setCurrentProject],
  );

  const handleBackToProjects = useCallback(() => {
    flushSave();
    stopAutoSave();
    dirtyRef.current = false;
    projectIdRef.current = null;
    setView('projects');
  }, [flushSave, stopAutoSave]);

  // ─── Render ──────────────────────────────────────────────────────

  // Read document for editor view (hook must be before any conditional return)
  const editorDoc = useDocumentStore((s) => s.document);

  if (view === 'projects') {
    return (
      <div style={{position: 'fixed', inset: 0, zIndex: 9999}}>
        <V2ProjectsDashboard
          onNewProject={handleNewProject}
          onEditProject={handleEditProject}
        />
      </div>
    );
  }

  return (
    <div style={{position: 'fixed', inset: 0, zIndex: 9999}}>
      <Editor
        document={editorDoc}
        onBack={handleBackToProjects}
      />
    </div>
  );
}
