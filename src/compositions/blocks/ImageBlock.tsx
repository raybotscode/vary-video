/**
 * ImageBlock — generic image scene block renderer.
 *
 * Renders an image with configurable treatment (cover/contain/fit,
 * focal point, overlays, blur). Used by the media-image block
 * in SceneBlockPlayer.
 */

import React from 'react';
import {ResponsiveImage} from '../media/ResponsiveImage';
import type {BlockRenderProps} from './registry';

/**
 * ImageBlock renders a full-frame image with treatment controls.
 *
 * Content fields:
 * - imageUrl: image URL or placeholder
 * - altText: accessibility text
 *
 * Treatment comes from the block-level imageTreatment prop.
 */
export const ImageBlock: React.FC<BlockRenderProps> = ({
  content,
  brand,
  imageTreatment,
  width,
  height,
}) => {
  return (
    <ResponsiveImage
      src={content.imageUrl ?? ''}
      alt={content.altText ?? ''}
      treatment={imageTreatment}
      width={width}
      height={height}
      fallbackColor={brand.backgroundColor || '#F7FAFC'}
    />
  );
};
