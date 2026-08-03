import {describe, expect, it, beforeAll, afterAll} from 'vitest';
import request from 'supertest';
import express from 'express';
import {mediaRouter} from './media';

const app = express();
app.use(express.json());
app.use('/api/v1/media', mediaRouter);

describe('POST /api/v1/media/validate', () => {
  it('rejects invalid URL format', async () => {
    const res = await request(app)
      .post('/api/v1/media/validate')
      .send({url: 'not-a-url'});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request');
  });

  it('rejects localhost URLs without remote check', async () => {
    const res = await request(app)
      .post('/api/v1/media/validate')
      .send({url: 'http://localhost:3000/image.png'});
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.errors[0]).toContain('localhost');
  });

  it('rejects private IP URLs without remote check', async () => {
    const res = await request(app)
      .post('/api/v1/media/validate')
      .send({url: 'http://192.168.1.1/image.png'});
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.errors[0]).toContain('Private/internal');
  });

  it('rejects FTP scheme', async () => {
    const res = await request(app)
      .post('/api/v1/media/validate')
      .send({url: 'ftp://example.com/image.png'});
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
    expect(res.body.errors[0]).toContain('Invalid URL scheme');
  });
});

describe('POST /api/v1/media/validate-batch', () => {
  it('rejects empty array', async () => {
    const res = await request(app)
      .post('/api/v1/media/validate-batch')
      .send({urls: []});
    expect(res.status).toBe(400);
  });

  it('validates multiple URLs', async () => {
    const res = await request(app)
      .post('/api/v1/media/validate-batch')
      .send({
        urls: [
          'http://localhost:3000/image.png',
          'http://192.168.1.1/image.png',
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(2);
    expect(res.body.results[0].valid).toBe(false);
    expect(res.body.results[1].valid).toBe(false);
    expect(res.body.summary.total).toBe(2);
    expect(res.body.summary.valid).toBe(0);
    expect(res.body.summary.invalid).toBe(2);
  });
});

describe('GET /api/v1/media/accepted-types', () => {
  it('returns accepted MIME types and max size', async () => {
    const res = await request(app)
      .get('/api/v1/media/accepted-types');
    expect(res.status).toBe(200);
    expect(res.body.mimeTypes).toContain('image/jpeg');
    expect(res.body.mimeTypes).toContain('image/png');
    expect(res.body.maxMB).toBe(10);
  });
});
