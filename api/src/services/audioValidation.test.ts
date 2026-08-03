import {describe, expect, it} from 'vitest';
import {sanitizeFilename, validateAudioFile} from './audioValidation';

describe('sanitizeFilename', () => {
  it('removes path separators via basename', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
  });

  it('collapses whitespace', () => {
    expect(sanitizeFilename('my   song  name.mp3')).toBe('my_song_name.mp3');
  });

  it('removes special characters', () => {
    expect(sanitizeFilename("rock & roll (live).mp3")).toBe('rock__roll_live.mp3');
  });

  it('preserves extension', () => {
    expect(sanitizeFilename('track.mp3')).toBe('track.mp3');
  });

  it('truncates to 200 chars', () => {
    const long = 'a'.repeat(300) + '.mp3';
    expect(sanitizeFilename(long).length).toBeLessThanOrEqual(200);
  });

  it('strips control characters', () => {
    expect(sanitizeFilename('track\x00name.mp3')).toBe('trackname.mp3');
  });
});

describe('validateAudioFile', () => {
  it('accepts a valid mp3 file', () => {
    const result = validateAudioFile({
      filename: 'music.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 1024 * 1024,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects unsupported extension', () => {
    const result = validateAudioFile({
      filename: 'music.flac',
      mimeType: 'audio/flac',
      sizeBytes: 1024 * 1024,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects unsupported mime type', () => {
    const result = validateAudioFile({
      filename: 'music.mp3',
      mimeType: 'application/octet-stream',
      sizeBytes: 1024 * 1024,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects files over 20MB', () => {
    const result = validateAudioFile({
      filename: 'music.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 25 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
  });
});
