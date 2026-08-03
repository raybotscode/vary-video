/**
 * ResponsiveImage — shared image renderer for Remotion compositions.
 *
 * Handles cover/contain/fit modes, focal point, overlays, blur, and
 * safe visual fallback when the image URL is missing.
 *
 * Used by ImageBlock, template scenes, background images, and logos.
 */

import React from 'react';
import {Img, staticFile} from 'remotion';
import type {ImageTreatment} from '../../shared/capabilities/types';
import {
  buildImageStyles,
  buildOverlayStyles,
  buildBlurFilter,
  buildFallbackStyles,
} from './treatment';

export type ResponsiveImageProps = {
  /** Image URL — can be remote (https://) or a placeholder token. */
  src: string;
  /** Alt text for accessibility. */
  alt?: string;
  /** Image treatment configuration. */
  treatment?: ImageTreatment;
  /** Container width in pixels. */
  width: number;
  /** Container height in pixels. */
  height: number;
  /** Background color for the fallback state. */
  fallbackColor?: string;
  /** Additional CSS styles for the container. */
  style?: React.CSSProperties;
  /** Additional CSS class for the container. */
  className?: string;
};

const DEFAULT_TREATMENT: ImageTreatment = {
  fit: 'cover',
  horizontalPosition: 'center',
  verticalPosition: 'center',
};

/**
 * ResponsiveImage renders an image with treatment controls.
 *
 * If `src` is empty or a placeholder token (e.g. `{{property_image_url}}`),
 * shows a fallback placeholder instead.
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt = '',
  treatment = DEFAULT_TREATMENT,
  width,
  height,
  fallbackColor = '#E2E8F0',
  style,
  className,
}) => {
  // Check if src is empty or an unresolved placeholder
  const isPlaceholder = !src || src.startsWith('{{') || src === '';

  if (isPlaceholder) {
    return (
      <div
        style={{
          ...buildFallbackStyles(fallbackColor),
          ...style,
        }}
        className={className}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  const imageStyles = buildImageStyles(treatment, width, height);
  const blurFilter = buildBlurFilter(treatment);
  const overlayStyles = buildOverlayStyles(treatment);
  const hasOverlay =
    (treatment.darkOverlay && treatment.darkOverlay > 0) ||
    treatment.gradientOverlay?.enabled;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      <Img
        src={src}
        alt={alt}
        style={{
          ...imageStyles,
          filter: blurFilter,
        }}
      />
      {hasOverlay && <div style={overlayStyles} />}
    </div>
  );
};
