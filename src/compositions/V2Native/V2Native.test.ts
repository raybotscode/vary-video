import {describe, expect, it} from 'vitest';
import {v2NativeSchema, getDefaultV2NativeProps, getV2DocumentDuration} from './schema';
import {v2DocumentSchema} from '../../v2/schema/document';

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Build a valid V2Document by parsing a minimal input through the Zod schema.
 * Cast via `any` so our sparse fixture objects pass TS — Zod fills in all
 * defaults at runtime.
 */
function parseDoc(obj: Record<string, unknown>): ReturnType<typeof v2DocumentSchema.parse> {
  return v2DocumentSchema.parse(obj as any);
}

function makeDoc(overrides?: Record<string, unknown>) {
  return parseDoc({
    schemaVersion: 3,
    id: 'test-doc',
    name: 'Test Document',
    scenes: [{
      id: 'scene-1',
      name: 'Scene 1',
      durationFrames: 90,
      background: {type: 'solid', color: '#FFFFFF'},
      elements: [{
        id: 'el-1',
        name: 'Hello Text',
        type: 'text',
        props: {content: 'Hello V2Native!', fontSize: 72, color: '#1A365D'},
      }],
    }],
    ...overrides,
  });
}

describe('v2NativeSchema', () => {
  it('accepts a minimal valid V2Native props', () => {
    const result = v2NativeSchema.safeParse({document: makeDoc()});
    expect(result.success).toBe(true);
  });

  it('accepts data overrides', () => {
    const result = v2NativeSchema.safeParse({
      document: makeDoc(),
      data: {headline: 'Custom Value'},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data.headline).toBe('Custom Value');
    }
  });

  it('accepts custom width/height/fps', () => {
    const result = v2NativeSchema.safeParse({
      document: makeDoc(),
      width: 1080,
      height: 1920,
      fps: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.width).toBe(1080);
      expect(result.data.height).toBe(1920);
      expect(result.data.fps).toBe(25);
    }
  });

  it('defaults width/height/fps when not provided', () => {
    const result = v2NativeSchema.safeParse({document: makeDoc()});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.width).toBe(1920);
      expect(result.data.height).toBe(1080);
      expect(result.data.fps).toBe(30);
    }
  });

  it('rejects a document without scenes', () => {
    expect(() => makeDoc({scenes: []})).toThrow();
  });

  it('rejects missing document', () => {
    const result = v2NativeSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('getV2DocumentDuration', () => {
  it('sums scene durations', () => {
    const doc = parseDoc({
      schemaVersion: 3,
      id: 'multi-scene',
      name: 'Multi Scene',
      scenes: [
        {id: 's1', name: 'S1', durationFrames: 30, background: {type: 'solid', color: '#FFFFFF'}, elements: []},
        {id: 's2', name: 'S2', durationFrames: 60, background: {type: 'solid', color: '#000000'}, elements: []},
      ],
    });
    expect(getV2DocumentDuration(doc)).toBe(90);
  });

  it('returns the scene duration for a single scene', () => {
    const doc = makeDoc();
    expect(getV2DocumentDuration(doc)).toBe(90);
  });
});

describe('getDefaultV2NativeProps', () => {
  it('returns valid props', () => {
    const props = getDefaultV2NativeProps();
    const result = v2NativeSchema.safeParse(props);
    expect(result.success).toBe(true);
  });

  it('has a document with at least one scene', () => {
    const props = getDefaultV2NativeProps();
    expect(props.document.scenes.length).toBeGreaterThanOrEqual(1);
  });

  it('has a document with valid fps', () => {
    const props = getDefaultV2NativeProps();
    expect(props.document.fps).toBe(30);
  });
});

describe('V2Document with all element types', () => {
  it('accepts text, image, and shape elements', () => {
    const doc = parseDoc({
      schemaVersion: 3,
      id: 'mixed-types',
      name: 'Mixed Types',
      scenes: [{
        id: 's1',
        name: 'Mixed Scene',
        durationFrames: 60,
        background: {type: 'gradient', color1: '#111111', color2: '#333333'},
        elements: [
          {
            id: 'text-1', type: 'text',
            props: {content: 'Mixed', fontSize: 48, fontWeight: 700, color: '#FFFFFF', textAlign: 'center'},
            transform: {x: 0.5, y: 0.2, width: 0.8, zIndex: 10, opacity: 1},
          },
          {
            id: 'img-1', type: 'image',
            props: {src: 'https://example.com/hero.jpg', fit: 'cover', borderRadius: 8},
            transform: {x: 0.5, y: 0.6, width: 0.6, height: 0.4, zIndex: 5},
          },
          {
            id: 'shape-1', type: 'shape',
            props: {shapeType: 'circle', fill: '#3182CE'},
            transform: {x: 0.1, y: 0.1, width: 0.1, height: 0.1, zIndex: 1, opacity: 0.8},
          },
        ],
      }],
    });

    const result = v2NativeSchema.safeParse({document: doc});
    expect(result.success).toBe(true);
    if (result.success) {
      const scene = result.data.document.scenes[0];
      expect(scene.elements.length).toBe(3);
      expect(scene.elements[0].type).toBe('text');
      expect(scene.elements[1].type).toBe('image');
      expect(scene.elements[2].type).toBe('shape');
    }
  });
});

describe('V2Document with animation presets', () => {
  it('accepts elements with animation.in preset', () => {
    const doc = parseDoc({
      schemaVersion: 3,
      id: 'animated',
      name: 'Animated',
      scenes: [{
        id: 's1',
        name: 'Animated Scene',
        durationFrames: 60,
        background: {type: 'solid', color: '#FFFFFF'},
        elements: [{
          id: 'el-1', type: 'text',
          props: {content: 'Animated!', fontSize: 48, color: '#000000'},
          animation: {in: {preset: 'fade-in', durationFrames: 15, easing: 'ease-out', intensity: 1}},
        }],
      }],
    });
    const result = v2NativeSchema.safeParse({document: doc});
    expect(result.success).toBe(true);
  });

  it('accepts elements with animation.out preset', () => {
    const doc = parseDoc({
      schemaVersion: 3,
      id: 'exit-anim',
      name: 'Exit Animation',
      scenes: [{
        id: 's1',
        name: 'Exit Animated',
        durationFrames: 60,
        background: {type: 'solid', color: '#FFFFFF'},
        elements: [{
          id: 'el-1', type: 'text',
          props: {content: 'Bye!', fontSize: 48, color: '#000000'},
          animation: {
            in: {preset: 'none'},
            out: {preset: 'slide-left', durationFrames: 15, easing: 'ease-in', intensity: 1},
          },
        }],
      }],
    });
    const result = v2NativeSchema.safeParse({document: doc});
    expect(result.success).toBe(true);
  });

  it('accepts all animation presets', () => {
    const presets = [
      'none', 'fade-in', 'fade-out',
      'slide-left', 'slide-right', 'slide-up', 'slide-down',
      'scale-in', 'scale-out', 'zoom-in', 'zoom-out',
      'bounce-in', 'rotate-in',
    ] as const;

    for (const preset of presets) {
      const doc = parseDoc({
        schemaVersion: 3,
        id: `preset-${preset}`,
        name: `Preset: ${preset}`,
        scenes: [{
          id: 's1', name: `Preset: ${preset}`, durationFrames: 60,
          background: {type: 'solid', color: '#FFFFFF'},
          elements: [{
            id: 'el-1', type: 'text',
            props: {content: preset, fontSize: 48, color: '#000000'},
            animation: {in: {preset, durationFrames: 15, easing: 'ease-out', intensity: 1}},
          }],
        }],
      });
      const result = v2NativeSchema.safeParse({document: doc});
      expect(result.success).toBe(true);
    }
  });
});
