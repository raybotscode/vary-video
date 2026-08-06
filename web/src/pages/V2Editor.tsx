/**
 * V2 Editor Page — standalone test route for the new Zustand-based editor.
 *
 * Creates a sample document with a few elements and renders the full
 * editor shell (layers, stage, properties, toolbar).
 */

import {Editor, createEmptyDocument} from '../v2';
import type {V2Document} from '@vary/v2/schema/document';

/** Create a sample document with demo elements. */
function createSampleDocument(): V2Document {
  const doc = createEmptyDocument();
  const scene = doc.scenes[0];

  scene.elements = [
    {
      id: 'text-title',
      type: 'text',
      name: 'Title',
      visible: true,
      locked: false,
      timing: {startFrame: 0, endFrame: null},
      transform: {
        x: 0.5, y: 0.35, width: 0.7, height: null,
        rotation: 0, anchorX: 0.5, anchorY: 0.5,
        zIndex: 20, opacity: 1,
      },
      responsiveOverrides: {},
      props: {
        content: 'Welcome to Vary.video v2',
        fontFamily: 'Inter',
        fontSize: 64,
        fontWeight: 700,
        fontStyle: 'normal',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#1A365D',
        textAlign: 'center',
        verticalAlign: 'middle',
        textTransform: 'none',
        maxLines: null,
        backgroundColor: null,
        padding: 0,
        borderRadius: 0,
      },
      animation: {},
    },
    {
      id: 'text-subtitle',
      type: 'text',
      name: 'Subtitle',
      visible: true,
      locked: false,
      timing: {startFrame: 0, endFrame: null},
      transform: {
        x: 0.5, y: 0.5, width: 0.5, height: null,
        rotation: 0, anchorX: 0.5, anchorY: 0.5,
        zIndex: 15, opacity: 1,
      },
      responsiveOverrides: {},
      props: {
        content: 'Drag, resize, and style elements with our new editor',
        fontFamily: 'Inter',
        fontSize: 28,
        fontWeight: 400,
        fontStyle: 'normal',
        lineHeight: 1.5,
        letterSpacing: 0,
        color: '#4A5568',
        textAlign: 'center',
        verticalAlign: 'middle',
        textTransform: 'none',
        maxLines: null,
        backgroundColor: null,
        padding: 0,
        borderRadius: 0,
      },
      animation: {},
    },
    {
      id: 'shape-accent',
      type: 'shape',
      name: 'Accent Bar',
      visible: true,
      locked: false,
      timing: {startFrame: 0, endFrame: null},
      transform: {
        x: 0.5, y: 0.65, width: 0.15, height: 0.008,
        rotation: 0, anchorX: 0.5, anchorY: 0.5,
        zIndex: 10, opacity: 1,
      },
      responsiveOverrides: {},
      props: {
        shapeType: 'rectangle',
        fill: '#3182CE',
        stroke: null,
        strokeWidth: 0,
        borderRadius: 4,
      },
      animation: {},
    },
    {
      id: 'text-hint',
      type: 'text',
      name: 'Hint',
      visible: true,
      locked: false,
      timing: {startFrame: 0, endFrame: null},
      transform: {
        x: 0.5, y: 0.75, width: 0.6, height: null,
        rotation: 0, anchorX: 0.5, anchorY: 0.5,
        zIndex: 5, opacity: 0.7,
      },
      responsiveOverrides: {},
      props: {
        content: 'Click an element to edit · Arrow keys to nudge · Del to delete · Ctrl+Z to undo',
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: 400,
        fontStyle: 'normal',
        lineHeight: 1.5,
        letterSpacing: 0,
        color: '#718096',
        textAlign: 'center',
        verticalAlign: 'middle',
        textTransform: 'none',
        maxLines: null,
        backgroundColor: null,
        padding: 0,
        borderRadius: 0,
      },
      animation: {},
    },
  ];

  return doc;
}

export default function V2EditorPage() {
  const sampleDoc = createSampleDocument();

  return (
    <div style={{position: 'fixed', inset: 0, zIndex: 9999}}>
      <Editor
        document={sampleDoc}
        aspectRatio="16:9"
        onDocumentChange={(doc) => {
          console.log('Document updated:', doc.scenes[0].elements.length, 'elements');
        }}
      />
    </div>
  );
}
