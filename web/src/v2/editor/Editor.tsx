/**
 * V2 Editor — the full editor shell.
 *
 * Desktop layout:
 * ┌───────────────────────────────────────────────────┐
 * │ EditorToolbar                                      │
 * ├──────────┬────────────────────┬───────────────────┤
 * │ Layers   │      Stage         │   Properties      │
 * │ Panel    │    Viewport        │     Panel         │
 * │          │                    │                   │
 * └──────────┴────────────────────┴───────────────────┘
 *
 * Mobile layout (≤768px):
 * ┌──────────────────────┐
 * │ MobileTopBar          │  48px — back, undo, redo, delete, play, layers
 * ├──────────────────────┤
 * │                      │
 * │   Stage Viewport     │  flex: 1 — always visible
 * │                      │
 * ├──────────────────────┤
 * │ MobileBottomPanel    │  260px — context-sensitive tabs
 * │ [Add] or [Font][Style]│
 * │ [Spacing][Color]...  │
 * └──────────────────────┘
 * + MobileLayersSheet overlay (portal, on ☰ tap)
 */

import {useEffect, useRef} from 'react';
import type {V2Document} from '@vary/v2/schema/document';
import {useDocumentStore} from '../stores/documentStore';
import {useEditorStore} from '../stores/editorStore';
import EditorToolbar from './toolbar/EditorToolbar';
import MobileTopBar from './toolbar/MobileTopBar';
import LayersPanel from './panels/LayersPanel';
import StageViewport from './Stage';
import PropertiesPanel from './panels/PropertiesPanel';
import MobileBottomPanel from './panels/MobileBottomPanel';
import MobileLayersSheet from './panels/MobileLayersSheet';
import FullScreenGallery from './galleries/FullScreenGallery';
import PhotoGallery from './galleries/PhotoGallery';
import VideoGallery from './galleries/VideoGallery';
import ObjectGallery from './galleries/ObjectGallery';
import BackgroundGallery from './galleries/BackgroundGallery';
import MusicGallery from './galleries/MusicGallery';
import DataGallery from './galleries/DataGallery';

interface EditorProps {
  document: V2Document;
  onDocumentChange?: (doc: V2Document) => void;
}

export default function Editor({
  document: initialDocument,
  onDocumentChange,
}: EditorProps) {
  const loadDocument = useDocumentStore((s) => s.loadDocument);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const document = useDocumentStore((s) => s.document);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const playing = useEditorStore((s) => s.playing);
  const playbackKey = useEditorStore((s) => s.playbackKey);
  const setCurrentFrame = useEditorStore((s) => s.setCurrentFrame);
  const activeGallery = useEditorStore((s) => s.activeGallery);
  const closeGallery = useEditorStore((s) => s.closeGallery);

  // ─── Playback ticker ─────────────────────────────────────────
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let lastTime = performance.now();
    const fps = 30;
    const tick = (now: number) => {
      const dt = now - lastTime;
      const frameAdvance = Math.floor((dt / 1000) * fps);
      if (frameAdvance > 0) {
        lastTime = now;
        const store = useEditorStore.getState();
        setCurrentFrame(store.currentFrame + frameAdvance);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, setCurrentFrame]);

  // Load initial document
  useEffect(() => {
    loadDocument(initialDocument);
  }, [initialDocument.id]);

  // Notify parent of changes
  useEffect(() => {
    onDocumentChange?.(document);
  }, [document, onDocumentChange]);

  // ─── Keyboard Shortcuts ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) return;

      const mod = e.metaKey || e.ctrlKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          dispatch({type: 'DELETE_ELEMENT', elementId: selectedElementId});
          selectElement(null);
        }
      } else if (e.key === 'd' && mod && !e.shiftKey) {
        e.preventDefault();
        if (selectedElementId) {
          dispatch({type: 'DUPLICATE_ELEMENT', elementId: selectedElementId});
        }
      } else if (e.key === 'z' && mod && e.shiftKey) {
        e.preventDefault();
        dispatch({type: 'REDO'});
      } else if (e.key === 'z' && mod) {
        e.preventDefault();
        dispatch({type: 'UNDO'});
      } else if (e.key === 'Escape') {
        selectElement(null);
      } else if (selectedElementId) {
        const delta = e.shiftKey ? 0.05 : 0.01;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          dispatch({type: 'NUDGE_ELEMENT', elementId: selectedElementId, dx: 0, dy: -delta});
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          dispatch({type: 'NUDGE_ELEMENT', elementId: selectedElementId, dx: 0, dy: delta});
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          dispatch({type: 'NUDGE_ELEMENT', elementId: selectedElementId, dx: -delta, dy: 0});
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          dispatch({type: 'NUDGE_ELEMENT', elementId: selectedElementId, dx: delta, dy: 0});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, selectedElementId, selectElement]);

  return (
    <div className="v2-editor-shell" style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', // dynamic viewport — excludes mobile browser chrome
      background: '#0F172A',
    }}>
      {/* ── Desktop: EditorToolbar ── */}
      {/* ── Mobile: MobileTopBar   ── */}
      <div className="desktop-toolbar">
        <EditorToolbar />
      </div>
      <div className="mobile-topbar" style={{display: 'none'}}>
        <MobileTopBar />
      </div>

      {/* ── Main content area ── */}
      <div style={{display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0}}>
        {/* Layers — desktop only */}
        <div className="editor-layers" style={{display: 'flex', flexShrink: 0}}>
          <LayersPanel />
        </div>

        {/* Stage */}
        <div style={{flex: 1, background: '#1e1e1e', minWidth: 0}}>
          <StageViewport aspectRatio={aspectRatio} playbackKey={playbackKey} playing={playing} />
        </div>

        {/* Properties — desktop only */}
        <div className="editor-properties" style={{display: 'flex', flexShrink: 0}}>
          <PropertiesPanel />
        </div>
      </div>

      {/* ── Mobile: Bottom Panel (context-sensitive properties) ── */}
      <div className="mobile-bottom-panel" style={{display: 'none'}}>
        <MobileBottomPanel />
      </div>

      {/* ── Mobile: Layers Sheet (portal overlay) ── */}
      <MobileLayersSheet />

      {/* ── Full-screen gallery (portal overlay) ── */}
      {activeGallery === 'photos' && <PhotoGallery />}
      {activeGallery === 'videos' && <VideoGallery />}
      {activeGallery === 'objects' && <ObjectGallery />}
      {activeGallery === 'background' && <BackgroundGallery />}
      {activeGallery === 'music' && <MusicGallery />}
      {activeGallery === 'data' && <DataGallery />}
      {activeGallery && !['photos','videos','objects','background','music','data'].includes(activeGallery) && (
        <FullScreenGallery title={galleryTitle(activeGallery)} onClose={closeGallery}>
          <GalleryPlaceholder type={activeGallery} />
        </FullScreenGallery>
      )}

      {/* ── Responsive CSS ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-toolbar       { display: none !important; }
          .editor-layers         { display: none !important; }
          .editor-properties     { display: none !important; }
          .mobile-topbar         { display: flex !important; }
          .mobile-bottom-panel   { display: flex !important; }
          .toolbar-mobile-divider { display: none !important; }
          .toolbar-mobile-btn    { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar         { display: none !important; }
          .mobile-bottom-panel   { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Gallery Helpers ──────────────────────────────────────────────

function galleryTitle(type: string): string {
  const titles: Record<string, string> = {
    templates: 'Templates', photos: 'Add photo', videos: 'Add video',
    objects: 'Add object', background: 'Background', music: 'Music',
    data: 'Data & Mail Merge', scenes: 'Scenes',
  };
  return titles[type] ?? type;
}

function GalleryPlaceholder({type}: {type: string}) {
  return (
    <div style={{padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14}}>
      <div style={{fontSize: 48, marginBottom: 16}}>
        {type === 'photos' && '🖼'}
        {type === 'videos' && '🎬'}
        {type === 'objects' && '◻'}
        {type === 'background' && '🎨'}
        {type === 'music' && '🎵'}
        {type === 'templates' && '📄'}
        {type === 'data' && '📊'}
        {type === 'scenes' && '🎞'}
      </div>
      <div style={{fontSize: 17, fontWeight: 600, color: '#E2E8F0', marginBottom: 8}}>
        {galleryTitle(type)}
      </div>
      <div>Coming soon — gallery content will be added in the next update.</div>
    </div>
  );
}
