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
};

export function useDebouncedPreview({
  template,
  compositionId,
  variant,
  enabled = true,
  debounceMs = 500,
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
      });

      if (controller.signal.aborted) return;

      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;

      setState({imageUrl: url, loading: false, error: null});
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({
        imageUrl: prevUrlRef.current,
        loading: false,
        error: err instanceof Error ? err.message : 'Preview failed',
      });
    }
  }, [template, compositionId, variant, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(refresh, debounceMs);
    return () => clearTimeout(timer);
  }, [refresh, debounceMs, enabled]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  return {...state, refresh};
}
