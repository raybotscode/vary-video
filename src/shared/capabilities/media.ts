/**
 * Canonical media field definitions for per-variant branding.
 *
 * Media fields describe image assets that can vary per row in a batch render:
 * logos, property images, product images, agent/speaker headshots, backgrounds.
 *
 * This module is JSON-safe metadata ONLY — no Remotion renderer imports,
 * no Node-only modules, no browser globals.
 */

import type {CapabilityStatus, ImageTreatment} from './types';

export type MediaFieldKind =
  | 'logo'
  | 'background-image'
  | 'property-image'
  | 'product-image'
  | 'agent-image'
  | 'speaker-image';

export type MediaFieldCapability = {
  id: string;
  kind: MediaFieldKind;
  label: string;
  description: string;
  /** CSV column key used in variant data, e.g. "logo_url" */
  variantKey: string;
  /** Template prop name, e.g. "logoUrl" */
  templateProp: string;
  required: boolean;
  acceptedMimeTypes: string[];
  maxBytes: number;
  defaultTreatment: ImageTreatment;
  status: CapabilityStatus;
};

/**
 * Maps MediaFieldKind to the template prop name used in Remotion compositions.
 * Shared between API, frontend, and renderer to avoid string drift.
 */
export const MEDIA_FIELD_PROP_MAP: Record<MediaFieldKind, string> = {
  'logo': 'logoUrl',
  'background-image': 'backgroundImageUrl',
  'property-image': 'propertyImageUrl',
  'product-image': 'productImageUrl',
  'agent-image': 'agentImageUrl',
  'speaker-image': 'speakerImageUrl',
};

/**
 * Default image treatment — cover at center, no overlays.
 */
export const DEFAULT_IMAGE_TREATMENT: ImageTreatment = {
  fit: 'cover',
  horizontalPosition: 'center',
  verticalPosition: 'center',
};

/**
 * Standard accepted MIME types for image fields.
 */
export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Max file size for remote image validation: 10 MB.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Canonical media field capabilities.
 * Each template references a subset of these by ID in its `mediaFields` array.
 */
export const mediaFieldCapabilities: MediaFieldCapability[] = [
  {
    id: 'logo',
    kind: 'logo',
    label: 'Logo',
    description: 'Brand logo displayed in end frames and overlays.',
    variantKey: 'logo_url',
    templateProp: MEDIA_FIELD_PROP_MAP['logo'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: {
      ...DEFAULT_IMAGE_TREATMENT,
      fit: 'contain',
    },
    status: 'enabled',
  },
  {
    id: 'backgroundImage',
    kind: 'background-image',
    label: 'Background Image',
    description: 'Full-frame background replacing the solid colour.',
    variantKey: 'background_image_url',
    templateProp: MEDIA_FIELD_PROP_MAP['background-image'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: DEFAULT_IMAGE_TREATMENT,
    status: 'enabled',
  },
  {
    id: 'propertyImage',
    kind: 'property-image',
    label: 'Property Image',
    description: 'Primary property photo for real estate templates.',
    variantKey: 'property_image_url',
    templateProp: MEDIA_FIELD_PROP_MAP['property-image'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: DEFAULT_IMAGE_TREATMENT,
    status: 'enabled',
  },
  {
    id: 'productImage',
    kind: 'product-image',
    label: 'Product Image',
    description: 'Primary product visual for launch templates.',
    variantKey: 'product_image_url',
    templateProp: MEDIA_FIELD_PROP_MAP['product-image'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: DEFAULT_IMAGE_TREATMENT,
    status: 'enabled',
  },
  {
    id: 'agentImage',
    kind: 'agent-image',
    label: 'Agent Photo',
    description: 'Real estate agent headshot.',
    variantKey: 'agent_image_url',
    templateProp: MEDIA_FIELD_PROP_MAP['agent-image'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: {
      ...DEFAULT_IMAGE_TREATMENT,
      fit: 'contain',
    },
    status: 'enabled',
  },
  {
    id: 'speakerImage',
    kind: 'speaker-image',
    label: 'Speaker Photo',
    description: 'Host or speaker headshot for webinar/social templates.',
    variantKey: 'speaker_image_url',
    templateProp: MEDIA_FIELD_PROP_MAP['speaker-image'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: {
      ...DEFAULT_IMAGE_TREATMENT,
      fit: 'contain',
    },
    status: 'enabled',
  },
];

/** Lookup a media field capability by ID. */
export const mediaFieldById = (id: string): MediaFieldCapability | undefined =>
  mediaFieldCapabilities.find((field) => field.id === id);

/** Get all enabled media field capabilities. */
export const getEnabledMediaFields = (): MediaFieldCapability[] =>
  mediaFieldCapabilities.filter((field) => field.status === 'enabled');

/**
 * Resolve which media fields apply to a given template.
 * Returns the full capability objects for the template's `mediaFields` IDs.
 */
export const mediaFieldsForTemplate = (templateMediaFieldIds: string[]): MediaFieldCapability[] =>
  templateMediaFieldIds
    .map((id) => mediaFieldById(id))
    .filter((field): field is MediaFieldCapability => field !== undefined && field.status === 'enabled');
