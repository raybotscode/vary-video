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
  selectedRatios: AspectRatio[];
  rowMode: RowSelectionMode;
  singleRowIndex: number;       // 0-based, for 'single' mode
  rangeFrom: number;             // 0-based, for 'range' mode
  rangeTo: number;               // 0-based inclusive, for 'range' mode
}

export interface VariantProgress {
  key: string;                   // e.g. "16:9-row-3"
  label: string;                 // e.g. "16:9 — Row 3"
  progress: number;              // 0-100
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

export const useExportStore = create<ExportState>((set) => ({
  settings: {...defaultSettings},
  jobId: null,
  isRendering: false,
  variants: [],

  setSettings: (partial) => set((s) => ({settings: {...s.settings, ...partial}})),

  setSelectedRatios: (ratios) => set((s) => ({
    settings: {...s.settings, selectedRatios: ratios.length > 0 ? ratios : ['16:9']},
  })),

  setRowMode: (rowMode) => set((s) => ({settings: {...s.settings, rowMode}})),
  setSingleRowIndex: (singleRowIndex) => set((s) => ({settings: {...s.settings, singleRowIndex}})),
  setRangeFrom: (rangeFrom) => set((s) => ({settings: {...s.settings, rangeFrom}})),
  setRangeTo: (rangeTo) => set((s) => ({settings: {...s.settings, rangeTo}})),

  startRender: (jobId, variants) => set({jobId, isRendering: true, variants}),

  updateVariantProgress: (key, progress, status) => set((s) => ({
    variants: s.variants.map((v) =>
      v.key === key ? {...v, progress, status: (status as VariantProgress['status']) ?? v.status} : v,
    ),
  })),

  completeVariant: (key, downloadUrl) => set((s) => ({
    variants: s.variants.map((v) =>
      v.key === key ? {...v, progress: 100, status: 'completed', downloadUrl} : v,
    ),
  })),

  failVariant: (key, error) => set((s) => ({
    variants: s.variants.map((v) =>
      v.key === key ? {...v, status: 'failed', error} : v,
    ),
  })),

  completeAll: () => set({isRendering: false}),
  failAll: (_error) => set({isRendering: false}),

  reset: () => set({
    settings: {...defaultSettings},
    jobId: null,
    isRendering: false,
    variants: [],
  }),
}));

/** Compute which row indices to render based on settings */
export function computeRowIndices(settings: ExportSettings, totalRows: number): number[] {
  if (totalRows === 0) return [];
  switch (settings.rowMode) {
    case 'single': {
      const idx = Math.max(0, Math.min(settings.singleRowIndex, totalRows - 1));
      return [idx];
    }
    case 'range': {
      const from = Math.max(0, Math.min(settings.rangeFrom, totalRows - 1));
      const to = Math.max(from, Math.min(settings.rangeTo, totalRows - 1));
      return Array.from({length: to - from + 1}, (_, i) => from + i);
    }
    case 'all':
    default:
      return Array.from({length: totalRows}, (_, i) => i);
  }
}
