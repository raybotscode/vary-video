/**
 * V2 Editor Coordinate Utilities.
 *
 * Convert between:
 * - Screen coordinates (mouse position in CSS pixels)
 * - Normalized coordinates (0-1 in document space)
 * - Stage pixel coordinates (at design resolution, e.g. 1920×1080)
 */

import type {AspectRatio} from '@vary/v2/schema/document';
import {ASPECT_DIMENSIONS} from '@vary/v2/schema/document';

export interface StageRect {
  containerWidth: number;
  containerHeight: number;
  stageLeft: number;
  stageTop: number;
  stageWidth: number;
  stageHeight: number;
  scale: number;
}

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

/** Convert screen (mouse) coordinates to normalized document coords (0-1). */
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

/** Convert normalized document coords to screen coordinates. */
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

/** Convert normalized size to screen pixels. */
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

/** Convert screen pixel delta to normalized delta. */
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

/** Clamp normalized value to 0-1, optionally allowing slight overshoot. */
export function clampNormalized(value: number, allowOvershoot = false): number {
  const min = allowOvershoot ? -0.1 : 0;
  const max = allowOvershoot ? 1.1 : 1;
  return Math.max(min, Math.min(max, value));
}

/** Snap a normalized value (0-1) to the nearest grid increment. */
export function snapValueToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
