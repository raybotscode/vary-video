/**
 * DataGallery — full-screen mail merge data workspace.
 *
 * Tabs: Import (CSV/JSON), Rows (variant cards), Tags (merge tag definitions).
 *
 * Uses mergeDataStore (not the old mergeStore) so that useMergePreview
 * can actually resolve tags on the canvas.
 */

import {useState, useRef, useCallback} from 'react';
import FullScreenGallery from './FullScreenGallery';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {useMergeDataStore, parseCSV, parseJSON} from '../../stores/mergeDataStore';
import type {MergeTag} from '@vary/v2/schema/document';

type Tab = 'import' | 'rows' | 'tags';

export default function DataGallery() {
  const closeGallery = useEditorStore((s) => s.closeGallery);

  const [tab, setTab] = useState<Tab>('import');
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Merge tags live in the document store
  const mergeTags = useDocumentStore((s) => s.document.mergeTags ?? []);
  const dispatch = useDocumentStore((s) => s.dispatch);

  // Runtime data in mergeDataStore
  const {
    rows, headers, previewRowIndex,
    columnMapping, importSource, importFilename,
    errors,
    setRows, setHeaders, setPreviewRow,
    setColumnMapping, setImportMeta,
    reset,
  } = useMergeDataStore();

  // Handle file import
  const handleFile = useCallback(async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();

      let result: {headers: string[]; rows: Record<string, string>[]};
      if (ext === 'csv') {
        result = parseCSV(text);
        setImportMeta('csv', file.name);
      } else if (ext === 'json') {
        result = parseJSON(text);
        setImportMeta('json', file.name);
      } else {
        setImportError('Unsupported file type. Use .csv or .json');
        return;
      }

      if (result.rows.length === 0) {
        setImportError('No data rows found');
        return;
      }

      setHeaders(result.headers);
      setRows(result.rows);

      // Auto-map columns to tags if tags exist with matching keys
      if (mergeTags.length > 0) {
        const autoMapping: Record<string, string> = {};
        for (const header of result.headers) {
          const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matchingTag = mergeTags.find((t) => t.key.toLowerCase().replace(/[^a-z0-9]/g, '') === key);
          if (matchingTag) {
            autoMapping[header] = matchingTag.id;
          }
        }
        setColumnMapping(autoMapping);
      }

      setTab('rows');
    } catch (e: any) {
      setImportError(e.message ?? 'Failed to parse file');
    }
  }, [setRows, setHeaders, setImportMeta, setColumnMapping, mergeTags]);

  const handleColumnMap = (header: string, tagId: string) => {
    setColumnMapping({...columnMapping, [header]: tagId});
  };

  const tabs = [
    {key: 'import', label: 'Import'},
    {key: 'rows', label: `Rows${rows.length > 0 ? ` (${rows.length})` : ''}`},
    {key: 'tags', label: 'Tags'},
  ];

  return (
    <FullScreenGallery
      title="Data & Mail Merge"
      onClose={closeGallery}
      tabs={tabs}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
    >
      <style>{`
        @keyframes row-pulse {
          0%, 100% { background: #1E3A5F; }
          50% { background: #2D4A7C; }
        }
      `}</style>

      {/* ── IMPORT TAB ─────────────────────────────────── */}
      {tab === 'import' && (
        <div style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 16}}>
          <div style={{color: '#E2E8F0', fontSize: 16, fontWeight: 600}}>Import variant data</div>
          <div style={{color: '#94A3B8', fontSize: 13, lineHeight: 1.6}}>
            Upload a CSV or JSON file with your variant data. Each row becomes one video variant.
            Columns will be mapped to merge tags like {'{{productName}}'}, {'{{price}}'}, etc.
          </div>

          {/* Import button */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            style={{display: 'none'}}
          />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '20px', borderRadius: 12,
              background: '#1E293B', border: '2px dashed #334155',
              color: '#93C5FD', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', minHeight: 80,
            }}
          >
            <span style={{fontSize: 28}}>📂</span>
            Choose CSV or JSON file
          </button>

          {importError && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: '#450A0A', border: '1px solid #991B1B',
              color: '#FCA5A5', fontSize: 13,
            }}>{importError}</div>
          )}

          {importFilename && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: '#052E16', border: '1px solid #166534',
              color: '#86EFAC', fontSize: 13,
            }}>
              ✅ {importFilename} — {rows.length} rows, {headers.length} columns
            </div>
          )}

          {/* Column mapping */}
          {headers.length > 0 && mergeTags.length > 0 && (
            <div style={{marginTop: 8}}>
              <div style={{color: '#94A3B8', fontSize: 12, fontWeight: 500, marginBottom: 8}}>
                Map columns to merge tags
              </div>
              {headers.map((header) => (
                <div key={header} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderBottom: '1px solid #1E293B',
                }}>
                  <span style={{color: '#E2E8F0', fontSize: 13, minWidth: 100}}>{header}</span>
                  <span style={{color: '#64748B'}}>→</span>
                  <select
                    value={columnMapping[header] ?? ''}
                    onChange={(e) => handleColumnMap(header, e.target.value)}
                    style={{
                      flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 6,
                      border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0',
                    }}
                  >
                    <option value="">— Ignore —</option>
                    {mergeTags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {`{{${tag.key}}}`} ({tag.type})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {headers.length > 0 && mergeTags.length === 0 && (
            <div style={{
              padding: '16px', borderRadius: 8,
              background: '#1E293B', border: '1px solid #334155',
              color: '#94A3B8', fontSize: 13, textAlign: 'center',
            }}>
              No merge tags defined yet. Create tags in your document template first,
              or use the Tags tab to create them after importing.
            </div>
          )}
        </div>
      )}

      {/* ── ROWS TAB ──────────────────────────────────── */}
      {tab === 'rows' && (
        <div style={{paddingBottom: 24}}>
          {rows.length === 0 ? (
            <div style={{padding: 40, textAlign: 'center', color: '#64748B'}}>
              No data. Import a CSV or JSON file first.
            </div>
          ) : (
            <>
              {/* Row navigator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px',
                borderBottom: '1px solid #1E293B',
              }}>
                <button
                  onClick={() => {
                    const idx = previewRowIndex ?? 0;
                    setPreviewRow(idx > 0 ? idx - 1 : rows.length - 1);
                  }}
                  style={navBtn}
                >◀ Prev</button>
                <span style={{color: '#E2E8F0', fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'center'}}>
                  {previewRowIndex !== null
                    ? `Row ${previewRowIndex + 1} of ${rows.length}`
                    : `${rows.length} rows imported — select a row to preview`}
                </span>
                <button
                  onClick={() => {
                    const idx = previewRowIndex ?? -1;
                    setPreviewRow(idx < rows.length - 1 ? idx + 1 : 0);
                  }}
                  style={navBtn}
                >Next ▶</button>
              </div>

              {/* Row list */}
              {rows.map((row, i) => {
                const isActive = previewRowIndex === i;
                const rowErrors = errors.filter((e) => e.rowIndex === i);
                return (
                  <div
                    key={i}
                    onClick={() => setPreviewRow(isActive ? null : i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', cursor: 'pointer',
                      background: isActive ? '#1E3A5F' : 'transparent',
                      borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                      borderBottom: '1px solid #1E293B',
                    }}
                  >
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isActive ? '#3B82F6' : '#334155',
                      display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: isActive ? '#fff' : '#94A3B8', fontSize: 13, fontWeight: 600,
                    }}>{i + 1}</span>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{
                        color: '#E2E8F0', fontSize: 13, fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {Object.values(row).slice(0, 3).join(' · ')}
                      </div>
                      <div style={{fontSize: 10, color: '#64748B', marginTop: 2}}>
                        {Object.keys(row).length} fields
                        {rowErrors.length > 0 && (
                          <span style={{color: '#F87171', marginLeft: 8}}>
                            {rowErrors.length} errors
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <span style={{color: '#3B82F6', fontSize: 12}}>● Previewing</span>}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── TAGS TAB ──────────────────────────────────── */}
      {tab === 'tags' && (
        <div style={{padding: 16}}>
          <div style={{color: '#94A3B8', fontSize: 13, marginBottom: 12}}>
            Merge tags define which fields your template supports.
            Use {'{{tagKey}}'} in text content, colors, and image URLs.
          </div>

          {mergeTags.length === 0 ? (
            <div style={{padding: 24, textAlign: 'center', color: '#64748B'}}>
              No merge tags defined yet. Create tags using the {'{x}'} icon next to properties
              in the editor, or add tags directly here.
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              {mergeTags.map((tag) => (
                <div key={tag.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px', borderRadius: 8,
                  background: '#1E293B', border: '1px solid #334155',
                }}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{
                      color: '#E2E8F0', fontSize: 14, fontWeight: 600,
                      fontFamily: 'monospace',
                    }}>{`{{${tag.key}}}`}</div>
                    <div style={{color: '#64748B', fontSize: 11, marginTop: 2}}>
                      {tag.label ?? ''} · Type: {tag.type}
                      {tag.required && ' · Required'}
                      {tag.defaultValue && ` · Default: ${tag.defaultValue}`}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 4,
                    background: '#334155', color: '#94A3B8',
                    fontSize: 10, fontWeight: 600,
                  }}>{tag.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </FullScreenGallery>
  );
}

const navBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: '#1E293B', color: '#93C5FD', fontSize: 13, fontWeight: 600,
};
