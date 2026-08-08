import {useCallback} from 'react';
import type React from 'react';
import type {Transform, V2Element} from '@vary/v2/schema/document';
import type {EditorCommand} from '../../commands/types';
import type {InteractionState, ResizeHandle} from '../../stores/editorStore';
import {screenDeltaToNormalized, snapValueToGrid, type StageRect} from '../../utils/coordinates';

interface UseResizeOptions {
  elementId: string | null;
  interaction: InteractionState;
  stageRect: StageRect | null;
  startResize: (
    elementId: string,
    handle: ResizeHandle,
    pointerX: number,
    pointerY: number,
    currentTransform: Transform,
  ) => void;
  updateResize: (pointerX: number, pointerY: number) => void;
  endResize: () => void;
  dispatch: (command: EditorCommand) => void;
  getElement: (id: string) => V2Element | undefined;
  snapToGrid?: boolean;
  gridSize?: number;
}

const MIN_SIZE = 0.02;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function calculateResize(
  interaction: InteractionState,
  stageRect: StageRect | null,
  pointerX: number,
  pointerY: number,
) {
  if (
    !stageRect ||
    interaction.type !== 'resizing' ||
    !interaction.elementId ||
    !interaction.handle ||
    !interaction.startTransform
  ) {
    return null;
  }

  const {dx, dy} = screenDeltaToNormalized(
    pointerX - interaction.startMouseX,
    pointerY - interaction.startMouseY,
    stageRect,
  );

  const startT = interaction.startTransform;
  const handle = interaction.handle;
  let x = startT.x;
  let y = startT.y;
  let width = startT.width ?? 0.3;
  let height = startT.height ?? 0.15;

  if (handle.includes('r')) {
    width = startT.width ?? width;
    width = Math.max(MIN_SIZE, width + dx);
  }
  if (handle.includes('l')) {
    const startWidth = startT.width ?? width;
    width = Math.max(MIN_SIZE, startWidth - dx);
    x = startT.x + dx;
  }
  if (handle.includes('b')) {
    height = startT.height ?? height;
    height = Math.max(MIN_SIZE, height + dy);
  }
  if (handle.includes('t')) {
    const startHeight = startT.height ?? height;
    height = Math.max(MIN_SIZE, startHeight - dy);
    y = startT.y + dy;
  }

  return {
    elementId: interaction.elementId,
    x: clamp01(x),
    y: clamp01(y),
    width: clamp01(width),
    height: clamp01(height),
  };
}

export function useResize(opts: UseResizeOptions): {
  handleResizeStart: (e: React.PointerEvent, elementId: string, handle: ResizeHandle) => void;
  handleResizeMove: (e: React.PointerEvent) => void;
  handleResizeEnd: (e: React.PointerEvent) => void;
} {
  const {
    interaction,
    stageRect,
    startResize,
    updateResize,
    endResize,
    dispatch,
    getElement,
    snapToGrid = false,
    gridSize = 0.05,
  } = opts;

  const applySnap = useCallback((next: {elementId: string; x: number; y: number; width: number; height: number}) => {
    if (!snapToGrid) return next;
    return {
      ...next,
      x: snapValueToGrid(next.x, gridSize),
      y: snapValueToGrid(next.y, gridSize),
      width: snapValueToGrid(next.width, gridSize),
      height: snapValueToGrid(next.height, gridSize),
    };
  }, [snapToGrid, gridSize]);

  const handleResizeStart = useCallback((
    e: React.PointerEvent,
    elementId: string,
    handle: ResizeHandle,
  ) => {
    const element = getElement(elementId);
    if (!element || element.locked) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startResize(elementId, handle, e.clientX, e.clientY, element.transform);
  }, [getElement, startResize]);

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    const next = calculateResize(interaction, stageRect, e.clientX, e.clientY);
    if (!next) return;

    const snapped = applySnap(next);
    updateResize(e.clientX, e.clientY);
    dispatch({
      type: 'SET_POSITION',
      elementId: snapped.elementId,
      x: snapped.x,
      y: snapped.y,
      _ephemeral: true,
    });
    dispatch({
      type: 'SET_SIZE',
      elementId: snapped.elementId,
      width: snapped.width,
      height: snapped.height,
      _ephemeral: true,
    });
  }, [dispatch, interaction, stageRect, updateResize, applySnap]);

  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    const next = calculateResize(interaction, stageRect, e.clientX, e.clientY);
    if (!next) return;

    const snapped = applySnap(next);

    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }

    dispatch({
      type: 'SET_POSITION',
      elementId: snapped.elementId,
      x: snapped.x,
      y: snapped.y,
    });
    dispatch({
      type: 'SET_SIZE',
      elementId: snapped.elementId,
      width: snapped.width,
      height: snapped.height,
    });
    endResize();
  }, [dispatch, endResize, interaction, stageRect, applySnap]);

  return {handleResizeStart, handleResizeMove, handleResizeEnd};
}
