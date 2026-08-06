/**
 * Mobile Export Sheet — bottom sheet for configuring and running exports.
 *
 * Slides up from the bottom when the Export button (⬇) is tapped.
 * Pattern: identical to MobileLayersSheet.tsx — portal overlay.
 *
 * Sections:
 * 1. Header: "Export Video" with close button
 * 2. Aspect Ratio Selection: multi-select checkboxes for 16:9, 9:16, 1:1
 * 3. Row Selection: All / Single / Range with number inputs
 * 4. Export button
 * 5. Progress section (visible during/after render)
 * 6. Downloads section (visible when render has completed outputs)
 */

import {useCallback, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {useMergeDataStore} from '../../stores/mergeDataStore';
import {useExportStore, computeRowIndices} from '../../stores/exportStore';
import {apiClient} from '../../../api/client';
import {ASPECT_DIMENSIONS} from '@vary/v2/schema/document';
import type {AspectRatio} from '@vary/v2/schema/document';
import {
  AspectRatioSection,
  RowSelectionSection,
  ExportButtonSection,
  ProgressSection,
  DownloadsSection,
} from './ExportSections';

export default function MobileExportSheet() {
  const open = useEditorStore((s) => s.exportPanelOpen);
  const close = useEditorStore((s) => s.closeExportPanel);

  const document = useDocumentStore((s) => s.document);
  const mergeRows = useMergeDataStore((s) => s.rows);
  const totalRows = mergeRows.length;
  const hasData = totalRows > 0;

  const settings = useExportStore((s) => s.settings);
  const setSelectedRatios = useExportStore((s) => s.setSelectedRatios);
  const setRowMode = useExportStore((s) => s.setRowMode);
  const setSingleRowIndex = useExportStore((s) => s.setSingleRowIndex);
  const setRangeFrom = useExportStore((s) => s.setRangeFrom);
  const setRangeTo = useExportStore((s) => s.setRangeTo);
  const isRendering = useExportStore((s) => s.isRendering);
  const variants = useExportStore((s) => s.variants);
  const jobId = useExportStore((s) => s.jobId);
  const startRender = useExportStore((s) => s.startRender);
  const updateVariantProgress = useExportStore((s) => s.updateVariantProgress);
  const completeVariant = useExportStore((s) => s.completeVariant);
  const failVariant = useExportStore((s) => s.failVariant);
  const completeAll = useExportStore((s) => s.completeAll);
  const failAll = useExportStore((s) => s.failAll);

  const selectedRowIndices = computeRowIndices(settings, totalRows);
  const totalVariants = settings.selectedRatios.length * (hasData ? selectedRowIndices.length : 1);

  // ─── Polling ref (for cleanup on close) ─────────────────────────
  const pollRef = useRef<number | null>(null);

  // Resume polling if job was in progress when panel re-opens
  useEffect(() => {
    if (open && jobId && isRendering) {
      startPolling();
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [open, jobId]);

  // ─── Export handler ──────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (settings.selectedRatios.length === 0) return;
    if (hasData && selectedRowIndices.length === 0) return;

    // Build variant entries
    const variantEntries: Array<{key: string; label: string; ratio: AspectRatio; rowIndex: number}> = [];
    for (const ratio of settings.selectedRatios) {
      if (hasData) {
        for (const rowIdx of selectedRowIndices) {
          variantEntries.push({
            key: `${ratio}-row-${rowIdx}`,
            label: `${ratio} — Row ${rowIdx + 1}`,
            ratio,
            rowIndex: rowIdx,
          });
        }
      } else {
        // No data — just one variant per aspect ratio
        variantEntries.push({
          key: ratio,
          label: ratio,
          ratio,
          rowIndex: 0,
        });
      }
    }

    const initialVariants = variantEntries.map((e) => ({
      key: e.key,
      label: e.label,
      progress: 0,
      status: 'queued' as const,
    }));

    // Build template from document
    const template = buildTemplateFromDocument(document);

    // Build variants array for API (row data)
    const apiVariants = hasData
      ? selectedRowIndices.map((rowIdx) => mergeRows[rowIdx])
      : [{}];

    try {
      const response = await apiClient.startBatchRender({
        compositionId: 'SceneBlockPlayer',
        template,
        variants: apiVariants,
        formats: settings.selectedRatios as any[],
      });

      startRender(response.jobId, initialVariants);
      startPolling();
    } catch (err) {
      failAll(err instanceof Error ? err.message : 'Export failed');
    }
  }, [settings, hasData, selectedRowIndices, mergeRows, document]);

  // ─── Polling ─────────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    const poll = async () => {
      const currentJobId = useExportStore.getState().jobId;
      if (!currentJobId) return;

      try {
        const status = await apiClient.getRenderStatus(currentJobId);

        // Map downloads back to variant keys
        if (status.downloads && status.downloadLabels) {
          const currentVariants = useExportStore.getState().variants;
          for (let i = 0; i < status.downloads.length; i++) {
            const downloadUrl = status.downloads[i];
            const label = status.downloadLabels[i] ?? `Variant ${i}`;
            // Find matching variant
            const matching = currentVariants.find((v) =>
              v.label === label || v.key === label,
            );
            if (matching && matching.status !== 'completed') {
              completeVariant(matching.key, downloadUrl);
            }
          }
        }

        // Update progress for in-progress variants
        if (status.progress !== undefined) {
          const currentVariants = useExportStore.getState().variants;
          const notCompleted = currentVariants.filter((v) => v.status !== 'completed' && v.status !== 'failed');
          // Distribute progress across remaining variants
          if (notCompleted.length > 0) {
            const perVariant = Math.round(status.progress / notCompleted.length);
            for (const v of notCompleted) {
              updateVariantProgress(v.key, Math.min(perVariant, 99), 'rendering');
            }
          }
        }

        // Check if done
        if (status.status === 'completed') {
          completeAll();
          return; // stop polling
        }

        // Poll again
        pollRef.current = window.setTimeout(poll, 2000);
      } catch {
        pollRef.current = window.setTimeout(poll, 3000); // back off on error
      }
    };
    poll();
  }, [completeVariant, updateVariantProgress, completeAll]);

  if (!open) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{
        position: 'fixed', inset: 0, zIndex: 10998,
        background: 'rgba(0,0,0,0.4)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 10999, maxHeight: '80vh',
        background: '#1A202C',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        display: 'flex', flexDirection: 'column',
        animation: 'exportsheet-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderBottom: '1px solid #2D3748', flexShrink: 0,
        }}>
          <div>
            <div style={{color: '#E2E8F0', fontSize: 16, fontWeight: 700}}>Export Video</div>
            <div style={{color: '#6B7280', fontSize: 11, marginTop: 2}}>
              {document.name || 'Untitled'}
              {totalVariants > 0 && ` · ${settings.selectedRatios.length} format${settings.selectedRatios.length !== 1 ? 's' : ''} × ${hasData ? selectedRowIndices.length : 1} row${(hasData ? selectedRowIndices.length : 1) !== 1 ? 's' : ''} = ${totalVariants} video${totalVariants !== 1 ? 's' : ''}`}
            </div>
          </div>
          <button onClick={close} style={{
            background: 'none', border: 'none',
            color: '#9CA3AF', fontSize: 22, cursor: 'pointer',
            padding: '4px 8px', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24}}>
          {/* 1. Aspect Ratio Selection */}
          <AspectRatioSection
            selected={settings.selectedRatios}
            onChange={setSelectedRatios}
          />

          {/* 2. Row Selection */}
          <RowSelectionSection
            mode={settings.rowMode}
            singleRowIndex={settings.singleRowIndex}
            rangeFrom={settings.rangeFrom}
            rangeTo={settings.rangeTo}
            totalRows={totalRows}
            hasData={hasData}
            onModeChange={setRowMode}
            onSingleChange={setSingleRowIndex}
            onRangeFromChange={setRangeFrom}
            onRangeToChange={setRangeTo}
          />

          {/* 3. Export Button */}
          <ExportButtonSection
            onClick={handleExport}
            disabled={isRendering || settings.selectedRatios.length === 0 || (hasData && selectedRowIndices.length === 0)}
            totalVariants={totalVariants}
          />

          {/* 4. Progress Section */}
          {variants.length > 0 && (
            <ProgressSection variants={variants} jobId={jobId} isRendering={isRendering} />
          )}

          {/* 5. Downloads Section */}
          {variants.some((v) => v.status === 'completed') && (
            <DownloadsSection variants={variants} jobId={jobId} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes exportsheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}

// ─── Template Builder (stub — will be replaced by V2NativeComposition) ──

function buildTemplateFromDocument(document: any): Record<string, unknown> {
  const scene = document.scenes?.[0];
  if (!scene) return {blocks: []};

  return {
    blocks: scene.elements.map((el: any) => ({
      blockId: blockMap[el.type] ?? 'text-block',
      content: el.type === 'text'
        ? {text: typeof el.props.content === 'string' ? el.props.content : ''}
        : el.type === 'image'
          ? {imageUrl: el.props.src ?? ''}
          : {},
      layout: {
        x: el.transform.x, y: el.transform.y,
        width: el.transform.width ?? 0.3,
        height: el.transform.height ?? 0.1,
        zIndex: el.transform.zIndex,
        rotation: el.transform.rotation,
        opacity: el.transform.opacity,
      },
    })),
    brandSettings: {
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#FF6B5B',
      backgroundType: scene.background?.type ?? 'solid',
      backgroundColor: scene.background?.color ?? scene.background?.color1 ?? '#F7FAFC',
    },
    fps: document.fps ?? 30,
    backgroundType: scene.background?.type ?? 'solid',
    backgroundColor: scene.background?.color ?? scene.background?.color1 ?? '#0F172A',
    logoUrl: '',
    width: ASPECT_DIMENSIONS['16:9'].width,
    height: ASPECT_DIMENSIONS['16:9'].height,
  };
}

const blockMap: Record<string, string> = {
  text: 'text-block',
  image: 'image-block',
  shape: 'shape-block',
};
