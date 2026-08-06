/**
 * Export Panel Sections — sub-components for MobileExportSheet.
 *
 * Follows the styling patterns from MobileBottomPanel.tsx:
 * Dark theme, #1A202C background, #3B82F6 accent.
 */

import type {AspectRatio} from '@vary/v2/schema/document';
import {ASPECT_DIMENSIONS} from '@vary/v2/schema/document';
import type {RowSelectionMode, VariantProgress} from '../../stores/exportStore';
import {apiClient} from '../../../api/client';

// ─── Aspect Ratio Section ────────────────────────────────────────

interface AspectRatioSectionProps {
  selected: AspectRatio[];
  onChange: (ratios: AspectRatio[]) => void;
}

export function AspectRatioSection({selected, onChange}: AspectRatioSectionProps) {
  const ratios: {key: AspectRatio; label: string; dims: string}[] = [
    {key: '16:9', label: 'Landscape', dims: '1920×1080'},
    {key: '9:16', label: 'Vertical', dims: '1080×1920'},
    {key: '1:1', label: 'Square', dims: '1920×1920'},
  ];

  const toggle = (ratio: AspectRatio) => {
    if (selected.includes(ratio)) {
      if (selected.length === 1) return; // keep at least one
      onChange(selected.filter((r) => r !== ratio));
    } else {
      onChange([...selected, ratio]);
    }
  };

  return (
    <Section label="Aspect Ratios" subtitle={`${selected.length}`}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        {ratios.map((r) => {
          const active = selected.includes(r.key);
          return (
            <button key={r.key} onClick={() => toggle(r.key)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: active ? '#1E3A5F' : '#2D3748',
              border: active ? '1px solid #3B82F6' : '1px solid #374151',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.15s',
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: 4,
                border: `2px solid ${active ? '#3B82F6' : '#4A5568'}`,
                background: active ? '#3B82F6' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.15s',
              }}>
                {active && <span style={{color: '#fff', fontSize: 12, lineHeight: 1}}>✓</span>}
              </span>
              <div style={{flex: 1}}>
                <div style={{color: '#E2E8F0', fontSize: 13, fontWeight: 500}}>{r.key} {r.label}</div>
                <div style={{color: '#9CA3AF', fontSize: 10, marginTop: 1}}>{r.dims}</div>
              </div>
              {selected.length === 1 && active && (
                <span style={{color: '#F87171', fontSize: 10}}>required</span>
              )}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Row Selection Section ───────────────────────────────────────

interface RowSelectionSectionProps {
  mode: RowSelectionMode;
  singleRowIndex: number;
  rangeFrom: number;
  rangeTo: number;
  totalRows: number;
  hasData: boolean;
  onModeChange: (mode: RowSelectionMode) => void;
  onSingleChange: (index: number) => void;
  onRangeFromChange: (from: number) => void;
  onRangeToChange: (to: number) => void;
}

export function RowSelectionSection({
  mode, singleRowIndex, rangeFrom, rangeTo,
  totalRows, hasData,
  onModeChange, onSingleChange, onRangeFromChange, onRangeToChange,
}: RowSelectionSectionProps) {
  return (
    <Section label="Data Rows" subtitle={hasData ? `${totalRows} loaded` : 'No data'}>
      {!hasData && (
        <div style={{color: '#FBBF24', fontSize: 12, marginBottom: 10}}>
          No merge data loaded — will export one video using only the template.
        </div>
      )}

      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        {([
          {key: 'all', label: 'All rows', desc: hasData ? `${totalRows} videos` : '1 video'},
          {key: 'single', label: 'Single row', desc: 'One specific row'},
          {key: 'range', label: 'Range', desc: 'From row X to Y'},
        ] as const).map((opt) => (
          <button key={opt.key} onClick={() => onModeChange(opt.key)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 8,
            background: mode === opt.key ? '#1E3A5F' : '#2D3748',
            border: mode === opt.key ? '1px solid #3B82F6' : '1px solid #374151',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              border: `2px solid ${mode === opt.key ? '#3B82F6' : '#4A5568'}`,
              background: mode === opt.key ? '#3B82F6' : 'transparent',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {mode === opt.key && <span style={{width: 8, height: 8, borderRadius: '50%', background: '#fff'}} />}
            </span>
            <div style={{flex: 1}}>
              <div style={{color: mode === opt.key ? '#93C5FD' : '#E2E8F0', fontSize: 13, fontWeight: 500}}>{opt.label}</div>
              <div style={{color: '#9CA3AF', fontSize: 10, marginTop: 1}}>{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Number inputs for single/range */}
      {mode === 'single' && hasData && (
        <div style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{color: '#9CA3AF', fontSize: 12}}>Row #</span>
          <NumberInput
            value={singleRowIndex + 1}
            min={1} max={totalRows}
            onChange={(v) => onSingleChange(v - 1)}
          />
          <span style={{color: '#6B7280', fontSize: 11}}>of {totalRows}</span>
        </div>
      )}
      {mode === 'range' && hasData && (
        <div style={{marginTop: 10, display: 'flex', alignItems: 'center', gap: 8}}>
          <span style={{color: '#9CA3AF', fontSize: 12}}>From</span>
          <NumberInput value={rangeFrom + 1} min={1} max={totalRows}
            onChange={(v) => onRangeFromChange(v - 1)} />
          <span style={{color: '#9CA3AF', fontSize: 12}}>to</span>
          <NumberInput value={rangeTo + 1} min={1} max={totalRows}
            onChange={(v) => onRangeToChange(v - 1)} />
          <span style={{color: '#6B7280', fontSize: 11}}>of {totalRows}</span>
        </div>
      )}
    </Section>
  );
}

// ─── Export Button Section ────────────────────────────────────────

interface ExportButtonSectionProps {
  onClick: () => void;
  disabled: boolean;
  totalVariants: number;
}

export function ExportButtonSection({onClick, disabled, totalVariants}: ExportButtonSectionProps) {
  return (
    <Section label="Ready to Export">
      <button onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: disabled ? '14px 20px' : '16px 20px',
        borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled ? '#374151' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
        color: disabled ? '#6B7280' : '#fff',
        fontSize: 15, fontWeight: 700,
        transition: 'all 0.15s',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
      }}>
        {disabled && totalVariants === 0 ? 'Select settings above' : `Export ${totalVariants} Video${totalVariants !== 1 ? 's' : ''}`}
      </button>
      {!disabled && totalVariants > 0 && (
        <div style={{textAlign: 'center', color: '#9CA3AF', fontSize: 10, marginTop: 6}}>
          {totalVariants > 20 ? '⚠ This may take several minutes' : 'Estimated time: ~1-3 minutes'}
        </div>
      )}
    </Section>
  );
}

// ─── Progress Section ─────────────────────────────────────────────

interface ProgressSectionProps {
  variants: VariantProgress[];
  jobId: string | null;
  isRendering: boolean;
}

export function ProgressSection({variants, jobId, isRendering}: ProgressSectionProps) {
  const completed = variants.filter((v) => v.status === 'completed').length;
  const failed = variants.filter((v) => v.status === 'failed').length;
  const total = variants.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Section label="Rendering Progress" subtitle={jobId ? `Job: ${jobId.slice(0, 8)}…` : undefined}>
      {/* Overall progress */}
      <div style={{marginBottom: 12}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
          <span style={{color: '#E2E8F0', fontSize: 12, fontWeight: 600}}>
            {isRendering ? 'Rendering…' : completed === total ? 'Complete' : `${completed}/${total} done`}
          </span>
          <span style={{color: '#9CA3AF', fontSize: 11}}>{pct}%</span>
        </div>
        <div style={{
          height: 6, borderRadius: 3, background: '#2D3748', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: isRendering ? 'linear-gradient(90deg, #3B82F6, #60A5FA)' : '#38A169',
            borderRadius: 3, transition: 'width 0.3s',
          }} />
        </div>
        {failed > 0 && (
          <div style={{color: '#F87171', fontSize: 10, marginTop: 4}}>{failed} failed</div>
        )}
      </div>

      {/* Per-variant rows */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflow: 'auto'}}>
        {variants.map((v) => (
          <div key={v.key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 6,
            background: v.status === 'failed' ? '#3B1E1E' : '#2D3748',
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10,
              background: v.status === 'completed' ? '#38A169' :
                v.status === 'failed' ? '#E53E3E' :
                v.status === 'rendering' ? '#3B82F6' : '#4A5568',
              color: '#fff',
            }}>
              {v.status === 'completed' ? '✓' : v.status === 'failed' ? '✕' : v.status === 'rendering' ? '↻' : '·'}
            </span>
            <span style={{flex: 1, color: '#E2E8F0', fontSize: 11, fontWeight: 500}}>{v.label}</span>
            {v.status === 'rendering' && (
              <span style={{color: '#60A5FA', fontSize: 10}}>{v.progress}%</span>
            )}
            {v.status === 'failed' && v.error && (
              <span style={{color: '#F87171', fontSize: 10, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={v.error}>{v.error}</span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Downloads Section ────────────────────────────────────────────

interface DownloadsSectionProps {
  variants: VariantProgress[];
  jobId: string | null;
}

export function DownloadsSection({variants, jobId}: DownloadsSectionProps) {
  const completed = variants.filter((v) => v.status === 'completed');

  return (
    <Section label="Downloads" subtitle={`${completed.length} file${completed.length !== 1 ? 's' : ''}`}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
        {completed.map((v) => (
          <a key={v.key} href={v.downloadUrl} download
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 6,
              background: '#1E3A5F', border: '1px solid #2D4A7C',
              textDecoration: 'none',
            }}>
            <span style={{fontSize: 16}}>⬇</span>
            <span style={{flex: 1, color: '#93C5FD', fontSize: 12, fontWeight: 500}}>{v.label}</span>
            <span style={{color: '#60A5FA', fontSize: 11}}>.mp4</span>
          </a>
        ))}
      </div>

      {/* ZIP download */}
      {completed.length > 1 && jobId && (
        <a href={apiClient.getZipDownloadUrl(jobId)} download
          target="_blank" rel="noopener noreferrer"
          style={{
            marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 16px', borderRadius: 10,
            background: '#38A169', border: 'none',
            textDecoration: 'none', color: '#fff',
            fontSize: 14, fontWeight: 700,
          }}>
          <span>📦</span>
          Download All as ZIP
        </a>
      )}
    </Section>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────

function Section({label, subtitle, children}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '14px 20px', borderBottom: '1px solid #2D3748',
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10}}>
        <span style={{color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1}}>{label}</span>
        {subtitle && <span style={{color: '#6B7280', fontSize: 10}}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Number Input ──────────────────────────────────────────────────

function NumberInput({value, min, max, onChange}: {
  value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min} max={max}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= min && v <= max) onChange(v);
      }}
      style={{
        width: 56, padding: '6px 8px', fontSize: 13,
        borderRadius: 6, textAlign: 'center',
        border: '1px solid #374151', background: '#2D3748', color: '#E2E8F0',
        boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}
