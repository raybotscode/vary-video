import {describe, it, expect} from 'vitest';
import {
  calculateStageRect,
  screenToNormalized,
  normalizedToScreen,
  normalizedSizeToScreen,
  screenDeltaToNormalized,
} from './coordinates';
import {HistoryManager} from './state';

describe('Coordinate Conversion', () => {
  const stageRect = calculateStageRect(1920, 1080, '16:9');

  it('calculates stage rect for 16:9 in 16:9 container', () => {
    expect(stageRect.stageWidth).toBe(1920);
    expect(stageRect.stageHeight).toBe(1080);
    expect(stageRect.stageLeft).toBe(0);
    expect(stageRect.stageTop).toBe(0);
    expect(stageRect.scale).toBe(1);
  });

  it('calculates stage rect for 16:9 in wider container', () => {
    const rect = calculateStageRect(2560, 1080, '16:9');
    // Should fit by height
    expect(rect.stageHeight).toBe(1080);
    expect(rect.stageWidth).toBe(1920);
    expect(rect.stageLeft).toBe(320); // (2560-1920)/2
    expect(rect.stageTop).toBe(0);
  });

  it('calculates stage rect for 16:9 in taller container', () => {
    const rect = calculateStageRect(1920, 1440, '16:9');
    // Should fit by width
    expect(rect.stageWidth).toBe(1920);
    expect(rect.stageHeight).toBe(1080);
    expect(rect.stageLeft).toBe(0);
    expect(rect.stageTop).toBe(180); // (1440-1080)/2
  });

  it('calculates stage rect for 9:16', () => {
    const rect = calculateStageRect(1920, 1080, '9:16');
    // 9:16 = 0.5625 aspect, container = 1.778 aspect
    // Should fit by height
    expect(rect.stageHeight).toBe(1080);
    expect(rect.stageWidth).toBeCloseTo(607.5, 0);
  });

  it('calculates stage rect for 1:1', () => {
    const rect = calculateStageRect(1920, 1080, '1:1');
    // 1:1 = 1.0 aspect, container = 1.778 aspect
    // Should fit by height
    expect(rect.stageHeight).toBe(1080);
    expect(rect.stageWidth).toBe(1080);
  });

  it('converts screen to normalized coordinates', () => {
    // Center of stage
    const center = screenToNormalized(960, 540, stageRect);
    expect(center.x).toBeCloseTo(0.5, 2);
    expect(center.y).toBeCloseTo(0.5, 2);

    // Top-left
    const topLeft = screenToNormalized(0, 0, stageRect);
    expect(topLeft.x).toBeCloseTo(0, 2);
    expect(topLeft.y).toBeCloseTo(0, 2);

    // Bottom-right
    const bottomRight = screenToNormalized(1920, 1080, stageRect);
    expect(bottomRight.x).toBeCloseTo(1, 2);
    expect(bottomRight.y).toBeCloseTo(1, 2);
  });

  it('converts normalized to screen coordinates', () => {
    const center = normalizedToScreen(0.5, 0.5, stageRect);
    expect(center.x).toBeCloseTo(960, 0);
    expect(center.y).toBeCloseTo(540, 0);
  });

  it('round-trips screen → normalized → screen', () => {
    const original = {x: 1234, y: 567};
    const normalized = screenToNormalized(original.x, original.y, stageRect);
    const back = normalizedToScreen(normalized.x, normalized.y, stageRect);
    expect(back.x).toBeCloseTo(original.x, 0);
    expect(back.y).toBeCloseTo(original.y, 0);
  });

  it('converts normalized size to screen pixels', () => {
    const size = normalizedSizeToScreen(0.5, 0.3, stageRect);
    expect(size.width).toBeCloseTo(960, 0);
    expect(size.height).toBeCloseTo(324, 0);
  });

  it('converts screen delta to normalized delta', () => {
    const delta = screenDeltaToNormalized(192, 108, stageRect);
    expect(delta.dx).toBeCloseTo(0.1, 2);
    expect(delta.dy).toBeCloseTo(0.1, 2);
  });

  it('clamps screen to normalized to 0-1', () => {
    const outside = screenToNormalized(-100, 2000, stageRect);
    expect(outside.x).toBe(0);
    expect(outside.y).toBe(1);
  });
});

describe('History Manager', () => {
  const makeDoc = (name: string) => ({
    schemaVersion: 3 as const,
    id: 'test',
    name,
    description: '',
    fps: 30,
    defaultAspectRatio: '16:9' as const,
    supportedAspectRatios: ['16:9' as const],
    scenes: [{
      id: 'scene-1',
      name: 'Scene 1',
      durationFrames: 90,
      background: {type: 'solid' as const, color: '#000000'},
      elements: [],
    }],
    mergeTags: [],
    metadata: {},
  });

  it('pushes and retrieves current document', () => {
    const history = new HistoryManager();
    const doc = makeDoc('v1');
    history.push(doc, 'initial');
    expect(history.current()?.name).toBe('v1');
  });

  it('undoes to previous document', () => {
    const history = new HistoryManager();
    history.push(makeDoc('v1'), 'v1');
    history.push(makeDoc('v2'), 'v2');
    expect(history.canUndo()).toBe(true);
    const prev = history.undo();
    expect(prev?.name).toBe('v1');
  });

  it('redoes after undo', () => {
    const history = new HistoryManager();
    history.push(makeDoc('v1'), 'v1');
    history.push(makeDoc('v2'), 'v2');
    history.undo();
    expect(history.canRedo()).toBe(true);
    const next = history.redo();
    expect(next?.name).toBe('v2');
  });

  it('returns null when cannot undo', () => {
    const history = new HistoryManager();
    history.push(makeDoc('v1'), 'v1');
    expect(history.canUndo()).toBe(false);
    expect(history.undo()).toBeNull();
  });

  it('returns null when cannot redo', () => {
    const history = new HistoryManager();
    history.push(makeDoc('v1'), 'v1');
    expect(history.canRedo()).toBe(false);
    expect(history.redo()).toBeNull();
  });

  it('branches history on push after undo', () => {
    const history = new HistoryManager();
    history.push(makeDoc('v1'), 'v1');
    history.push(makeDoc('v2'), 'v2');
    history.undo();
    history.push(makeDoc('v3'), 'v3');
    // v2 should be gone
    expect(history.canRedo()).toBe(false);
    expect(history.current()?.name).toBe('v3');
  });

  it('limits history to MAX_HISTORY', () => {
    const history = new HistoryManager();
    for (let i = 0; i < 60; i++) {
      history.push(makeDoc(`v${i}`), `v${i}`);
    }
    // Should have trimmed to 50 entries
    // Current is v59, undo goes to v58
    const prev = history.undo();
    expect(prev?.name).toBe('v58');
    // Can undo 49 more times
    for (let i = 0; i < 48; i++) {
      history.undo();
    }
    // Now at v10 (the first kept entry)
    expect(history.current()?.name).toBe('v10');
    expect(history.canUndo()).toBe(false);
  });

  it('returns deep copies (no mutation)', () => {
    const history = new HistoryManager();
    const doc = makeDoc('v1');
    history.push(doc, 'v1');
    const retrieved = history.current()!;
    retrieved.name = 'mutated';
    expect(history.current()?.name).toBe('v1');
  });

  it('clears history', () => {
    const history = new HistoryManager();
    history.push(makeDoc('v1'), 'v1');
    history.push(makeDoc('v2'), 'v2');
    history.clear();
    expect(history.current()).toBeNull();
    expect(history.canUndo()).toBe(false);
  });
});
