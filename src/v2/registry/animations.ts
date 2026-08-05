/**
 * V2 Animation Registry — animation presets and easing functions.
 *
 * Shared between editor (preview) and renderer (final output).
 */

import type {AnimationPreset, Easing} from '../schema/document';

// ─── Animation Preset Definition ──────────────────────────────────

export type AnimationPresetDefinition = {
  /** Preset ID (matches schema) */
  id: AnimationPreset;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Whether this is an entrance or exit animation (or both) */
  direction: 'in' | 'out' | 'both';
  /** Category for grouping */
  category: 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';
  /** CSS transform/opacity keyframes for editor preview */
  cssKeyframes: {
    from: Record<string, string>;
    to: Record<string, string>;
  };
};

// ─── Easing Definitions ───────────────────────────────────────────

export type EasingDefinition = {
  id: Easing;
  name: string;
  /** CSS cubic-bezier or keyword */
  css: string;
};

export const EASINGS: EasingDefinition[] = [
  {id: 'linear', name: 'Linear', css: 'linear'},
  {id: 'ease-in', name: 'Ease In', css: 'cubic-bezier(0.4, 0, 1, 1)'},
  {id: 'ease-out', name: 'Ease Out', css: 'cubic-bezier(0, 0, 0.2, 1)'},
  {id: 'ease-in-out', name: 'Ease In Out', css: 'cubic-bezier(0.4, 0, 0.2, 1)'},
  {id: 'ease-in-back', name: 'Ease In Back', css: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)'},
  {id: 'ease-out-back', name: 'Ease Out Back', css: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'},
  {id: 'ease-in-elastic', name: 'Ease In Elastic', css: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)'},
  {id: 'ease-out-elastic', name: 'Ease Out Elastic', css: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'},
  {id: 'bounce', name: 'Bounce', css: 'cubic-bezier(0.34, 1.56, 0.64, 1)'},
];

// ─── Preset Registry ──────────────────────────────────────────────

const presets = new Map<AnimationPreset, AnimationPresetDefinition>();

function registerPreset(def: AnimationPresetDefinition): void {
  presets.set(def.id, def);
}

export function getAnimationPreset(id: AnimationPreset): AnimationPresetDefinition | undefined {
  return presets.get(id);
}

export function getAllAnimationPresets(): AnimationPresetDefinition[] {
  return Array.from(presets.values());
}

export function getAnimationPresetsByDirection(direction: 'in' | 'out'): AnimationPresetDefinition[] {
  return Array.from(presets.values()).filter(p => p.direction === direction || p.direction === 'both');
}

export function getEasing(id: Easing): EasingDefinition {
  const found = EASINGS.find(e => e.id === id);
  return found ?? EASINGS[0]; // fallback to linear
}

// ─── Built-in Presets ─────────────────────────────────────────────

registerPreset({
  id: 'none',
  name: 'None',
  description: 'No animation',
  direction: 'both',
  category: 'fade',
  cssKeyframes: {from: {}, to: {}},
});

registerPreset({
  id: 'fade-in',
  name: 'Fade In',
  description: 'Opacity 0 → 1',
  direction: 'in',
  category: 'fade',
  cssKeyframes: {from: {opacity: '0'}, to: {opacity: '1'}},
});

registerPreset({
  id: 'fade-out',
  name: 'Fade Out',
  description: 'Opacity 1 → 0',
  direction: 'out',
  category: 'fade',
  cssKeyframes: {from: {opacity: '1'}, to: {opacity: '0'}},
});

registerPreset({
  id: 'slide-left',
  name: 'Slide Left',
  description: 'Slide in from right',
  direction: 'in',
  category: 'slide',
  cssKeyframes: {from: {transform: 'translateX(100%)'}, to: {transform: 'translateX(0)'}},
});

registerPreset({
  id: 'slide-right',
  name: 'Slide Right',
  description: 'Slide in from left',
  direction: 'in',
  category: 'slide',
  cssKeyframes: {from: {transform: 'translateX(-100%)'}, to: {transform: 'translateX(0)'}},
});

registerPreset({
  id: 'slide-up',
  name: 'Slide Up',
  description: 'Slide in from below',
  direction: 'in',
  category: 'slide',
  cssKeyframes: {from: {transform: 'translateY(100%)'}, to: {transform: 'translateY(0)'}},
});

registerPreset({
  id: 'slide-down',
  name: 'Slide Down',
  description: 'Slide in from above',
  direction: 'in',
  category: 'slide',
  cssKeyframes: {from: {transform: 'translateY(-100%)'}, to: {transform: 'translateY(0)'}},
});

registerPreset({
  id: 'scale-in',
  name: 'Scale In',
  description: 'Scale from 0 to 1',
  direction: 'in',
  category: 'scale',
  cssKeyframes: {from: {transform: 'scale(0)'}, to: {transform: 'scale(1)'}},
});

registerPreset({
  id: 'scale-out',
  name: 'Scale Out',
  description: 'Scale from 1 to 0',
  direction: 'out',
  category: 'scale',
  cssKeyframes: {from: {transform: 'scale(1)'}, to: {transform: 'scale(0)'}},
});

registerPreset({
  id: 'zoom-in',
  name: 'Zoom In',
  description: 'Scale from 0.5 to 1 with fade',
  direction: 'in',
  category: 'scale',
  cssKeyframes: {from: {transform: 'scale(0.5)', opacity: '0'}, to: {transform: 'scale(1)', opacity: '1'}},
});

registerPreset({
  id: 'zoom-out',
  name: 'Zoom Out',
  description: 'Scale from 1 to 1.5 with fade',
  direction: 'out',
  category: 'scale',
  cssKeyframes: {from: {transform: 'scale(1)', opacity: '1'}, to: {transform: 'scale(1.5)', opacity: '0'}},
});

registerPreset({
  id: 'bounce-in',
  name: 'Bounce In',
  description: 'Bounce in from below',
  direction: 'in',
  category: 'bounce',
  cssKeyframes: {from: {transform: 'translateY(100%) scale(0.8)'}, to: {transform: 'translateY(0) scale(1)'}},
});

registerPreset({
  id: 'rotate-in',
  name: 'Rotate In',
  description: 'Rotate in with fade',
  direction: 'in',
  category: 'rotate',
  cssKeyframes: {from: {transform: 'rotate(-180deg) scale(0)', opacity: '0'}, to: {transform: 'rotate(0) scale(1)', opacity: '1'}},
});
