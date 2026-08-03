/**
 * Canonical media field definitions for per-variant branding.
 *
 * Media fields describe image assets that can vary per row in a batch render:
 * logos, generic images, person photos, backgrounds.
 *
 * This module is JSON-safe metadata ONLY — no Remotion renderer imports,
 * no Node-only modules, no browser globals.
 */

import type {CapabilityStatus, ImageTreatment} from './types';

export type MediaFieldKind =
  | 'logo'
  | 'background-image'
  | 'image1'
  | 'image2'
  | 'person1'
  | 'person2';

export type MediaFieldCapability = {
  id: string;
  kind: MediaFieldKind;
  label: string;
  description: string;
  /** CSV column key used in variant data, e.g. "logo_url" */
  variantKey: string;
  /** Backward-compatible CSV column keys. */
  legacyVariantKeys?: string[];
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
  'image1': 'image1Url',
  'image2': 'image2Url',
  'person1': 'person1Url',
  'person2': 'person2Url',
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
    id: 'image1',
    kind: 'image1',
    label: 'Image 1',
    description: 'Primary image for the template — maps to whatever visual the template needs.',
    variantKey: 'image1_url',
    legacyVariantKeys: ['property_image_url', 'product_image_url'],
    templateProp: MEDIA_FIELD_PROP_MAP['image1'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: DEFAULT_IMAGE_TREATMENT,
    status: 'enabled',
  },
  {
    id: 'image2',
    kind: 'image2',
    label: 'Image 2',
    description: 'Secondary image for the template — maps to whatever supporting visual the template needs.',
    variantKey: 'image2_url',
    legacyVariantKeys: ['product_image_url'],
    templateProp: MEDIA_FIELD_PROP_MAP['image2'],
    required: false,
    acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
    maxBytes: MAX_IMAGE_BYTES,
    defaultTreatment: DEFAULT_IMAGE_TREATMENT,
    status: 'enabled',
  },
  {
    id: 'person1',
    kind: 'person1',
    label: 'Person Photo',
    description: 'Primary person photo for the template.',
    variantKey: 'person1_url',
    legacyVariantKeys: ['agent_image_url'],
    templateProp: MEDIA_FIELD_PROP_MAP['person1'],
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
    id: 'person2',
    kind: 'person2',
    label: 'Person Photo',
    description: 'Secondary person photo for webinar, social, or presenter templates.',
    variantKey: 'person2_url',
    legacyVariantKeys: ['speaker_image_url'],
    templateProp: MEDIA_FIELD_PROP_MAP['person2'],
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
