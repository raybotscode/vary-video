/**
 * Merge Store — Zustand store for mail merge data management.
 *
 * Manages imported CSV/JSON rows, column mapping to merge tags,
 * preview row selection, and validation.
 */

import {create} from 'zustand';
import type {MergeTag} from '@vary/v2/schema/document';

export interface MergeError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface MergeState {
  // Data
  rows: Record<string, string>[];
  columns: MergeTag[];
  columnMapping: Record<string, string>; // CSV header → mergeTag.key
  headers: string[]; // CSV column headers

  // Preview
  previewRowIndex: number | null;

  // Import metadata
  importSource: 'csv' | 'json' | null;
  importFilename: string | null;

  // Validation
  errors: MergeError[];

  // Actions
  setRows: (rows: Record<string, string>[]) => void;
  setColumns: (tags: MergeTag[]) => void;
  setHeaders: (headers: string[]) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setPreviewRow: (index: number | null) => void;
  setImportMeta: (source: 'csv' | 'json' | null, filename: string | null) => void;
  addMergeTag: (tag: MergeTag) => void;
  removeMergeTag: (key: string) => void;
  validate: () => MergeError[];
  setErrors: (errors: MergeError[]) => void;
  reset: () => void;

  // Resolved values helper
  getResolvedValues: (rowIndex: number) => Record<string, unknown>;
}

const initial: Omit<MergeState, 'validate' | 'getResolvedValues' | 'setRows' | 'setColumns' | 'setHeaders' | 'setColumnMapping' | 'setPreviewRow' | 'setImportMeta' | 'addMergeTag' | 'removeMergeTag' | 'setErrors' | 'reset'> = {
  rows: [],
  columns: [],
  columnMapping: {},
  headers: [],
  previewRowIndex: null,
  importSource: null,
  importFilename: null,
  errors: [],
};

export const useMergeStore = create<MergeState>((set, get) => ({
  ...initial,

  setRows: (rows) => set({rows}),
  setColumns: (columns) => set({columns}),
  setHeaders: (headers) => set({headers}),
  setColumnMapping: (columnMapping) => set({columnMapping}),
  setPreviewRow: (previewRowIndex) => set({previewRowIndex}),
  setImportMeta: (importSource, importFilename) => set({importSource, importFilename}),
  setErrors: (errors) => set({errors}),

  addMergeTag: (tag) => set((s) => ({
    columns: s.columns.some((c) => c.key === tag.key)
      ? s.columns
      : [...s.columns, tag],
  })),

  removeMergeTag: (key) => set((s) => ({
    columns: s.columns.filter((c) => c.key !== key),
  })),

  validate: () => {
    const {rows, columns, columnMapping} = get();
    const errors: MergeError[] = [];

    for (let i = 0; i < rows.length; i++) {
      for (const tag of columns) {
        if (tag.required !== true) continue;
        const csvHeader = Object.keys(columnMapping).find(
          (k) => columnMapping[k] === tag.key,
        );
        const value = csvHeader ? rows[i][csvHeader] : undefined;
        if (!value || value.trim() === '') {
          errors.push({
            rowIndex: i,
            field: tag.key,
            message: `Required field "${tag.label ?? tag.key}" is empty`,
          });
        }
      }
    }

    set({errors});
    return errors;
  },

  getResolvedValues: (rowIndex: number): Record<string, unknown> => {
    const {rows, columns, columnMapping} = get();
    const row = rows[rowIndex];
    if (!row) return {};

    const resolved: Record<string, unknown> = {};
    for (const tag of columns) {
      const csvHeader = Object.keys(columnMapping).find(
        (k) => columnMapping[k] === tag.key,
      );
      if (csvHeader && row[csvHeader] !== undefined) {
        const raw = row[csvHeader];
        // Type coercion based on tag type
        switch (tag.type) {
          case 'number':
            resolved[tag.key] = Number(raw);
            break;
          case 'currency':
            resolved[tag.key] = Number(raw.replace(/[^0-9.-]/g, ''));
            break;
          case 'boolean':
            resolved[tag.key] = raw.toLowerCase() === 'true' || raw === '1';
            break;
          case 'color':
            resolved[tag.key] = raw.startsWith('#') ? raw : `#${raw}`;
            break;
          default:
            resolved[tag.key] = raw;
        }
      } else {
        resolved[tag.key] = tag.defaultValue ?? '';
      }
    }
    return resolved;
  },

  reset: () => set({...initial}),
}));

/**
 * Client-side CSV parser (simple — for production use PapaParse).
 */
export function parseCSV(text: string): {headers: string[]; rows: Record<string, string>[]} {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return {headers: [], rows: []};

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h.trim()] = (values[j] ?? '').trim();
    });
    rows.push(row);
  }

  return {headers, rows};
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse JSON data. Expects array of objects.
 */
export function parseJSON(text: string): {headers: string[]; rows: Record<string, string>[]} {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('JSON must be an array of objects');

  const headers = new Set<string>();
  for (const obj of data) {
    Object.keys(obj).forEach((k) => headers.add(k));
  }

  const headerList = Array.from(headers);
  const rows = data.map((obj) => {
    const row: Record<string, string> = {};
    headerList.forEach((h) => {
      row[h] = String(obj[h] ?? '');
    });
    return row;
  });

  return {headers: headerList, rows};
}
