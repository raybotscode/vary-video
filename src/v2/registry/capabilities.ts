/**
 * V2 Capability Service — generates capability JSON for AI, API, and MCP.
 *
 * Single source of truth. No duplicate lists.
 * Every consumer reads from this service.
 */

import {createHash} from 'node:crypto';
import {getAllElements} from './elements';
import {getAllAnimationPresets, EASINGS} from './animations';
import {getEnabledFonts} from './fonts';
import {ASPECT_RATIOS} from '../schema/document';

// ─── Capability Output Types ──────────────────────────────────────

export type CapabilityElement = {
  type: string;
  name: string;
  description: string;
  categories: string[];
  supportsInlineEdit: boolean;
  supportsMergeTags: boolean;
  defaultProps: Record<string, unknown>;
  properties: {
    key: string;
    label: string;
    type: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: {value: string; label: string}[];
    supportsMergeTags?: boolean;
    group?: string;
  }[];
};

export type CapabilityAnimation = {
  id: string;
  name: string;
  description: string;
  direction: 'in' | 'out' | 'both';
  category: string;
};

export type CapabilityEasing = {
  id: string;
  name: string;
  css: string;
};

export type CapabilityFont = {
  id: string;
  family: string;
  category: string;
  weights: number[];
  tags: string[];
};

export type CapabilityOutput = {
  /** Deterministic version hash */
  version: string;
  /** Available element types */
  elements: CapabilityElement[];
  /** Available animation presets */
  animations: CapabilityAnimation[];
  /** Available easing functions */
  easings: CapabilityEasing[];
  /** Available fonts */
  fonts: CapabilityFont[];
  /** Supported aspect ratios */
  aspectRatios: string[];
  /** Platform limits */
  limits: {
    maxScenes: number;
    maxElementsPerScene: number;
    maxDurationFrames: number;
    maxVariants: number;
  };
  /** Generation timestamp */
  generatedAt: string;
};

// ─── Limits ───────────────────────────────────────────────────────

const LIMITS = {
  maxScenes: 20,
  maxElementsPerScene: 50,
  maxDurationFrames: 9000, // 5 minutes at 30fps
  maxVariants: 1000,
};

// ─── Service ──────────────────────────────────────────────────────

let cachedOutput: CapabilityOutput | null = null;
let cachedVersion: string | null = null;

/**
 * Generate the full capability output.
 * Cached until the registry changes.
 */
export function getCapabilities(): CapabilityOutput {
  if (cachedOutput) return cachedOutput;

  const elements = getAllElements().map<CapabilityElement>(def => ({
    type: def.type,
    name: def.name,
    description: def.description,
    categories: def.categories,
    supportsInlineEdit: def.supportsInlineEdit,
    supportsMergeTags: def.supportsMergeTags,
    defaultProps: def.defaultProps as Record<string, unknown>,
    properties: def.properties.map(p => ({
      key: p.key,
      label: p.label,
      type: p.type,
      ...(p.min !== undefined && {min: p.min}),
      ...(p.max !== undefined && {max: p.max}),
      ...(p.step !== undefined && {step: p.step}),
      ...(p.unit && {unit: p.unit}),
      ...(p.options && {options: p.options}),
      ...(p.supportsMergeTags && {supportsMergeTags: true}),
      ...(p.group && {group: p.group}),
    })),
  }));

  const animations = getAllAnimationPresets().map<CapabilityAnimation>(def => ({
    id: def.id,
    name: def.name,
    description: def.description,
    direction: def.direction,
    category: def.category,
  }));

  const easings = EASINGS.map<CapabilityEasing>(e => ({
    id: e.id,
    name: e.name,
    css: e.css,
  }));

  const fonts = getEnabledFonts().map<CapabilityFont>(f => ({
    id: f.id,
    family: f.family,
    category: f.category,
    weights: f.weights,
    tags: f.tags,
  }));

  const output: CapabilityOutput = {
    version: computeVersion(elements, animations, easings, fonts),
    elements,
    animations,
    easings,
    fonts,
    aspectRatios: [...ASPECT_RATIOS],
    limits: LIMITS,
    generatedAt: new Date().toISOString(),
  };

  cachedOutput = output;
  cachedVersion = output.version;
  return output;
}

/**
 * Get just the version hash (lightweight).
 */
export function getCapabilityVersion(): string {
  if (cachedVersion) return cachedVersion;
  return getCapabilities().version;
}

/**
 * Invalidate the cache (call when registry changes).
 */
export function invalidateCapabilities(): void {
  cachedOutput = null;
  cachedVersion = null;
}

/**
 * Compute a deterministic hash of the capability data.
 */
function computeVersion(
  elements: CapabilityElement[],
  animations: CapabilityAnimation[],
  easings: CapabilityEasing[],
  fonts: CapabilityFont[],
): string {
  const data = JSON.stringify({
    elements: elements.map(e => ({type: e.type, props: Object.keys(e.defaultProps)})),
    animations: animations.map(a => a.id),
    easings: easings.map(e => e.id),
    fonts: fonts.map(f => f.id),
    limits: LIMITS,
  });
  return createHash('sha256').update(data).digest('hex').slice(0, 12);
}
