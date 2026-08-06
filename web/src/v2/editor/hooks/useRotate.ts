import {useCallback} from 'react';
import type React from 'react';
import type {Transform, V2Element} from '@vary/v2/schema/document';
import type {EditorCommand} from '../../commands/types';
import type {InteractionState} from '../../stores/editorStore';
import type {StageRect} from '../../utils/coordinates';

interface UseRotateOptions {
  elementId: string | null;
  interaction: InteractionState;
  stageRect: StageRect | null;
  startRotate: (elementId: string, pointerX: number, pointerY: number, currentTransform: Transform) => void;
  updateRotate: (pointerX: number, pointerY: number) => void;
  endRotate: () => void;
  dispatch: (command: EditorCommand) => void;
  getElement: (id: string) => V2Element | undefined;
}

function normalizeDeltaDegrees(degrees: number): number {
  let normalized = degrees;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function normalizeRotation(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function calculateRotation(
  interaction: InteractionState,
  stageEl: HTMLElement,
  pointerX: number,
  pointerY: number,
  snapToFifteen: boolean,
) {
  if (
    interaction.type !== 'rotating' ||
    !interaction.elementId ||
    !interaction.startTransform
  ) {
    return null;
  }

  const startT = interaction.startTransform;
  const rect = stageEl.getBoundingClientRect();
  const centerX = rect.left + startT.x * rect.width;
  const centerY = rect.top + startT.y * rect.height;
  const startAngle = Math.atan2(interaction.startMouseY - centerY, interaction.startMouseX - centerX);
  const currentAngle = Math.atan2(pointerY - centerY, pointerX - centerX);
  let deltaDeg = normalizeDeltaDegrees((currentAngle - startAngle) * (180 / Math.PI));

  if (snapToFifteen) {
    deltaDeg = Math.round(deltaDeg / 15) * 15;
  }

  return {
    elementId: interaction.elementId,
    rotation: normalizeRotation(startT.rotation + deltaDeg),
  };
}

export function useRotate(opts: UseRotateOptions): {
  handleRotateStart: (e: React.PointerEvent, elementId: string) => void;
  handleRotateMove: (e: React.PointerEvent) => void;
  handleRotateEnd: (e: React.PointerEvent) => void;
} {
  const {
    interaction,
    stageRect,
    startRotate,
    updateRotate,
    endRotate,
    dispatch,
    getElement,
  } = opts;

  const handleRotateStart = useCallback((e: React.PointerEvent, elementId: string) => {
    const element = getElement(elementId);
    if (!element || element.locked || !stageRect) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRotate(elementId, e.clientX, e.clientY, element.transform);
  }, [getElement, stageRect, startRotate]);

  const handleRotateMove = useCallback((e: React.PointerEvent) => {
    if (!stageRect) return;
    const next = calculateRotation(
      interaction,
      e.currentTarget as HTMLElement,
      e.clientX,
      e.clientY,
      e.shiftKey,
    );
    if (!next) return;

    updateRotate(e.clientX, e.clientY);
    dispatch({
      type: 'SET_ROTATION',
      elementId: next.elementId,
      rotation: next.rotation,
      _ephemeral: true,
    });
  }, [dispatch, interaction, stageRect, updateRotate]);

  const handleRotateEnd = useCallback((e: React.PointerEvent) => {
    if (!stageRect) return;
    const next = calculateRotation(
      interaction,
      e.currentTarget as HTMLElement,
      e.clientX,
      e.clientY,
      e.shiftKey,
    );
    if (!next) return;

    const target = e.currentTarget;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }

    dispatch({
      type: 'SET_ROTATION',
      elementId: next.elementId,
      rotation: next.rotation,
    });
    endRotate();
  }, [dispatch, endRotate, interaction, stageRect]);

  return {handleRotateStart, handleRotateMove, handleRotateEnd};
}
