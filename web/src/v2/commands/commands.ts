/**
 * V2 Command Handlers — pure functions that apply an EditorCommand to a V2Document.
 *
 * All handlers are stateless and return a new V2Document with the mutation applied.
 * No side effects, no store access — just document transformations.
 */

import type {V2Document, V2Element, V2Scene, MergeTag} from '@vary/v2/schema/document';
import {validateDocument, mergeTagSchema} from '@vary/v2/schema/document';
import type {EditorCommand} from './types';
import {getElement as getElementDef} from '@vary/v2/registry/elements';
import type {ElementTypeId} from '@vary/v2/registry/elements';

// ─── Helpers ────────────────────────────────────────────────────────

let idCounter = 0;

export function generateElementId(type: string): string {
  idCounter++;
  return `${type}-${Date.now()}-${idCounter}`;
}

function updateScene(
  document: V2Document,
  activeSceneIndex: number,
  fn: (elements: V2Element[]) => V2Element[],
): V2Document {
  return {
    ...document,
    scenes: document.scenes.map((scene, i) =>
      i === activeSceneIndex
        ? {...scene, elements: fn(scene.elements)}
        : scene,
    ),
  };
}

function updateElement(
  document: V2Document,
  activeSceneIndex: number,
  elementId: string,
  fn: (el: V2Element) => V2Element,
): V2Document {
  return updateScene(document, activeSceneIndex, (elements) =>
    elements.map((el) => (el.id === elementId ? fn(el) : el)),
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ─── Element Factory ────────────────────────────────────────────────
export function createElement(type: ElementTypeId, overrides?: Partial<V2Element>): V2Element {
  const def = getElementDef(type);
  const newId = generateElementId(type);
  const {id: _id, transform: overrideTransform, props: overrideProps, ...restOverrides} = (overrides ?? {}) as any;

  const baseTransform = {
    x: 0.5, y: 0.5, width: type === 'shape' ? 0.3 : 0.6, height: null,
    rotation: 0, anchorX: 0.5, anchorY: 0.5,
    zIndex: 10, opacity: 1,
  };

  return {
    id: newId,
    type: type as V2Element['type'],
    name: def.name,
    visible: true,
    locked: false,
    timing: {startFrame: 0, endFrame: null},
    transform: overrideTransform ? {...baseTransform, ...overrideTransform} : baseTransform,
    responsiveOverrides: {},
    props: overrideProps ? {...structuredClone(def.defaultProps), ...overrideProps} : structuredClone(def.defaultProps),
    animation: {},
    ...restOverrides,
  } as V2Element;
}

// ─── Command Dispatcher ─────────────────────────────────────────────

export interface DispatchResult {
  document: V2Document;
  /** Whether this command should be pushed to undo history. */
  shouldRecord: boolean;
}

export function applyCommand(
  document: V2Document,
  activeSceneIndex: number,
  command: EditorCommand,
): DispatchResult {
  const scene = document.scenes[activeSceneIndex];
  if (!scene) return {document, shouldRecord: false};
  const shouldRecord = !command._ephemeral;

  switch (command.type) {
    // ─── Element CRUD ──────────────────────────────────────────
    case 'ADD_ELEMENT': {
      const elementCount = document.scenes[activeSceneIndex]?.elements.length ?? 0;
      const newEl = createElement(command.elementType, {
        transform: { zIndex: Math.max(10, (elementCount + 1) * 10) },
      } as any);
      return {
        document: updateScene(document, activeSceneIndex, (els) => [...els, newEl]),
        shouldRecord,
      };
    }

    case 'DELETE_ELEMENT': {
      return {
        document: updateScene(document, activeSceneIndex, (els) =>
          els.filter((el) => el.id !== command.elementId),
        ),
        shouldRecord,
      };
    }

    case 'DUPLICATE_ELEMENT': {
      const source = scene.elements.find((el) => el.id === command.elementId);
      if (!source) return {document, shouldRecord: false};
      const dup = structuredClone(source) as V2Element;
      dup.id = generateElementId(source.type);
      dup.name = `${source.name} (copy)`;
      dup.transform = {
        ...dup.transform,
        x: clamp(dup.transform.x + 0.02, 0, 1),
        y: clamp(dup.transform.y + 0.02, 0, 1),
        zIndex: dup.transform.zIndex + 1,
      };
      return {
        document: updateScene(document, activeSceneIndex, (els) => [...els, dup]),
        shouldRecord,
      };
    }

    case 'MOVE_ELEMENT': {
      const els = [...scene.elements];
      const fromIdx = els.findIndex((el) => el.id === command.elementId);
      if (fromIdx === -1) return {document, shouldRecord: false};
      const [moved] = els.splice(fromIdx, 1);
      els.splice(command.newIndex, 0, moved);
      // Reassign zIndex based on new array positions so visual order matches
      const reindexed = els.map((el, i) => ({
        ...el,
        transform: {...el.transform, zIndex: (i + 1) * 10},
      }));
      return {document: updateScene(document, activeSceneIndex, () => reindexed), shouldRecord};
    }

    // ─── Transform Mutations ───────────────────────────────────
    case 'SET_TRANSFORM': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          transform: command.transform,
        })),
        shouldRecord,
      };
    }

    case 'SET_POSITION': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          transform: {
            ...el.transform,
            ...(command.x !== undefined ? {x: clamp(command.x, 0, 1)} : {}),
            ...(command.y !== undefined ? {y: clamp(command.y, 0, 1)} : {}),
          },
        })),
        shouldRecord,
      };
    }

    case 'SET_SIZE': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          transform: {
            ...el.transform,
            ...(command.width !== undefined ? {width: clamp(command.width, 0, 1)} : {}),
            ...(command.height !== undefined ? {height: clamp(command.height, 0, 1)} : {}),
          },
        })),
        shouldRecord,
      };
    }

    case 'SET_ROTATION': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          transform: {
            ...el.transform,
            rotation: clamp(command.rotation, -360, 360),
          },
        })),
        shouldRecord,
      };
    }

    case 'NUDGE_ELEMENT': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          transform: {
            ...el.transform,
            x: clamp(el.transform.x + command.dx, 0, 1),
            y: clamp(el.transform.y + command.dy, 0, 1),
          },
        })),
        shouldRecord,
      };
    }

    // ─── Property Mutations ────────────────────────────────────
    case 'SET_ELEMENT_PROP': {
      // Transform and top-level element properties go to element.transform, not props
      const transformKeys = new Set(['x', 'y', 'width', 'height', 'rotation', 'anchorX', 'anchorY', 'zIndex', 'opacity']);
      const isTransformKey = transformKeys.has(command.key);
      const isAnimationKey = command.key === 'animation';

      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => {
          if (isTransformKey) {
            return {
              ...el,
              transform: {...el.transform, [command.key]: command.value},
            } as V2Element;
          }
          if (isAnimationKey) {
            return {...el, animation: command.value as any} as V2Element;
          }
          return {...el, props: {...el.props, [command.key]: command.value}} as V2Element;
        }),
        shouldRecord,
      };
    }

    case 'SET_ELEMENT_PROPS': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => {
          const updated = {...el} as any;
          updated.props = {...el.props, ...command.props};
          return updated as V2Element;
        }),
        shouldRecord,
      };
    }

    // ─── Visibility / Lock ─────────────────────────────────────
    case 'SET_VISIBLE': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          visible: command.visible,
        })),
        shouldRecord,
      };
    }

    case 'SET_LOCKED': {
      return {
        document: updateElement(document, activeSceneIndex, command.elementId, (el) => ({
          ...el,
          locked: command.locked,
        })),
        shouldRecord,
      };
    }

    // ─── Scene ─────────────────────────────────────────────────
    case 'SET_SCENE_BACKGROUND': {
      return {
        document: {
          ...document,
          scenes: document.scenes.map((s, i) =>
            i === activeSceneIndex ? {...s, background: command.background} : s,
          ),
        },
        shouldRecord,
      };
    }

    case 'SET_SCENE_DURATION': {
      return {
        document: {
          ...document,
          scenes: document.scenes.map((s, i) =>
            i === activeSceneIndex ? {...s, durationFrames: command.durationFrames} : s,
          ),
        },
        shouldRecord,
      };
    }

    // ─── Scene CRUD ─────────────────────────────────────────────

    case 'ADD_SCENE': {
      const insertAfter = command.afterIndex ?? activeSceneIndex;
      const sceneNumber = document.scenes.length + 1;
      const newScene: V2Scene = {
        id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: command.name ?? `Scene ${sceneNumber}`,
        durationFrames: 90,
        background: {type: 'gradient', color1: '#FFFFFF', color2: '#F7FAFC', angle: 135},
        elements: [],
      };
      const scenes = [...document.scenes];
      scenes.splice(insertAfter + 1, 0, newScene);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'DELETE_SCENE': {
      if (document.scenes.length <= 1) return {document, shouldRecord: false};
      const scenes = document.scenes.filter((_, i) => i !== command.sceneIndex);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'DUPLICATE_SCENE': {
      const source = document.scenes[command.sceneIndex];
      if (!source) return {document, shouldRecord: false};
      const dupScene: V2Scene = {
        ...structuredClone(source),
        id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: `${source.name} (copy)`,
      };
      const scenes = [...document.scenes];
      scenes.splice(command.sceneIndex + 1, 0, dupScene);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'MOVE_SCENE': {
      const scenes = [...document.scenes];
      const [moved] = scenes.splice(command.sceneIndex, 1);
      if (!moved) return {document, shouldRecord: false};
      scenes.splice(command.newIndex, 0, moved);
      return {
        document: {...document, scenes},
        shouldRecord,
      };
    }

    case 'SET_SCENE_NAME': {
      const trimmed = command.name.trim();
      if (!trimmed) return {document, shouldRecord: false};
      return {
        document: {
          ...document,
          scenes: document.scenes.map((s, i) =>
            i === command.sceneIndex ? {...s, name: trimmed} : s,
          ),
        },
        shouldRecord,
      };
    }

    case 'SET_ACTIVE_SCENE': {
      if (command.sceneIndex < 0 || command.sceneIndex >= document.scenes.length) {
        return {document, shouldRecord: false};
      }
      return {document, shouldRecord: false};
    }

    // ─── Merge Tags ────────────────────────────────────────────
    case 'ADD_MERGE_TAG': {
      const newTag: MergeTag = mergeTagSchema.parse({
        id: command.tagId, // pre-generated ID from CreateTagInline (if any); schema default otherwise
        key: command.key,
        type: command.tagType,
        label: command.label,
        defaultValue: command.defaultValue ?? '',
        required: command.required ?? false,
        description: command.description ?? '',
        format: command.format,
      });
      return {
        document: {
          ...document,
          mergeTags: [...document.mergeTags, newTag],
        },
        shouldRecord,
      };
    }

    case 'REMOVE_MERGE_TAG': {
      // Remove the tag and clean up any bindings that reference it
      const tag = document.mergeTags.find((t) => t.id === command.tagId);
      let doc = {
        ...document,
        mergeTags: document.mergeTags.filter((t) => t.id !== command.tagId),
      };

      if (tag) {
        // Walk all scenes and elements to clean up references
        doc = {
          ...doc,
          scenes: doc.scenes.map((scene) => ({
            ...scene,
            elements: scene.elements.map((el) => {
              const props = el.props as Record<string, unknown>;
              let changed = false;
              const newProps = {...props};

              for (const [key, value] of Object.entries(props)) {
                // Handle BindableText
                if (
                  typeof value === 'object' &&
                  value !== null &&
                  (value as any)._type === 'bindableText'
                ) {
                  const bt = value as any;
                  const newTokens = bt.tokens.filter(
                    (tok: any) => tok._type !== 'tag' || tok.tagId !== command.tagId,
                  );
                  if (newTokens.length !== bt.tokens.length) {
                    newProps[key] = {...bt, tokens: newTokens};
                    changed = true;
                  }
                }
                // Handle BindableValue (tag binding)
                if (
                  typeof value === 'object' &&
                  value !== null &&
                  (value as any)._type === 'tag' &&
                  (value as any).tagId === command.tagId
                ) {
                  const fallback = (value as any).fallback;
                  newProps[key] = {_type: 'literal', value: fallback ?? ''};
                  changed = true;
                }
              }

              return changed ? ({...el, props: newProps} as typeof el) : el;
            }),
          })),
        };
      }

      return {document: doc, shouldRecord};
    }

    case 'UPDATE_MERGE_TAG': {
      return {
        document: {
          ...document,
          mergeTags: document.mergeTags.map((t) => {
            if (t.id !== command.tagId) return t;
            return {
              ...t,
              ...(command.key !== undefined ? {key: command.key} : {}),
              ...(command.tagType !== undefined ? {type: command.tagType} : {}),
              ...(command.label !== undefined ? {label: command.label} : {}),
              ...(command.defaultValue !== undefined ? {defaultValue: command.defaultValue} : {}),
              ...(command.required !== undefined ? {required: command.required} : {}),
              ...(command.description !== undefined ? {description: command.description} : {}),
              ...(command.format !== undefined ? {format: command.format} : {}),
            };
          }),
        },
        shouldRecord,
      };
    }

    // ─── Document Meta ──────────────────────────────────────────

    case 'SET_DOCUMENT_NAME': {
      const trimmed = command.name.trim();
      if (!trimmed) return {document, shouldRecord: false};
      return {
        document: {...document, name: trimmed, updatedAt: new Date().toISOString()},
        shouldRecord: true,
      };
    }

    // ─── Undo/Redo are handled by the store, not here ──────────
    case 'UNDO':
    case 'REDO':
      return {document, shouldRecord: false};

    default:
      return {document, shouldRecord: false};
  }
}
