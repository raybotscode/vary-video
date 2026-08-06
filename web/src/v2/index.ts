/**
 * Vary.video v2 Editor — public exports.
 *
 * Import this module to use the DOM-based template editor.
 */

// Main editor component
export {default as Editor} from './editor/Editor';

// Zustand stores (for advanced consumers)
export {useDocumentStore, createEmptyDocument} from './stores/documentStore';
export {useEditorStore} from './stores/editorStore';
export type {InteractionState, InteractionType, ResizeHandle} from './stores/editorStore';
export {useMergeDataStore, parseCSV, parseJSON} from './stores/mergeDataStore';
export type {MergeDataState, MergeError} from './stores/mergeDataStore';

// Commands (for custom integrations)
export type {EditorCommand} from './commands/types';

// Utilities
export {calculateStageRect, screenToNormalized, normalizedToScreen, screenDeltaToNormalized} from './utils/coordinates';
export {buildElementStyle} from './utils/transform';
export {createElementFromRegistry, generateElementId} from './utils/elementFactory';
