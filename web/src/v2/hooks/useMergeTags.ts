/**
 * useMergeTags — hook for working with merge tags from the document store.
 *
 * Provides tag CRUD operations that dispatch ADD_MERGE_TAG, REMOVE_MERGE_TAG,
 * and UPDATE_MERGE_TAG commands through the document store.
 */

import {useMemo, useCallback} from 'react';
import type {MergeTag, MergeTagType} from '@vary/v2/schema/document';
import {useDocumentStore} from '../stores/documentStore';

export interface UseMergeTagsResult {
  /** All merge tags in the document. */
  tags: MergeTag[];
  /** Map of tag key → tag for quick lookup. */
  tagByKey: Map<string, MergeTag>;
  /** Map of tag id → tag for quick lookup. */
  tagById: Map<string, MergeTag>;

  /** Add a new merge tag. */
  addTag: (params: {
    key: string;
    tagType: MergeTagType;
    label: string;
    defaultValue?: string;
    required?: boolean;
    description?: string;
    format?: string;
  }) => void;

  /** Remove a merge tag by id (cleans up bindings automatically). */
  removeTag: (tagId: string) => void;

  /** Update a merge tag's properties by id. */
  updateTag: (tagId: string, changes: {
    key?: string;
    type?: MergeTagType;
    label?: string;
    defaultValue?: string;
    required?: boolean;
    description?: string;
    format?: string;
  }) => void;
}

/**
 * Hook providing merge tags and CRUD operations.
 * Tags are sourced from the document store (document.mergeTags).
 */
export function useMergeTags(): UseMergeTagsResult {
  const tags = useDocumentStore((s) => s.document.mergeTags);
  const dispatch = useDocumentStore((s) => s.dispatch);

  const tagByKey = useMemo(() => {
    const map = new Map<string, MergeTag>();
    for (const tag of tags) {
      map.set(tag.key, tag);
    }
    return map;
  }, [tags]);

  const tagById = useMemo(() => {
    const map = new Map<string, MergeTag>();
    for (const tag of tags) {
      map.set(tag.id, tag);
    }
    return map;
  }, [tags]);

  const addTag = useCallback((params: {
    key: string;
    tagType: MergeTagType;
    label: string;
    defaultValue?: string;
    required?: boolean;
    description?: string;
    format?: string;
  }) => {
    dispatch({
      type: 'ADD_MERGE_TAG',
      key: params.key,
      tagType: params.tagType,
      label: params.label,
      defaultValue: params.defaultValue,
      required: params.required,
      description: params.description,
      format: params.format,
    });
  }, [dispatch]);

  const removeTag = useCallback((tagId: string) => {
    dispatch({
      type: 'REMOVE_MERGE_TAG',
      tagId,
    });
  }, [dispatch]);

  const updateTag = useCallback((tagId: string, changes: {
    key?: string;
    type?: MergeTagType;
    label?: string;
    defaultValue?: string;
    required?: boolean;
    description?: string;
    format?: string;
  }) => {
    dispatch({
      type: 'UPDATE_MERGE_TAG',
      tagId,
      key: changes.key,
      tagType: changes.type,
      label: changes.label,
      defaultValue: changes.defaultValue,
      required: changes.required,
      description: changes.description,
      format: changes.format,
    });
  }, [dispatch]);

  return {tags, tagByKey, tagById, addTag, removeTag, updateTag};
}
