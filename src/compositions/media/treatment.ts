/**
 * Pure helpers for image treatment — no React, no Remotion.
 * Converts treatment config into stable CSS properties.
 */

import type {ImageTreatment, ImageFitMode, ImageHorizontalPosition, ImageVerticalPosition} from '../../shared/capabilities/types';

/**
 * Map ImageFitMode to CSS object-fit value.
 */
export const toObjectFit = (fit: ImageFitMode): string => {
  switch (fit) {
    case 'cover': return 'cover';
    case 'contain': return 'contain';
    case 'fit-width': return 'none';
    case 'fit-height': return 'none';
    default: return 'cover';
  }
};

/**
 * Map horizontal/vertical position to CSS object-position.
 */
export const toObjectPosition = (
  horizontal: ImageHorizontalPosition = 'center',
  vertical: ImageVerticalPosition = 'center',
): string => {
  const hMap: Record<ImageHorizontalPosition, string> = {
    left: '0%',
    center: '50%',
    right: '100%',
  };
  const vMap: Record<ImageVerticalPosition, string> = {
    top: '0%',
    center: '50%',
    bottom: '100%',
  };
  return `${hMap[horizontal]} ${vMap[vertical]}`;
};

/**
 * Build CSS styles for an image based on its treatment config.
 * Returns a React CSSProperties-compatible object.
 */
export const buildImageStyles = (
  treatment: ImageTreatment,
  containerWidth: number,
  containerHeight: number,
): React.CSSProperties => {
  const styles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: toObjectFit(treatment.fit) as React.CSSProperties['objectFit'],
    objectPosition: toObjectPosition(
      treatment.horizontalPosition,
      treatment.verticalPosition,
    ),
  };

  // For fit-width/fit-height, we need explicit sizing
  if (treatment.fit === 'fit-width') {
    styles.width = '100%';
    styles.height = 'auto';
    styles.objectFit = 'cover';
  } else if (treatment.fit === 'fit-height') {
    styles.width = 'auto';
    styles.height = '100%';
    styles.objectFit = 'cover';
  }

  // Focal point overrides object-position
  if (treatment.focalPoint) {
    styles.objectPosition = `${treatment.focalPoint.x * 100}% ${treatment.focalPoint.y * 100}%`;
  }

  return styles;
};

/**
 * Build CSS for overlay effects (dark overlay, blur, gradient).
 * Returns a style object for a positioned overlay div.
 */
export const buildOverlayStyles = (
  treatment: ImageTreatment,
): React.CSSProperties => {
  const styles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  };

  // Dark overlay
  if (treatment.darkOverlay && treatment.darkOverlay > 0) {
    styles.backgroundColor = `rgba(0, 0, 0, ${treatment.darkOverlay})`;
  }

  // Gradient overlay
  if (treatment.gradientOverlay?.enabled) {
    const {from, to, direction, opacity} = treatment.gradientOverlay;
    const dirMap = {
      'to-top': 'to top',
      'to-bottom': 'to bottom',
      'to-left': 'to left',
      'to-right': 'to right',
    };
    styles.background = `linear-gradient(${dirMap[direction]}, ${from}, ${to})`;
    styles.opacity = opacity;
  }

  return styles;
};

/**
 * Build CSS for blur effect on the image itself.
 */
export const buildBlurFilter = (treatment: ImageTreatment): string | undefined => {
  if (treatment.blur && treatment.blur > 0) {
    return `blur(${treatment.blur}px)`;
  }
  return undefined;
};

/**
 * Default fallback style when no image is provided.
 * Shows a subtle placeholder with the container's background color.
 */
export const buildFallbackStyles = (
  backgroundColor: string = '#E2E8F0',
): React.CSSProperties => ({
  width: '100%',
  height: '100%',
  backgroundColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
