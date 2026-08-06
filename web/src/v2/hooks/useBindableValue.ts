/**
 * useBindableValue — hook for working with a single BindableValue<T>.
 *
 * Given a BindableValue (literal or tag reference) and the list of merge tags,
 * returns computed display values and resolution helpers.
 */

import {useMemo} from 'react';
import type {MergeTag} from '@vary/v2/schema/document';
import type {BindableValue} from '@vary/v2/schema/bindable';
import {isTagBinding, getBindableDisplayValue, resolveBindableValue} from '@vary/v2/schema/bindable';

export interface UseBindableValueResult<T = unknown> {
  /** The raw BindableValue. */
  binding: BindableValue<T>;
  /** Whether this value is bound to a tag. */
  isTagBound: boolean;
  /** The tagId if bound, null otherwise. */
  boundTagId: string | null;
  /** The MergeTag if bound, null otherwise. */
  boundTag: MergeTag | null;
  /** Human-readable display value (e.g., "{{headline}}" or literal). */
  displayValue: string;
  /** Resolve against tag values (from mergeDataStore). */
  resolve: (tagValues: Record<string, unknown>, fallback?: T) => T | undefined;
}

/**
 * Hook for inspecting a single BindableValue in relation to available merge tags.
 */
export function useBindableValue<T = unknown>(
  bv: BindableValue<T>,
  tags: MergeTag[],
): UseBindableValueResult<T> {
  return useMemo(() => {
    const bound = isTagBinding(bv);
    const boundTag = bound ? (tags.find((t) => t.id === bv.tagId) ?? null) : null;

    return {
      binding: bv,
      isTagBound: bound,
      boundTagId: bound ? bv.tagId : null,
      boundTag,
      displayValue: getBindableDisplayValue(bv, tags),
      resolve: (tagValues: Record<string, unknown>, fallback?: T) =>
        resolveBindableValue(bv, tagValues, fallback),
    };
  }, [bv, tags]);
}
