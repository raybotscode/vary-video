/**
 * V2 Editor Commands — discriminated union for all document mutations.
 *
 * Commands are dispatched through the document store and automatically
 * tracked in the undo/redo history stack.
 *
 * Interaction commands (drag, resize, rotate) can set _ephemeral: true
 * to suppress history entries during live manipulation — only the final
 * position is committed to history on pointerup.
 */

import type {Transform, V2Element, Background, AspectRatio, MergeTagType} from '@vary/v2/schema/document';

// ─── Element CRUD ──────────────────────────────────────────────────

export interface AddElementCommand {
  type: 'ADD_ELEMENT';
  elementType: 'text' | 'image' | 'shape';
  afterId?: string;
}

export interface DeleteElementCommand {
  type: 'DELETE_ELEMENT';
  elementId: string;
}

export interface DuplicateElementCommand {
  type: 'DUPLICATE_ELEMENT';
  elementId: string;
}

export interface MoveElementCommand {
  type: 'MOVE_ELEMENT';
  elementId: string;
  newIndex: number;
}

// ─── Transform Mutations ───────────────────────────────────────────

export interface SetTransformCommand {
  type: 'SET_TRANSFORM';
  elementId: string;
  transform: Transform;
}

export interface SetPositionCommand {
  type: 'SET_POSITION';
  elementId: string;
  x?: number;
  y?: number;
}

export interface SetSizeCommand {
  type: 'SET_SIZE';
  elementId: string;
  width?: number | null;
  height?: number | null;
}

export interface SetRotationCommand {
  type: 'SET_ROTATION';
  elementId: string;
  rotation: number;
}

export interface NudgeElementCommand {
  type: 'NUDGE_ELEMENT';
  elementId: string;
  dx: number;
  dy: number;
}

// ─── Property Mutations ────────────────────────────────────────────

export interface SetElementPropCommand {
  type: 'SET_ELEMENT_PROP';
  elementId: string;
  key: string;
  value: unknown;
}

export interface SetElementPropsCommand {
  type: 'SET_ELEMENT_PROPS';
  elementId: string;
  props: Record<string, unknown>;
}

// ─── Visibility / Lock ─────────────────────────────────────────────

export interface SetVisibleCommand {
  type: 'SET_VISIBLE';
  elementId: string;
  visible: boolean;
}

export interface SetLockedCommand {
  type: 'SET_LOCKED';
  elementId: string;
  locked: boolean;
}

// ─── Scene ─────────────────────────────────────────────────────────

export interface SetSceneBackgroundCommand {
  type: 'SET_SCENE_BACKGROUND';
  background: Background;
}

export interface SetSceneDurationCommand {
  type: 'SET_SCENE_DURATION';
  durationFrames: number;
}

// ─── Merge Tags ────────────────────────────────────────────────────

export interface AddMergeTagCommand {
  type: 'ADD_MERGE_TAG';
  key: string;
  tagType: MergeTagType;
  label: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
  format?: string;
  tagId?: string; // pre-generated ID (from CreateTagInline), else schema default
}

export interface RemoveMergeTagCommand {
  type: 'REMOVE_MERGE_TAG';
  tagId: string;
}

export interface UpdateMergeTagCommand {
  type: 'UPDATE_MERGE_TAG';
  tagId: string;
  key?: string;
  tagType?: MergeTagType;
  label?: string;
  defaultValue?: string;
  required?: boolean;
  description?: string;
  format?: string;
}

// ─── Undo/Redo ─────────────────────────────────────────────────────

export interface UndoCommand {
  type: 'UNDO';
}

export interface RedoCommand {
  type: 'REDO';
}

// ─── Union ─────────────────────────────────────────────────────────

type BaseEditorCommand =
  | AddElementCommand
  | DeleteElementCommand
  | DuplicateElementCommand
  | MoveElementCommand
  | SetTransformCommand
  | SetPositionCommand
  | SetSizeCommand
  | SetRotationCommand
  | NudgeElementCommand
  | SetElementPropCommand
  | SetElementPropsCommand
  | SetVisibleCommand
  | SetLockedCommand
  | SetSceneBackgroundCommand
  | SetSceneDurationCommand
  | AddMergeTagCommand
  | RemoveMergeTagCommand
  | UpdateMergeTagCommand
  | UndoCommand
  | RedoCommand;

/** Commands can suppress history tracking during live drag/resize/rotate. */
export type EditorCommand = BaseEditorCommand & {
  _ephemeral?: boolean;
};
