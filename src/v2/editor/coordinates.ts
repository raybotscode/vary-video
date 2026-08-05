/**
 * V2 Editor — coordinate conversion utilities.
 *
 * Converts between:
 * - Screen coordinates (mouse position in pixels)
 * - Normalized coordinates (0-1 in document space)
 * - Canvas coordinates (pixels at canvas resolution)
 *
 * The stage always renders at a fixed aspect ratio but scales
 * to fit its container. All document coordinates are 0-1.
 */

import type {AspectRatio} from '../schema/document';
import {ASPECT_DIMENSIONS} from '../schema/document';

export type StageRect = {
  /** Container width in pixels */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Stage left offset within container (for centering) */
  stageLeft: number;
  /** Stage top offset within container */
  stageTop: number;
  /** Stage width in pixels */
  stageWidth: number;
  /** Stage height in pixels */
  stageHeight: number;
  /** Scale factor (screen px / document unit) */
  scale: number;
};

/**
 * Calculate the stage rectangle within a container for a given aspect ratio.
 * The stage is centered and scaled to fit while maintaining aspect ratio.
 */
export function calculateStageRect(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: AspectRatio,
): StageRect {
  const dims = ASPECT_DIMENSIONS[aspectRatio];
  const aspect = dims.width / dims.height;

  let stageWidth: number;
  let stageHeight: number;

  if (containerWidth / containerHeight > aspect) {
    // Container is wider than stage — fit by height
    stageHeight = containerHeight;
    stageWidth = stageHeight * aspect;
  } else {
    // Container is taller than stage — fit by width
    stageWidth = containerWidth;
    stageHeight = stageWidth / aspect;
  }

  const stageLeft = (containerWidth - stageWidth) / 2;
  const stageTop = (containerHeight - stageHeight) / 2;
  const scale = stageWidth / dims.width;

  return {containerWidth, containerHeight, stageLeft, stageTop, stageWidth, stageHeight, scale};
}

/**
 * Convert screen coordinates (mouse position) to normalized document coordinates (0-1).
 */
export function screenToNormalized(
  screenX: number,
  screenY: number,
  stageRect: StageRect,
): {x: number; y: number} {
  const x = (screenX - stageRect.stageLeft) / stageRect.stageWidth;
  const y = (screenY - stageRect.stageTop) / stageRect.stageHeight;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * Convert normalized document coordinates (0-1) to screen coordinates.
 */
export function normalizedToScreen(
  normX: number,
  normY: number,
  stageRect: StageRect,
): {x: number; y: number} {
  return {
    x: stageRect.stageLeft + normX * stageRect.stageWidth,
    y: stageRect.stageTop + normY * stageRect.stageHeight,
  };
}

/**
 * Convert a normalized size (0-1 of canvas) to screen pixels.
 */
export function normalizedSizeToScreen(
  normWidth: number,
  normHeight: number,
  stageRect: StageRect,
): {width: number; height: number} {
  return {
    width: normWidth * stageRect.stageWidth,
    height: normHeight * stageRect.stageHeight,
  };
}

/**
 * Convert screen pixel delta to normalized delta.
 */
export function screenDeltaToNormalized(
  deltaX: number,
  deltaY: number,
  stageRect: StageRect,
): {dx: number; dy: number} {
  return {
    dx: deltaX / stageRect.stageWidth,
    dy: deltaY / stageRect.stageHeight,
  };
}
