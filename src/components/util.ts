export type VariantData = Record<string, string>;

export const resolvePlaceholders = (
  text: string,
  data: VariantData,
): string => {
  return text.replace(/\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    return data[key] ?? '';
  });
};

export const mulberry32 = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export const hashSeed = (input: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export const safeHexColor = (value: string, fallback: string): string => {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
};
