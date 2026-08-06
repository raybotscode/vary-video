import {describe, expect, it} from 'vitest';
import {
  assertKnownEnabledBlockIds,
  assertKnownEnabledTemplateId,
  getCapabilityRegistry,
  getCapabilityVersion,
  getCompactCapabilitySummary,
} from './registry';

describe('capability registry', () => {
  it('includes all current templates and blocks', () => {
    const registry = getCapabilityRegistry();
    expect(registry.templates.length).toBe(5);
    expect(registry.blocks).toHaveLength(13)
    // All 14 animation presets are enabled (9 entry + 5 exit).
    expect(registry.animations.length).toBe(14);
    expect(registry.animations.map((a) => a.id)).toContain('none');
    expect(registry.animations.map((a) => a.id)).toContain('fade-in');
    expect(registry.styles.length).toBeGreaterThanOrEqual(3);
  });

  it('version is stable across calls (deterministic)', () => {
    expect(getCapabilityVersion()).toBe(getCapabilityVersion());
  });

  it('compact summary includes all enabled capabilities', () => {
    const summary = getCompactCapabilitySummary();
    // Phase 4: all animation presets are enabled.
    expect(summary.animations).toContain('fade-in');
    expect(summary.animations).toContain('none');
    expect(summary.animations.length).toBe(14);
    expect(summary.templates.length).toBe(5);
    expect(summary.blocks.length).toBe(13);
  });

  it('asserts known block IDs and rejects unknown', () => {
    expect(() => assertKnownEnabledBlockIds(['product-intro', 'brand-frame'])).not.toThrow();
    expect(() => assertKnownEnabledBlockIds(['not-a-block'])).toThrow(/Unknown or disabled/);
  });

  it('asserts known template IDs and rejects unknown', () => {
    expect(() => assertKnownEnabledTemplateId('RealEstate')).not.toThrow();
    expect(() => assertKnownEnabledTemplateId('Nope')).toThrow(/Unknown or disabled/);
  });
});
