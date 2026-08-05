/**
 * V2 Element Registry — the single source of truth for element types.
 *
 * Each element type registers:
 * - type ID (text, image, shape)
 * - Zod schema for its props
 * - Default props
 * - Display name and icon
 * - Property metadata (for the editor's properties panel)
 *
 * The registry is shared between:
 * - The DOM editor (for rendering editor elements)
 * - The Remotion renderer (for rendering final video)
 * - The API (for capability discovery)
 * - The AI (for template generation)
 */

import type {TextProps, ImageProps, ShapeProps} from '../schema/document';

// ─── Property Metadata ────────────────────────────────────────────

export type PropertyType =
  | 'text'
  | 'number'
  | 'color'
  | 'select'
  | 'boolean'
  | 'slider'
  | 'image';

export type PropertyOption = {
  value: string;
  label: string;
};

export type PropertyMetadata = {
  /** Property key (matches schema field) */
  key: string;
  /** Display label */
  label: string;
  /** Property type (determines UI control) */
  type: PropertyType;
  /** For select type: available options */
  options?: PropertyOption[];
  /** For number/slider: minimum value */
  min?: number;
  /** For number/slider: maximum value */
  max?: number;
  /** For slider: step value */
  step?: number;
  /** Unit label (px, %, deg, etc.) */
  unit?: string;
  /** Whether this property supports merge tags */
  supportsMergeTags?: boolean;
  /** Group name for the properties panel */
  group?: string;
  /** Whether this property is advanced (hidden by default) */
  advanced?: boolean;
};

// ─── Element Definition ───────────────────────────────────────────

// ─── Element Type ID ──────────────────────────────────────────────

export type ElementTypeId = 'text' | 'image' | 'shape';

export interface ElementDefinition<T extends ElementTypeId = ElementTypeId> {
  /** Unique type ID */
  type: T;
  /** Display name */
  name: string;
  /** Icon identifier (for toolbar/layers) */
  icon: string;
  /** Description */
  description: string;
  /** Default props when creating a new element */
  defaultProps: T extends 'text' ? TextProps : T extends 'image' ? ImageProps : ShapeProps;
  /** Property metadata for the properties panel */
  properties: PropertyMetadata[];
  /** Whether this element type supports inline text editing */
  supportsInlineEdit: boolean;
  /** Whether this element type supports merge tags in content */
  supportsMergeTags: boolean;
  /** Categories this element belongs to */
  categories: string[];
}

// ─── Registry ─────────────────────────────────────────────────────

const registry = new Map<ElementTypeId, ElementDefinition>();

/** Register an element type definition. */
export function registerElement(definition: ElementDefinition): void {
  registry.set(definition.type, definition);
}

/** Get an element definition by type ID. */
export function getElement(type: ElementTypeId): ElementDefinition {
  const def = registry.get(type);
  if (!def) {
    throw new Error(`Unknown element type: ${type}`);
  }
  return def;
}

/** Get all registered element definitions. */
export function getAllElements(): ElementDefinition[] {
  return Array.from(registry.values());
}

/** Get element types matching a category. */
export function getElementsByCategory(category: string): ElementDefinition[] {
  return Array.from(registry.values()).filter(e => e.categories.includes(category));
}

/** Check if an element type is registered. */
export function hasElementTypeId(type: string): type is ElementTypeId {
  return registry.has(type as ElementTypeId);
}

// ─── Built-in Element Definitions ─────────────────────────────────

registerElement({
  type: 'text',
  name: 'Text',
  icon: 'T',
  description: 'Text content with font styling',
  defaultProps: {
    content: '{{headline}}',
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: 700,
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: 0,
    color: '#1A365D',
    textAlign: 'center',
    verticalAlign: 'middle',
    textTransform: 'none',
    maxLines: null,
    backgroundColor: null,
    padding: 0,
    borderRadius: 0,
  },
  properties: [
    {key: 'content', label: 'Content', type: 'text', supportsMergeTags: true, group: 'Content'},
    {key: 'fontFamily', label: 'Font', type: 'select', group: 'Typography',
      options: [
        {value: 'Inter', label: 'Inter'},
        {value: 'Arial', label: 'Arial'},
        {value: 'Georgia', label: 'Georgia'},
        {value: 'Montserrat', label: 'Montserrat'},
        {value: 'Roboto', label: 'Roboto'},
      ]},
    {key: 'fontSize', label: 'Size', type: 'slider', min: 8, max: 400, step: 1, unit: 'px', group: 'Typography'},
    {key: 'fontWeight', label: 'Weight', type: 'select', group: 'Typography',
      options: [
        {value: '400', label: 'Regular'},
        {value: '600', label: 'Semi Bold'},
        {value: '700', label: 'Bold'},
        {value: '800', label: 'Extra Bold'},
        {value: '900', label: 'Black'},
      ]},
    {key: 'fontStyle', label: 'Style', type: 'select', group: 'Typography',
      options: [{value: 'normal', label: 'Normal'}, {value: 'italic', label: 'Italic'}]},
    {key: 'lineHeight', label: 'Line Height', type: 'slider', min: 0.5, max: 3, step: 0.1, group: 'Typography'},
    {key: 'letterSpacing', label: 'Letter Spacing', type: 'slider', min: -10, max: 20, step: 0.5, unit: 'px', group: 'Typography'},
    {key: 'color', label: 'Color', type: 'color', group: 'Appearance', supportsMergeTags: true},
    {key: 'textAlign', label: 'Align', type: 'select', group: 'Typography',
      options: [{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]},
    {key: 'textTransform', label: 'Transform', type: 'select', group: 'Typography',
      options: [
        {value: 'none', label: 'None'},
        {value: 'uppercase', label: 'UPPERCASE'},
        {value: 'lowercase', label: 'lowercase'},
        {value: 'capitalize', label: 'Capitalize'},
      ]},
    {key: 'backgroundColor', label: 'Background', type: 'color', group: 'Appearance', advanced: true},
    {key: 'padding', label: 'Padding', type: 'slider', min: 0, max: 200, step: 1, unit: 'px', group: 'Appearance', advanced: true},
    {key: 'borderRadius', label: 'Radius', type: 'slider', min: 0, max: 200, step: 1, unit: 'px', group: 'Appearance', advanced: true},
  ],
  supportsInlineEdit: true,
  supportsMergeTags: true,
  categories: ['basic', 'content'],
});

registerElement({
  type: 'image',
  name: 'Image',
  icon: '🖼',
  description: 'Image with fit, crop, and overlay options',
  defaultProps: {
    src: '{{imageUrl}}',
    fit: 'cover',
    objectPositionX: 0.5,
    objectPositionY: 0.5,
    borderRadius: 0,
    overlayColor: null,
    overlayOpacity: 0,
    blur: 0,
    shadow: false,
  },
  properties: [
    {key: 'src', label: 'Image', type: 'image', supportsMergeTags: true, group: 'Content'},
    {key: 'fit', label: 'Fit', type: 'select', group: 'Layout',
      options: [{value: 'cover', label: 'Cover'}, {value: 'contain', label: 'Contain'}, {value: 'fill', label: 'Fill'}]},
    {key: 'objectPositionX', label: 'Position X', type: 'slider', min: 0, max: 1, step: 0.01, group: 'Layout'},
    {key: 'objectPositionY', label: 'Position Y', type: 'slider', min: 0, max: 1, step: 0.01, group: 'Layout'},
    {key: 'borderRadius', label: 'Radius', type: 'slider', min: 0, max: 200, step: 1, unit: 'px', group: 'Appearance'},
    {key: 'overlayColor', label: 'Overlay', type: 'color', group: 'Appearance', advanced: true},
    {key: 'overlayOpacity', label: 'Overlay Opacity', type: 'slider', min: 0, max: 1, step: 0.05, group: 'Appearance', advanced: true},
    {key: 'blur', label: 'Blur', type: 'slider', min: 0, max: 50, step: 1, unit: 'px', group: 'Appearance', advanced: true},
    {key: 'shadow', label: 'Shadow', type: 'boolean', group: 'Appearance', advanced: true},
  ],
  supportsInlineEdit: false,
  supportsMergeTags: true,
  categories: ['basic', 'media'],
});

registerElement({
  type: 'shape',
  name: 'Shape',
  icon: '◻',
  description: 'Rectangle, circle, or line shape',
  defaultProps: {
    shapeType: 'rectangle',
    fill: '#3182CE',
    stroke: null,
    strokeWidth: 0,
    borderRadius: 0,
  },
  properties: [
    {key: 'shapeType', label: 'Shape', type: 'select', group: 'Shape',
      options: [{value: 'rectangle', label: 'Rectangle'}, {value: 'circle', label: 'Circle'}, {value: 'line', label: 'Line'}]},
    {key: 'fill', label: 'Fill', type: 'color', group: 'Appearance', supportsMergeTags: true},
    {key: 'stroke', label: 'Stroke', type: 'color', group: 'Appearance', advanced: true},
    {key: 'strokeWidth', label: 'Stroke Width', type: 'slider', min: 0, max: 50, step: 1, unit: 'px', group: 'Appearance', advanced: true},
    {key: 'borderRadius', label: 'Radius', type: 'slider', min: 0, max: 500, step: 1, unit: 'px', group: 'Appearance'},
  ],
  supportsInlineEdit: false,
  supportsMergeTags: true,
  categories: ['basic', 'decoration'],
});
