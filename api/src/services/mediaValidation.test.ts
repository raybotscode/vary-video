import {describe, expect, it} from 'vitest';
import {validateUrlLocally} from './mediaValidation';

describe('validateUrlLocally', () => {
  it('passes for valid HTTPS URLs', () => {
    const errors = validateUrlLocally('https://example.com/image.png');
    expect(errors).toHaveLength(0);
  });

  it('passes for valid HTTP URLs', () => {
    const errors = validateUrlLocally('http://example.com/image.png');
    expect(errors).toHaveLength(0);
  });

  it('fails for invalid URL format', () => {
    const errors = validateUrlLocally('not-a-url');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL');
  });

  it('fails for FTP scheme', () => {
    const errors = validateUrlLocally('ftp://example.com/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL scheme');
  });

  it('fails for file scheme', () => {
    const errors = validateUrlLocally('file:///etc/passwd');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid URL scheme');
  });

  it('fails for localhost', () => {
    const errors = validateUrlLocally('http://localhost:3000/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('localhost');
  });

  it('fails for 127.0.0.1', () => {
    const errors = validateUrlLocally('http://127.0.0.1:3000/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 10.x.x.x private range', () => {
    const errors = validateUrlLocally('http://10.0.0.1/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 172.16.x.x private range', () => {
    const errors = validateUrlLocally('http://172.16.0.1/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 192.168.x.x private range', () => {
    const errors = validateUrlLocally('http://192.168.1.1/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for 169.254.x.x link-local', () => {
    const errors = validateUrlLocally('http://169.254.169.254/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('fails for IPv6 loopback', () => {
    const errors = validateUrlLocally('http://[::1]/image.png');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Private/internal');
  });

  it('passes for public IPs', () => {
    const errors = validateUrlLocally('http://8.8.8.8/image.png');
    expect(errors).toHaveLength(0);
  });

  it('passes for cloudfront URLs', () => {
    const errors = validateUrlLocally('https://d1234.cloudfront.net/image.png');
    expect(errors).toHaveLength(0);
  });

  it('passes for S3 URLs', () => {
    const errors = validateUrlLocally('https://bucket.s3.amazonaws.com/image.png');
    expect(errors).toHaveLength(0);
  });
});
