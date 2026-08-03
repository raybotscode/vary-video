import {describe, expect, it} from 'vitest';
import {
  blockCapabilitiesToFrontend,
  templateCapabilitiesToFrontend,
} from './capabilityAdapters';
import {blockCapabilities} from '@vary/shared/capabilities/blocks';
import {templateCapabilities} from '@vary/shared/capabilities/templates';

describe('capabilityAdapters', () => {
  it('maps templates to the existing dashboard shape', () => {
    const mapped = templateCapabilitiesToFrontend(templateCapabilities);
    expect(mapped).toHaveLength(5);
    const realEstate = mapped.find((template) => template.id === 'RealEstate');
    expect(realEstate).toBeDefined();
    if (!realEstate) {
      throw new Error('RealEstate template missing from mapped output');
    }
    expect(realEstate.placeholders).toContain('property_name');
    expect(realEstate.blockSequence).toEqual([
      'property-hero',
      'property-details',
      'agent-cta',
      'brand-frame',
    ]);
    expect(realEstate.copyFields?.length).toBeGreaterThan(0);
    expect(realEstate.defaults).toMatchObject({brandColor: '#1A365D'});
  });
  it('maps blocks to the composer shape', () => {
    const mapped = blockCapabilitiesToFrontend(blockCapabilities);
    expect(mapped).toHaveLength(13);
    const hero = mapped.find((block) => block.id === 'property-hero');
    expect(hero).toBeDefined();
    expect(hero!.defaultDurationFrames).toBe(150);
    expect(hero!.defaultContent).toHaveProperty('priceTemplate');
    expect(hero!.needsBrandSettings).toBe(true);
    expect(hero!.compatibleSchemas).toContain('RealEstate');
  });

  it('produces default content placeholders for every content field', () => {
    const mapped = blockCapabilitiesToFrontend(blockCapabilities);
    for (const block of mapped) {
      const original = blockCapabilities.find((candidate) => candidate.id === block.id)!;
      for (const field of original.contentFields) {
        expect(block.defaultContent).toHaveProperty(field.key);
      }
    }
  });
});
