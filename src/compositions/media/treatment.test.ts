import {describe, expect, it} from 'vitest';
import {
  toObjectFit,
  toObjectPosition,
  buildImageStyles,
  buildOverlayStyles,
  buildBlurFilter,
  buildFallbackStyles,
} from './treatment';

describe('toObjectFit', () => {
  it('maps cover to cover', () => expect(toObjectFit('cover')).toBe('cover'));
  it('maps contain to contain', () => expect(toObjectFit('contain')).toBe('contain'));
  it('maps fit-width to none', () => expect(toObjectFit('fit-width')).toBe('none'));
  it('maps fit-height to none', () => expect(toObjectFit('fit-height')).toBe('none'));
});

describe('toObjectPosition', () => {
  it('defaults to center center', () => expect(toObjectPosition()).toBe('50% 50%'));
  it('maps left top', () => expect(toObjectPosition('left', 'top')).toBe('0% 0%'));
  it('maps right bottom', () => expect(toObjectPosition('right', 'bottom')).toBe('100% 100%'));
  it('maps center center', () => expect(toObjectPosition('center', 'center')).toBe('50% 50%'));
});

describe('buildImageStyles', () => {
  it('returns cover styles by default', () => {
    const styles = buildImageStyles({fit: 'cover'}, 1920, 1080);
    expect(styles.objectFit).toBe('cover');
    expect(styles.width).toBe('100%');
    expect(styles.height).toBe('100%');
  });

  it('applies focal point', () => {
    const styles = buildImageStyles(
      {fit: 'cover', focalPoint: {x: 0.3, y: 0.7}},
      1920,
      1080,
    );
    expect(styles.objectPosition).toBe('30% 70%');
  });

  it('applies horizontal and vertical position', () => {
    const styles = buildImageStyles(
      {fit: 'cover', horizontalPosition: 'left', verticalPosition: 'top'},
      1920,
      1080,
    );
    expect(styles.objectPosition).toBe('0% 0%');
  });

  it('handles fit-width', () => {
    const styles = buildImageStyles({fit: 'fit-width'}, 1920, 1080);
    expect(styles.width).toBe('100%');
    expect(styles.height).toBe('auto');
  });

  it('handles fit-height', () => {
    const styles = buildImageStyles({fit: 'fit-height'}, 1920, 1080);
    expect(styles.width).toBe('auto');
    expect(styles.height).toBe('100%');
  });
});

describe('buildOverlayStyles', () => {
  it('returns positioned overlay', () => {
    const styles = buildOverlayStyles({fit: 'cover'});
    expect(styles.position).toBe('absolute');
    expect(styles.pointerEvents).toBe('none');
  });

  it('applies dark overlay', () => {
    const styles = buildOverlayStyles({fit: 'cover', darkOverlay: 0.5});
    expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('applies gradient overlay', () => {
    const styles = buildOverlayStyles({
      fit: 'cover',
      gradientOverlay: {
        enabled: true,
        from: '#000000',
        to: '#FFFFFF',
        direction: 'to-bottom',
        opacity: 0.8,
      },
    });
    expect(styles.background).toContain('linear-gradient');
    expect(styles.opacity).toBe(0.8);
  });
});

describe('buildBlurFilter', () => {
  it('returns undefined for no blur', () => {
    expect(buildBlurFilter({fit: 'cover'})).toBeUndefined();
  });

  it('returns blur filter', () => {
    expect(buildBlurFilter({fit: 'cover', blur: 10})).toBe('blur(10px)');
  });

  it('returns undefined for zero blur', () => {
    expect(buildBlurFilter({fit: 'cover', blur: 0})).toBeUndefined();
  });
});

describe('buildFallbackStyles', () => {
  it('returns fallback with default color', () => {
    const styles = buildFallbackStyles();
    expect(styles.backgroundColor).toBe('#E2E8F0');
  });

  it('returns fallback with custom color', () => {
    const styles = buildFallbackStyles('#FF0000');
    expect(styles.backgroundColor).toBe('#FF0000');
  });
});
