import {describe, expect, it} from 'vitest';
import {stableStringify} from './stableStringify';
import {hashRegistry, sha256Hex} from './hash';

describe('stableStringify', () => {
  it('is deterministic independent of object key order', () => {
    const a = stableStringify({b: 1, a: [2, {d: 4, c: 3}]});
    const b = stableStringify({a: [2, {c: 3, d: 4}], b: 1});
    expect(a).toBe(b);
  });

  it('handles primitives, arrays, null', () => {
    expect(stableStringify(null)).toBe('null');
    expect(stableStringify('x')).toBe('"x"');
    expect(stableStringify([1, 2])).toBe('[1,2]');
  });
});

describe('sha256Hex / hashRegistry', () => {
  it('produces a 64-char hex digest', () => {
    expect(sha256Hex('hello')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hash is stable regardless of key order', () => {
    expect(hashRegistry({b: 2, a: 1})).toBe(hashRegistry({a: 1, b: 2}));
  });
});
