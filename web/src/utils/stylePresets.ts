import type {RenderTemplatePayload} from '../api/client';
import type {StylePresetCapability} from '@vary/shared/capabilities/types';

export type StylePresetTemplatePatch = Pick<
  RenderTemplatePayload,
  'brandColor' | 'secondaryColor' | 'accentColor' | 'backgroundColor' | 'backgroundType'
>;

export const stylePresetToTemplatePatch = (
  style: StylePresetCapability,
): StylePresetTemplatePatch => ({
  brandColor: style.colors.primary,
  secondaryColor: style.colors.secondary,
  accentColor: style.colors.accent,
  backgroundColor: style.colors.background,
  backgroundType: style.backgroundTreatment === 'solid' ? 'solid' : 'gradient',
});
