/**
 * V2 Registry — element definitions, animations, and capabilities.
 */

// Element registry
export {
  registerElement,
  getElement,
  getAllElements,
  getElementsByCategory,
  hasElementType,
  type ElementDefinition,
  type PropertyMetadata,
  type PropertyType,
  type PropertyOption,
} from './elements';

// Animation registry
export {
  getAnimationPreset,
  getAllAnimationPresets,
  getAnimationPresetsByDirection,
  getEasing,
  EASINGS,
  type AnimationPresetDefinition,
  type EasingDefinition,
} from './animations';

// Capability service
export {
  getCapabilities,
  getCapabilityVersion,
  invalidateCapabilities,
  type CapabilityOutput,
  type CapabilityElement,
  type CapabilityAnimation,
  type CapabilityEasing,
} from './capabilities';
