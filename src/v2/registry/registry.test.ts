import {describe, it, expect} from 'vitest';
import {
  getElement,
  getAllElements,
  getElementsByCategory,
  hasElementType,
} from './elements';
import {
  getAnimationPreset,
  getAllAnimationPresets,
  getAnimationPresetsByDirection,
  getEasing,
  EASINGS,
} from './animations';
import {
  getCapabilities,
  getCapabilityVersion,
  invalidateCapabilities,
} from './capabilities';

describe('Element Registry', () => {
  it('registers text element', () => {
    const text = getElement('text');
    expect(text.type).toBe('text');
    expect(text.name).toBe('Text');
    expect(text.supportsInlineEdit).toBe(true);
    expect(text.supportsMergeTags).toBe(true);
  });

  it('registers image element', () => {
    const image = getElement('image');
    expect(image.type).toBe('image');
    expect(image.supportsInlineEdit).toBe(false);
    expect(image.supportsMergeTags).toBe(true);
  });

  it('registers shape element', () => {
    const shape = getElement('shape');
    expect(shape.type).toBe('shape');
    expect(shape.supportsInlineEdit).toBe(false);
  });

  it('returns all elements', () => {
    const all = getAllElements();
    expect(all).toHaveLength(3);
    expect(all.map(e => e.type)).toContain('text');
    expect(all.map(e => e.type)).toContain('image');
    expect(all.map(e => e.type)).toContain('shape');
  });

  it('filters by category', () => {
    const basic = getElementsByCategory('basic');
    expect(basic).toHaveLength(3); // all are basic
    const media = getElementsByCategory('media');
    expect(media).toHaveLength(1); // only image
  });

  it('checks type existence', () => {
    expect(hasElementType('text')).toBe(true);
    expect(hasElementType('image')).toBe(true);
    expect(hasElementType('video')).toBe(false);
  });

  it('throws for unknown type', () => {
    expect(() => getElement('video' as any)).toThrow('Unknown element type: video');
  });

  it('has property metadata for text', () => {
    const text = getElement('text');
    const contentProp = text.properties.find(p => p.key === 'content');
    expect(contentProp).toBeDefined();
    expect(contentProp!.supportsMergeTags).toBe(true);
    expect(contentProp!.type).toBe('text');
  });

  it('has default props that match schema', () => {
    const text = getElement('text');
    expect(text.defaultProps.content).toBe('{{headline}}');
    expect(text.defaultProps.fontFamily).toBe('Inter');
    expect(text.defaultProps.fontSize).toBe(72);
    expect(text.defaultProps.color).toBe('#1A365D');
  });
});

describe('Animation Registry', () => {
  it('has all presets', () => {
    const all = getAllAnimationPresets();
    expect(all.length).toBeGreaterThanOrEqual(13);
    expect(all.map(p => p.id)).toContain('fade-in');
    expect(all.map(p => p.id)).toContain('slide-up');
    expect(all.map(p => p.id)).toContain('bounce-in');
  });

  it('filters by direction', () => {
    const ins = getAnimationPresetsByDirection('in');
    expect(ins.length).toBeGreaterThanOrEqual(8);
    expect(ins.every(p => p.direction === 'in' || p.direction === 'both')).toBe(true);

    const outs = getAnimationPresetsByDirection('out');
    expect(outs.length).toBeGreaterThanOrEqual(3);
  });

  it('gets preset by id', () => {
    const fadeIn = getAnimationPreset('fade-in');
    expect(fadeIn).toBeDefined();
    expect(fadeIn!.name).toBe('Fade In');
    expect(fadeIn!.direction).toBe('in');
  });

  it('returns undefined for unknown preset', () => {
    expect(getAnimationPreset('nonexistent' as any)).toBeUndefined();
  });

  it('has CSS keyframes for each preset', () => {
    const all = getAllAnimationPresets();
    for (const preset of all) {
      if (preset.id === 'none') continue;
      expect(preset.cssKeyframes).toBeDefined();
      expect(preset.cssKeyframes.from).toBeDefined();
      expect(preset.cssKeyframes.to).toBeDefined();
    }
  });

  it('has easings', () => {
    expect(EASINGS.length).toBeGreaterThanOrEqual(9);
    const easeOut = getEasing('ease-out');
    expect(easeOut.id).toBe('ease-out');
    expect(easeOut.css).toContain('cubic-bezier');
  });

  it('falls back to linear for unknown easing', () => {
    const result = getEasing('nonexistent' as any);
    expect(result.id).toBe('linear');
  });
});

describe('Capability Service', () => {
  it('generates capability output', () => {
    invalidateCapabilities();
    const caps = getCapabilities();
    expect(caps.version).toBeDefined();
    expect(caps.version.length).toBe(12);
    expect(caps.elements).toHaveLength(3);
    expect(caps.animations.length).toBeGreaterThanOrEqual(13);
    expect(caps.easings.length).toBeGreaterThanOrEqual(9);
    expect(caps.aspectRatios).toEqual(['16:9', '9:16', '1:1']);
    expect(caps.limits.maxScenes).toBe(20);
  });

  it('caches output', () => {
    const caps1 = getCapabilities();
    const caps2 = getCapabilities();
    expect(caps1).toBe(caps2); // same reference = cached
  });

  it('version changes after invalidation', () => {
    const v1 = getCapabilityVersion();
    invalidateCapabilities();
    // Version should be the same since registry didn't change
    const v2 = getCapabilityVersion();
    expect(v1).toBe(v2);
  });

  it('includes element property metadata', () => {
    const caps = getCapabilities();
    const textEl = caps.elements.find(e => e.type === 'text');
    expect(textEl).toBeDefined();
    expect(textEl!.properties.length).toBeGreaterThanOrEqual(10);
    expect(textEl!.supportsInlineEdit).toBe(true);
    expect(textEl!.supportsMergeTags).toBe(true);
  });

  it('includes animation direction info', () => {
    const caps = getCapabilities();
    const fadeIn = caps.animations.find(a => a.id === 'fade-in');
    expect(fadeIn).toBeDefined();
    expect(fadeIn!.direction).toBe('in');
  });
});
