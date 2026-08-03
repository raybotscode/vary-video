import type {AnimationPresetCapability} from './types';

/**
 * Animation preset metadata. METADATA ONLY in Phase 2 — no render behavior
 * exists yet. `none` is enabled; all others are disabled until Phase 4
 * implements the actual Remotion animation functions.
 *
 * The API exposes these so AI/UI knows what's planned, but disabled presets
 * are excluded from the compact AI summary and must not appear as selectable
 * controls until render support lands.
 */
export const animationPresetCapabilities: AnimationPresetCapability[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No animation — static scene.',
    direction: undefined,
    parameters: {},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['static', 'default'],
  },
  {
    id: 'fade-in',
    name: 'Fade In',
    description: 'Fade the scene in from transparent.',
    direction: 'in',
    parameters: {durationFrames: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['fade', 'entry'],
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    description: 'Fade the scene out to transparent.',
    direction: 'out',
    parameters: {durationFrames: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['fade', 'exit'],
  },
  {
    id: 'slide-in-left',
    name: 'Slide In Left',
    description: 'Slide the scene in from the left edge.',
    direction: 'in',
    supportedPositions: ['left'],
    parameters: {durationFrames: true, intensity: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'slide-in-right',
    name: 'Slide In Right',
    description: 'Slide the scene in from the right edge.',
    direction: 'in',
    supportedPositions: ['right'],
    parameters: {durationFrames: true, intensity: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'slide-in-up',
    name: 'Slide In Up',
    description: 'Slide the scene in from below.',
    direction: 'in',
    supportedPositions: ['up'],
    parameters: {durationFrames: true, intensity: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'slide-in-down',
    name: 'Slide In Down',
    description: 'Slide the scene in from above.',
    direction: 'in',
    supportedPositions: ['down'],
    parameters: {durationFrames: true, intensity: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Scale the scene up from smaller.',
    direction: 'in',
    parameters: {durationFrames: true, intensity: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['zoom', 'entry'],
  },
  {
    id: 'bounce-in',
    name: 'Bounce In',
    description: 'Bounce the scene in with an overshoot.',
    direction: 'in',
    parameters: {durationFrames: true, intensity: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'disabled',
    tags: ['bounce', 'entry'],
  },
];

export const animationPresetById = (id: string): AnimationPresetCapability | undefined =>
  animationPresetCapabilities.find((preset) => preset.id === id);

export const getEnabledAnimationPresets = (): AnimationPresetCapability[] =>
  animationPresetCapabilities.filter((preset) => preset.status === 'enabled');
