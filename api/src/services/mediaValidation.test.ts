import dns from 'node:dns/promises';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {validateMediaUrlRemote, validateUrlLocally} from './mediaValidation';

describe('validateUrlLocally', () => {
  beforeEach(() => {
    vi.spyOn(dns, 'lookup').mockImplementation(async (hostname) => {
      const address = hostname === 'evil.example.com' ? '127.0.0.1' : '93.184.216.34';
      return [{address, family: 4}] as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes for valid HTTPS URLs', async () => {
    const errors = await validateUrlLocally('https://example.com/image.png');
    expect(errors).toHaveLength(0);
  });

  it('passes for valid HTTP URLs', async () => {
    const errors = await validateUrlLocally('http://example.com/image.png');
    expect(errors).toHaveLength(0);
  });

  it('fails for invalid URL format', async () => {
    const errors = await validateUrlLocally('not-a-url');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL');
  });

  it('fails for FTP scheme', async () => {
    const errors = await validateUrlLocally('ftp://example.com/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL scheme');
  });

  it('fails for file scheme', async () => {
    const errors = await validateUrlLocally('file:///etc/passwd');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL scheme');
  });

  it('fails for localhost', async () => {
    const errors = await validateUrlLocally('http://localhost:3000/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('localhost');
  });

  it('fails for 127.0.0.1', async () => {
    const errors = await validateUrlLocally('http://127.0.0.1:3000/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 10.x.x.x private range', async () => {
    const errors = await validateUrlLocally('http://10.0.0.1/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 172.16.x.x private range', async () => {
    const errors = await validateUrlLocally('http://172.16.0.1/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 192.168.x.x private range', async () => {
    const errors = await validateUrlLocally('http://192.168.1.1/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 169.254.x.x link-local', async () => {
    const errors = await validateUrlLocally('http://169.254.169.254/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for IPv6 loopback', async () => {
    const errors = await validateUrlLocally('http://[::1]/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for hostnames resolving to private IPs', async () => {
    const errors = await validateUrlLocally('https://evil.example.com/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('resolves to a private/internal address');
  });

  it('passes for public IPs', async () => {
    const errors = await validateUrlLocally('http://8.8.8.8/image.png');
    expect(errors).toHaveLength(0);
  });

  it('passes for cloudfront URLs', async () => {
    const errors = await validateUrlLocally('https://d1234.cloudfront.net/image.png');
    expect(errors).toHaveLength(0);
  });

  it('passes for S3 URLs', async () => {
    const errors = await validateUrlLocally('https://bucket.s3.amazonaws.com/image.png');
    expect(errors).toHaveLength(0);
  });
});

describe('validateMediaUrlRemote redirects', () => {
  beforeEach(() => {
    vi.spyOn(dns, 'lookup').mockResolvedValue([{address: '93.184.216.34', family: 4}] as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects redirects to private targets before requesting the target', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: {location: 'http://127.0.0.1/private.png'},
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await validateMediaUrlRemote('https://example.com/image.png');

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Private/internal');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
