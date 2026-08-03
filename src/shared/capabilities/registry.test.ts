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
    expect(registry.blocks).toHaveLength(12)
    // Only 'none' animation is enabled in Phase 2.
    expect(registry.animations.map((a) => a.id)).toEqual(['none']);
    expect(registry.styles.length).toBeGreaterThanOrEqual(3);
  });

  it('version is stable across calls (deterministic)', () => {
    expect(getCapabilityVersion()).toBe(getCapabilityVersion());
  });

  it('compact summary excludes disabled capabilities', () => {
    const summary = getCompactCapabilitySummary();
    // 'fade-in' etc. are disabled — must not appear.
    expect(summary.animations).not.toContain('fade-in');
    expect(summary.animations).toContain('none');
    expect(summary.templates.length).toBe(5);
    expect(summary.blocks.length).toBe(12);
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
