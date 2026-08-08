import {useCallback} from 'react';
import type React from 'react';
import type {Transform, V2Element} from '@vary/v2/schema/document';
import type {EditorCommand} from '../../commands/types';
import type {InteractionState} from '../../stores/editorStore';
import {screenDeltaToNormalized, snapValueToGrid, type StageRect} from '../../utils/coordinates';

interface UseDragOptions {
  elementId: string | null;
  interaction: InteractionState;
  stageRect: StageRect | null;
  startDrag: (elementId: string, pointerX: number, pointerY: number, currentTransform: Transform) => void;
  updateDrag: (pointerX: number, pointerY: number) => void;
  endDrag: () => void;
  dispatch: (command: EditorCommand) => void;
  getElement: (id: string) => V2Element | undefined;
  snapToGrid?: boolean;
  gridSize?: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function useDrag(opts: UseDragOptions): {
  handleDragStart: (e: React.PointerEvent, elementId: string) => void;
  handleDragMove: (e: React.PointerEvent) => void;
  handleDragEnd: (e: React.PointerEvent) => void;
} {
  const {
    interaction,
    stageRect,
    startDrag,
    updateDrag,
    endDrag,
    dispatch,
    getElement,
    snapToGrid = false,
    gridSize = 0.05,
  } = opts;

  const getDragPosition = useCallback((pointerX: number, pointerY: number) => {
    if (!stageRect || interaction.type !== 'dragging' || !interaction.startTransform) return null;

    const {dx, dy} = screenDeltaToNormalized(
      pointerX - interaction.startMouseX,
      pointerY - interaction.startMouseY,
      stageRect,
    );

    let x = interaction.startTransform.x + dx;
    let y = interaction.startTransform.y + dy;

    if (snapToGrid) {
      x = snapValueToGrid(x, gridSize);
      y = snapValueToGrid(y, gridSize);
    }

    return {
      elementId: interaction.elementId,
      x: clamp01(x),
      y: clamp01(y),
    };
  }, [interaction, stageRect, snapToGrid, gridSize]);

  const handleDragStart = useCallback((e: React.PointerEvent, elementId: string) => {
    const element = getElement(elementId);
    if (!element || element.locked) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startDrag(elementId, e.clientX, e.clientY, element.transform);
  }, [getElement, startDrag]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    const position = getDragPosition(e.clientX, e.clientY);
    if (!position?.elementId) return;

    updateDrag(e.clientX, e.clientY);
    dispatch({
      type: 'SET_POSITION',
      elementId: position.elementId,
      x: position.x,
      y: position.y,
      _ephemeral: true,
    });
  }, [dispatch, getDragPosition, updateDrag]);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    const position = getDragPosition(e.clientX, e.clientY);
    if (!position?.elementId) return;

    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }

    dispatch({
      type: 'SET_POSITION',
      elementId: position.elementId,
      x: position.x,
      y: position.y,
    });
    endDrag();
  }, [dispatch, endDrag, getDragPosition]);

  return {handleDragStart, handleDragMove, handleDragEnd};
}
