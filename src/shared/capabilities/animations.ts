import type {AnimationPresetCapability} from './types';

/**
 * Animation preset metadata. All presets are enabled — render support
 * exists in `src/compositions/animations/presets.ts`.
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
    parameters: {durationFrames: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['fade', 'entry'],
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    description: 'Fade the scene out to transparent.',
    direction: 'out',
    parameters: {durationFrames: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['fade', 'exit'],
  },
  {
    id: 'slide-in-left',
    name: 'Slide In Left',
    description: 'Slide the scene in from the left edge.',
    direction: 'in',
    supportedPositions: ['left'],
    parameters: {durationFrames: true, intensity: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'slide-in-right',
    name: 'Slide In Right',
    description: 'Slide the scene in from the right edge.',
    direction: 'in',
    supportedPositions: ['right'],
    parameters: {durationFrames: true, intensity: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'slide-in-up',
    name: 'Slide In Up',
    description: 'Slide the scene in from below.',
    direction: 'in',
    supportedPositions: ['up'],
    parameters: {durationFrames: true, intensity: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'slide-in-down',
    name: 'Slide In Down',
    description: 'Slide the scene in from above.',
    direction: 'in',
    supportedPositions: ['down'],
    parameters: {durationFrames: true, intensity: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
    tags: ['slide', 'entry'],
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Scale the scene up from smaller.',
    direction: 'in',
    parameters: {durationFrames: true, intensity: true, easing: true},
    compatibleBlockTypes: ['any'],
    version: '1.0.0',
    status: 'enabled',
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
    status: 'enabled',
    tags: ['bounce', 'entry'],
  },
];

export const animationPresetById = (id: string): AnimationPresetCapability | undefined =>
  animationPresetCapabilities.find((preset) => preset.id === id);

export const getEnabledAnimationPresets = (): AnimationPresetCapability[] =>
  animationPresetCapabilities.filter((preset) => preset.status === 'enabled');
