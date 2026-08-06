/**
 * V2 Element Factory — create new elements from registry defaults.
 *
 * Used by the ADD_ELEMENT command and toolbar buttons to create
 * properly initialized elements with unique IDs.
 */

import type {V2Element} from '@vary/v2/schema/document';
import type {ElementTypeId} from '@vary/v2/registry/elements';
import {getElement} from '@vary/v2/registry/elements';

let counter = 0;

/** Generate a unique element ID. */
export function generateElementId(type: string): string {
  counter++;
  return `${type}-${Date.now()}-${counter}`;
}

/** Create a new element with registry defaults and a unique ID. */
export function createElementFromRegistry(type: ElementTypeId, overrides?: Partial<V2Element>): V2Element {
  const def = getElement(type);
  const newId = generateElementId(type);
  const {id: _dropId, ...restOverrides} = overrides ?? {};

  return {
    id: newId,
    type: type as V2Element['type'],
    name: def.name,
    visible: true,
    locked: false,
    timing: {startFrame: 0, endFrame: null},
    transform: {
      x: 0.5,
      y: 0.5,
      width: type === 'shape' ? 0.3 : 0.6,
      height: null,
      rotation: 0,
      anchorX: 0.5,
      anchorY: 0.5,
      zIndex: 10,
      opacity: 1,
    },
    responsiveOverrides: {},
    props: structuredClone(def.defaultProps),
    animation: {},
    ...restOverrides,
  } as V2Element;
}
