import {useCallback, useEffect, useState} from 'react';
import {apiClient, type TemplateDefinition} from '../api/client';
import {frontendTemplates} from '../utils/templates';
import {
  templateCapabilitiesToFrontend,
} from '../utils/capabilityAdapters';

type CapabilitiesState = {
  /** Resolved template definitions for the UI (from v1, legacy, or local). */
  templates: TemplateDefinition[];
  /** Registry version hash when fetched from v1, otherwise null. */
  capabilityVersion: string | null;
  loading: boolean;
  error: string | null;
};

/**
 * Loads template capabilities with a three-tier fallback:
 *   1. /api/v1/capabilities (canonical, versioned)
 *   2. /api/compositions (legacy)
 *   3. local shared capability metadata (frontendTemplates, always available)
 */
export function useCapabilities(): CapabilitiesState {
  const [state, setState] = useState<CapabilitiesState>({
    templates: frontendTemplates,
    capabilityVersion: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      const registry = await apiClient.getCapabilities();
      setState({
        templates: templateCapabilitiesToFrontend(registry.templates),
        capabilityVersion: registry.version.hash,
        loading: false,
        error: null,
      });
      return;
    } catch {
      // Fall through to legacy.
    }

    try {
      const compositions = await apiClient.getCompositions();
      const merged = compositions.map((composition) => {
        const local =
          frontendTemplates.find((template) => template.id === composition.id) ??
          frontendTemplates[0];
        return {
          ...local,
          ...composition,
          defaults:
            composition.defaults ?? composition.defaultProps ?? local.defaults,
          copyFields: composition.copyFields ?? local.copyFields,
          placeholders: composition.placeholders ?? local.placeholders,
          blockSequence: composition.blockSequence ?? local.blockSequence,
        };
      });
      setState({
        templates: merged,
        capabilityVersion: null,
        loading: false,
        error: null,
      });
      return;
    } catch (apiError) {
      setState({
        templates: frontendTemplates,
        capabilityVersion: null,
        loading: false,
        error:
          apiError instanceof Error
            ? `Could not load API templates: ${apiError.message}`
            : 'Could not load API templates. Using local template metadata.',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return state;
}
