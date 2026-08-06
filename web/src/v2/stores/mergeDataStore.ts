/**
 * Merge Data Store — Zustand store for mail merge runtime data.
 *
 * Manages imported CSV/JSON rows, column-to-tag mapping (by tagId),
 * preview row selection, and validation.
 *
 * Tag definitions live in the document store (document.mergeTags);
 * this store only holds the ephemeral runtime data.
 */

import {create} from 'zustand';
import type {MergeTag} from '@vary/v2/schema/document';

export interface MergeError {
  rowIndex: number;
  field: string;
  message: string;
}

export interface MergeDataState {
  // Data
  rows: Record<string, string>[];
  columnMapping: Record<string, string>; // CSV header → tagId
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
  setHeaders: (headers: string[]) => void;
  setColumnMapping: (mapping: Record<string, string>) => void;
  setPreviewRow: (index: number | null) => void;
  setImportMeta: (source: 'csv' | 'json' | null, filename: string | null) => void;
  setErrors: (errors: MergeError[]) => void;
  reset: () => void;

  // Resolution (takes tags from document store)
  getResolvedValues: (rowIndex: number, tags: MergeTag[]) => Record<string, unknown>;
  getResolvedRow: (rowIndex: number, tags: MergeTag[]) => Record<string, unknown>;

  // Validation (takes tags from document store)
  validate: (tags: MergeTag[]) => MergeError[];
}

const initial = {
  rows: [],
  columnMapping: {},
  headers: [],
  previewRowIndex: null,
  importSource: null as 'csv' | 'json' | null,
  importFilename: null as string | null,
  errors: [],
};

export const useMergeDataStore = create<MergeDataState>((set, get) => ({
  ...initial,

  setRows: (rows) => set({rows}),
  setHeaders: (headers) => set({headers}),
  setColumnMapping: (columnMapping) => set({columnMapping}),
  setPreviewRow: (previewRowIndex) => set({previewRowIndex}),
  setImportMeta: (importSource, importFilename) => set({importSource, importFilename}),
  setErrors: (errors) => set({errors}),

  getResolvedValues: (rowIndex: number, tags: MergeTag[]): Record<string, unknown> => {
    const {rows, columnMapping} = get();
    const row = rows[rowIndex];
    if (!row) return {};

    const resolved: Record<string, unknown> = {};

    // Build reverse mapping: tagId → csvHeader
    const tagToHeader: Record<string, string> = {};
    for (const [header, tagId] of Object.entries(columnMapping)) {
      tagToHeader[tagId] = header;
    }

    for (const tag of tags) {
      const csvHeader = tagToHeader[tag.id];
      if (csvHeader && row[csvHeader] !== undefined) {
        const raw = row[csvHeader];
        // Type coercion based on tag type
        switch (tag.type) {
          case 'number':
            resolved[tag.id] = Number(raw);
            break;
          case 'currency':
            resolved[tag.id] = Number(raw.replace(/[^0-9.-]/g, ''));
            break;
          case 'boolean':
            resolved[tag.id] = raw.toLowerCase() === 'true' || raw === '1';
            break;
          case 'color':
            resolved[tag.id] = raw.startsWith('#') ? raw : `#${raw}`;
            break;
          default:
            resolved[tag.id] = raw;
        }
      } else {
        resolved[tag.id] = tag.defaultValue ?? '';
      }
    }

    return resolved;
  },

  getResolvedRow: (rowIndex: number, tags: MergeTag[]): Record<string, unknown> => {
    return get().getResolvedValues(rowIndex, tags);
  },

  validate: (tags: MergeTag[]): MergeError[] => {
    const {rows, columnMapping} = get();
    const errors: MergeError[] = [];

    // Build reverse mapping: tagId → csvHeader
    const tagToHeader: Record<string, string> = {};
    for (const [header, tagId] of Object.entries(columnMapping)) {
      tagToHeader[tagId] = header;
    }

    for (let i = 0; i < rows.length; i++) {
      for (const tag of tags) {
        if (tag.required !== true) continue;
        const csvHeader = tagToHeader[tag.id];
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

  reset: () => set({...initial}),
}));

// ─── CSV / JSON Parsers ────────────────────────────────────────────

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
