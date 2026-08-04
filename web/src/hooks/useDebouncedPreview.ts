import {useCallback, useEffect, useRef, useState} from 'react';
import {apiClient} from '../api/client';
import type {RenderTemplatePayload} from '../api/client';

type PreviewState = {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
};

type UseDebouncedPreviewOptions = {
  template: RenderTemplatePayload;
  compositionId?: string;
  variant?: Record<string, string>;
  enabled?: boolean;
  debounceMs?: number;
  scale?: 'full' | 'medium' | 'fast';
};

export function useDebouncedPreview({
  template,
  compositionId,
  variant,
  enabled = true,
  debounceMs = 500,
  scale = 'medium',
}: UseDebouncedPreviewOptions) {
  const [state, setState] = useState<PreviewState>({
    imageUrl: null,
    loading: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({...s, loading: true, error: null}));

    try {
      const blob = await apiClient.previewRender({
        template,
        compositionId,
        variant,
        scale,
      });

      if (controller.signal.aborted) return;

      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;

      setState({imageUrl: url, loading: false, error: null});
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Preview failed';
      setState({
        imageUrl: prevUrlRef.current,
        loading: false,
        error: message,
      });
    }
  }, [template, compositionId, variant, enabled, scale]);

  // Debounced auto-preview
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(refresh, debounceMs);
    return () => clearTimeout(timer);
  }, [refresh, enabled, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  return {...state, refresh};
}
