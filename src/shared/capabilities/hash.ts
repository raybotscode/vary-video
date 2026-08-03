/**
 * Node-only SHA-256 hashing for capability registries.
 *
 * Do NOT import this module from web bundles — it requires `node:crypto`.
 * The frontend consumes the precomputed `version.hash` from API responses.
 */
import {createHash} from 'node:crypto';
import {stableStringify} from './stableStringify';

export const sha256Hex = (input: string): string =>
  createHash('sha256').update(input, 'utf8').digest('hex');

export const hashRegistry = (registry: unknown): string =>
  sha256Hex(stableStringify(registry));
