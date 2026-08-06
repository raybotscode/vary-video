/**
 * useMergePreview — resolves merge tags in element props for canvas preview.
 *
 * When a preview row is selected in the merge data store AND showMergeData is
 * enabled in the editor store, this hook resolves BindableText tokens and
 * BindableValue references against the row data.
 *
 * When showMergeData is disabled, props are returned as-is (or serialized).
 *
 * Usage in ElementRenderer:
 *   const {resolvedProps, showTagHighlights} = useMergePreview(element);
 */

import {useMemo} from 'react';
import type {V2Element, MergeTag} from '@vary/v2/schema/document';
import type {BindableText, BindableValue} from '@vary/v2/schema/bindable';
import {resolveBindableText, resolveBindableValue, serializeBindableText} from '@vary/v2/schema/bindable';
import {useMergeDataStore} from '../stores/mergeDataStore';
import {useEditorStore} from '../stores/editorStore';
import {useDocumentStore} from '../stores/documentStore';

export interface MergePreviewResult {
  /** Props with merge tags resolved (or serialized if toggle off). */
  resolvedProps: Record<string, unknown>;
  /** Whether preview mode is currently active. */
  isPreviewActive: boolean;
  /** Whether merge tag highlights should be shown on canvas. */
  showTagHighlights: boolean;
}

/**
 * Given an element, returns its props with merge tags resolved if preview
 * is active and showMergeData is toggled on.
 */
export function useMergePreview(element: V2Element): MergePreviewResult {
  const previewRowIndex = useMergeDataStore((s) => s.previewRowIndex);
  const getResolvedValues = useMergeDataStore((s) => s.getResolvedValues);
  const showMergeData = useEditorStore((s) => s.showMergeData);
  const showMergeTags = useEditorStore((s) => s.showMergeTags);
  const tags = useDocumentStore((s) => s.document.mergeTags);

  return useMemo(() => {
    const isPreviewActive = previewRowIndex !== null && showMergeData;
    const showTagHighlights = showMergeTags;

    if (!isPreviewActive) {
      // Serialize any BindableText back to display strings
      const props: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(element.props as Record<string, unknown>)) {
        if (isBindableText(value)) {
          props[key] = serializeBindableText(value);
        } else if (isBindableValue(value) && value._type === 'tag') {
          const tag = tags.find((t) => t.id === value.tagId);
          props[key] = tag ? `{{${tag.key}}}` : `{{unknown}}`;
        } else if (isBindableValue(value) && value._type === 'literal') {
          props[key] = value.value;
        } else {
          props[key] = value;
        }
      }
      return {resolvedProps: props, isPreviewActive: false, showTagHighlights};
    }

    // Resolve against preview row
    const rowData = getResolvedValues(previewRowIndex!, tags);
    const props: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(element.props as Record<string, unknown>)) {
      if (isBindableText(value)) {
        props[key] = resolveBindableText(value, rowData, 'preserve');
      } else if (isBindableValue(value)) {
        const resolved = resolveBindableValue(value as BindableValue, rowData);
        props[key] = resolved !== undefined ? resolved : '';
      } else if (typeof value === 'string' && /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/.test(value)) {
        // Plain string with {{tag}} patterns — resolve them against row data
        props[key] = value.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_match, tagKey: string) => {
          return rowData[tagKey] !== undefined ? String(rowData[tagKey]) : `{{${tagKey}}}`;
        });
      } else {
        props[key] = value;
      }
    }

    return {resolvedProps: props, isPreviewActive: true, showTagHighlights};
  }, [element.props, previewRowIndex, showMergeData, showMergeTags, tags, getResolvedValues]);
}

/** Type guard for BindableText objects. */
function isBindableText(value: unknown): value is BindableText {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any)._type === 'bindableText' &&
    Array.isArray((value as any).tokens)
  );
}

/** Type guard for BindableValue objects. */
function isBindableValue(value: unknown): value is BindableValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as any)._type === 'literal' || (value as any)._type === 'tag')
  );
}

/**
 * Returns whether a merge preview is currently active.
 */
export function useIsMergePreview(): boolean {
  const previewRowIndex = useMergeDataStore((s) => s.previewRowIndex);
  const showMergeData = useEditorStore((s) => s.showMergeData);
  return previewRowIndex !== null && showMergeData;
}

/**
 * Returns the current preview row index, or null if not previewing.
 */
export function usePreviewRowIndex(): number | null {
  return useMergeDataStore((s) => s.previewRowIndex);
}
