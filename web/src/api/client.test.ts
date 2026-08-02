import {describe, expect, it} from 'vitest';
import {resolveApiPath} from './client';

describe('resolveApiPath', () => {
  it('passes absolute http(s) URLs through unchanged', () => {
    expect(resolveApiPath('https://cdn.example.com/file.mp4', '/api')).toBe(
      'https://cdn.example.com/file.mp4',
    );
  });

  it('joins /render/... paths onto the default /api base', () => {
    expect(resolveApiPath('/render/download/job-1/0', '/api')).toBe(
      '/api/render/download/job-1/0',
    );
  });

  it('does not double-prefix /api/... paths with the default base', () => {
    expect(resolveApiPath('/api/render/download/job-1/0', '/api')).toBe(
      '/api/render/download/job-1/0',
    );
  });

  it('does not double-prefix /api/... paths with a tunnel base ending in /api', () => {
    expect(resolveApiPath('/api/render/download/job-1/0', 'https://api.example.com/api')).toBe(
      'https://api.example.com/api/render/download/job-1/0',
    );
  });

  it('joins /render/... paths onto a tunnel origin without /api', () => {
    expect(resolveApiPath('/render/download/job-1/0', 'https://api.example.com')).toBe(
      'https://api.example.com/render/download/job-1/0',
    );
  });

  it('joins /api/... paths onto a tunnel origin without /api', () => {
    expect(resolveApiPath('/api/render/download/job-1/0', 'https://api.example.com')).toBe(
      'https://api.example.com/api/render/download/job-1/0',
    );
  });

  it('strips trailing slashes from the base', () => {
    expect(resolveApiPath('/render/download/job-1/0', '/api/')).toBe(
      '/api/render/download/job-1/0',
    );
  });
});
