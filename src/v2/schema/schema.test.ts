import {describe, it, expect} from 'vitest';
import {
  v2DocumentSchema,
  validateDocument,
  safeValidateDocument,
  isV2Document,
  V2_DOCUMENT_VERSION,
  transformSchema,
  elementSchema,
  sceneSchema,
} from './document';
import {migrateV1ToV2, convertV1Layout} from './migration';

// ─── Valid Sample Documents ───────────────────────────────────────

const validTextElement = {
  id: 'headline',
  type: 'text',
  name: 'Headline',
  visible: true,
  locked: false,
  timing: {startFrame: 0, endFrame: null},
  transform: {x: 0.5, y: 0.4, width: 0.8, height: null, rotation: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 10, opacity: 1},
  responsiveOverrides: {},
  props: {
    content: '{{headline}}',
    fontFamily: 'Inter',
    fontSize: 72,
    fontWeight: 700,
    color: '#1A365D',
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  animation: {
    in: {preset: 'slide-up', durationFrames: 15, delayFrames: 0, easing: 'ease-out', intensity: 1},
  },
};

const validImageElement = {
  id: 'product-image',
  type: 'image',
  name: 'Product Image',
  visible: true,
  locked: false,
  timing: {startFrame: 0, endFrame: null},
  transform: {x: 0.5, y: 0.6, width: 0.4, height: 0.3, rotation: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 20, opacity: 1},
  responsiveOverrides: {},
  props: {
    src: '{{imageUrl}}',
    fit: 'cover',
    borderRadius: 12,
  },
  animation: {},
};

const validShapeElement = {
  id: 'accent-bar',
  type: 'shape',
  name: 'Accent Bar',
  visible: true,
  locked: false,
  timing: {startFrame: 0, endFrame: null},
  transform: {x: 0.5, y: 0.8, width: 0.6, height: 0.02, rotation: 0, anchorX: 0.5, anchorY: 0.5, zIndex: 5, opacity: 1},
  responsiveOverrides: {},
  props: {
    shapeType: 'rectangle',
    fill: '#FF6B5B',
    stroke: null,
    strokeWidth: 0,
    borderRadius: 4,
  },
  animation: {},
};

const validDocument = {
  schemaVersion: V2_DOCUMENT_VERSION,
  id: 'test-template-1',
  name: 'Product Launch',
  description: 'A product launch video template',
  fps: 30,
  defaultAspectRatio: '16:9',
  supportedAspectRatios: ['16:9', '9:16', '1:1'],
  scenes: [
    {
      id: 'scene-1',
      name: 'Opening',
      durationFrames: 90,
      background: {type: 'gradient', color1: '#FFFFFF', color2: '#F7FAFC', angle: 135},
      elements: [validTextElement, validImageElement, validShapeElement],
    },
    {
      id: 'scene-2',
      name: 'Details',
      durationFrames: 120,
      background: {type: 'solid', color: '#1A365D'},
      elements: [
        {
          ...validTextElement,
          id: 'details-text',
          name: 'Details',
          props: {...validTextElement.props, content: 'Learn more at {{url}}', color: '#FFFFFF'},
        },
      ],
    },
  ],
  mergeTags: [
    {key: 'headline', type: 'text', label: 'Headline', defaultValue: 'Your Headline', required: true},
    {key: 'imageUrl', type: 'image', label: 'Product Image', defaultValue: '', required: false},
    {key: 'url', type: 'url', label: 'Website URL', defaultValue: 'https://example.com', required: false},
  ],
  metadata: {category: 'product'},
  createdAt: '2026-08-05T00:00:00Z',
  updatedAt: '2026-08-05T00:00:00Z',
};

// ─── Tests ────────────────────────────────────────────────────────

describe('V2 Document Schema', () => {
  describe('validateDocument', () => {
    it('accepts a valid document', () => {
      const result = validateDocument(validDocument);
      expect(result.schemaVersion).toBe(3);
      expect(result.scenes).toHaveLength(2);
      expect(result.scenes[0].elements).toHaveLength(3);
    });

    it('rejects missing schemaVersion', () => {
      const doc = {...validDocument, schemaVersion: undefined};
      expect(() => validateDocument(doc)).toThrow();
    });

    it('rejects wrong schemaVersion', () => {
      const doc = {...validDocument, schemaVersion: 1};
      expect(() => validateDocument(doc)).toThrow();
    });

    it('rejects empty scenes', () => {
      const doc = {...validDocument, scenes: []};
      expect(() => validateDocument(doc)).toThrow();
    });

    it('rejects invalid element type', () => {
      const doc = {
        ...validDocument,
        scenes: [{
          ...validDocument.scenes[0],
          elements: [{...validTextElement, type: 'video'}],
        }],
      };
      expect(() => validateDocument(doc)).toThrow();
    });

    it('rejects out-of-range transform', () => {
      const doc = {
        ...validDocument,
        scenes: [{
          ...validDocument.scenes[0],
          elements: [{
            ...validTextElement,
            transform: {...validTextElement.transform, x: 1.5},
          }],
        }],
      };
      expect(() => validateDocument(doc)).toThrow();
    });

    it('rejects invalid merge tag key', () => {
      const doc = {
        ...validDocument,
        mergeTags: [{key: '123invalid', type: 'text', label: 'Bad'}],
      };
      expect(() => validateDocument(doc)).toThrow();
    });
  });

  describe('safeValidateDocument', () => {
    it('returns success for valid document', () => {
      const result = safeValidateDocument(validDocument);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test-template-1');
      }
    });

    it('returns error for invalid document', () => {
      const result = safeValidateDocument({invalid: true});
      expect(result.success).toBe(false);
    });
  });

  describe('isV2Document', () => {
    it('returns true for valid document', () => {
      expect(isV2Document(validDocument)).toBe(true);
    });

    it('returns false for invalid document', () => {
      expect(isV2Document({invalid: true})).toBe(false);
    });

    it('returns false for null', () => {
      expect(isV2Document(null)).toBe(false);
    });
  });

  describe('defaults', () => {
    it('fills default values for element', () => {
      const minimal = {
        id: 'test',
        type: 'text',
      };
      const result = elementSchema.parse(minimal);
      expect(result.visible).toBe(true);
      expect(result.locked).toBe(false);
      expect(result.transform.x).toBe(0.5);
      expect(result.transform.y).toBe(0.5);
      expect(result.transform.opacity).toBe(1);
      expect(result.timing.startFrame).toBe(0);
    });

    it('fills default values for scene', () => {
      const minimal = {
        id: 'scene-1',
        elements: [],
      };
      const result = sceneSchema.parse(minimal);
      expect(result.durationFrames).toBe(90);
      expect(result.background.type).toBe('gradient');
    });

    it('fills default values for transform', () => {
      const result = transformSchema.parse({});
      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
      expect(result.width).toBe(0.8);
      expect(result.height).toBeNull();
      expect(result.rotation).toBe(0);
      expect(result.anchorX).toBe(0.5);
      expect(result.anchorY).toBe(0.5);
      expect(result.zIndex).toBe(10);
      expect(result.opacity).toBe(1);
    });
  });
});

describe('V1 → V2 Migration', () => {
  const v1Props: any = {
    blocks: [
      {
        blockId: 'text-overlay',
        content: {headline: '{{headline}}', tagline: '{{tagline}}'},
        layout: {
          headline: {x: 50, y: 40, fontSize: 86, color: '#1A365D'},
          tagline: {x: 50, y: 60, fontSize: 42, color: '#3182CE'},
        },
        durationFrames: 120,
        animation: {
          entry: {presetId: 'slideUp', durationFrames: 15},
          exit: {presetId: 'fadeOut', durationFrames: 10},
        },
      },
      {
        blockId: 'data-callout',
        content: {value: '{{price}}', label: 'Starting from'},
        durationFrames: 90,
      },
    ],
    brandSettings: {
      brandColor: '#1A365D',
      secondaryColor: '#3182CE',
      accentColor: '#FF6B5B',
      backgroundType: 'gradient',
      backgroundColor: '#F7FAFC',
    },
    fps: 30,
    width: 1920,
    height: 1080,
    data: {headline: 'Test', tagline: 'Subtitle', price: '$99'},
  };

  it('converts v1 props to valid v2 document', () => {
    const v2 = migrateV1ToV2(v1Props);
    expect(isV2Document(v2)).toBe(true);
    expect(v2.schemaVersion).toBe(V2_DOCUMENT_VERSION);
    expect(v2.fps).toBe(30);
  });

  it('creates one scene per v1 block', () => {
    const v2 = migrateV1ToV2(v1Props);
    expect(v2.scenes).toHaveLength(2);
  });

  it('converts content fields to elements', () => {
    const v2 = migrateV1ToV2(v1Props);
    const scene1 = v2.scenes[0];
    // text-overlay has 2 content fields: headline, tagline
    expect(scene1.elements).toHaveLength(2);
    expect(scene1.elements[0].props).toHaveProperty('content');
  });

  it('converts percentage coordinates to normalized', () => {
    const v2 = migrateV1ToV2(v1Props);
    const headline = v2.scenes[0].elements[0];
    // v1: x=50% → v2: x=0.5
    expect(headline.transform.x).toBe(0.5);
    // v1: y=40% → v2: y=0.4
    expect(headline.transform.y).toBe(0.4);
  });

  it('maps animation presets', () => {
    const v2 = migrateV1ToV2(v1Props);
    const scene1 = v2.scenes[0];
    expect(scene1.elements[0].animation.in?.preset).toBe('slide-up');
    expect(scene1.elements[0].animation.out?.preset).toBe('fade-out');
  });

  it('preserves font sizes', () => {
    const v2 = migrateV1ToV2(v1Props);
    const headline = v2.scenes[0].elements[0];
    expect((headline.props as any).fontSize).toBe(86);
  });

  it('handles gradient background', () => {
    const v2 = migrateV1ToV2(v1Props);
    expect(v2.scenes[0].background.type).toBe('gradient');
  });

  it('convertsV1Layout correctly', () => {
    const result = convertV1Layout({x: 30, y: 70, fontSize: 48, color: '#FF0000'}, {x: 50, y: 50, fontSize: 86, color: '#000'});
    expect(result.x).toBe(0.3);
    expect(result.y).toBe(0.7);
    expect(result.fontSize).toBe(48);
    expect(result.color).toBe('#FF0000');
  });

  it('uses defaults when layout is undefined', () => {
    const result = convertV1Layout(undefined, {x: 50, y: 50, fontSize: 86, color: '#000'});
    expect(result.x).toBe(0.5);
    expect(result.y).toBe(0.5);
    expect(result.fontSize).toBe(86);
  });
});
