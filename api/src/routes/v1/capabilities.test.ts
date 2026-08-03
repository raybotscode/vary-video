import express from 'express';
import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {v1Router} from './index';

const buildApp = () => {
  const app = express();
  app.use('/api/v1', v1Router);
  return app;
};

describe('GET /api/v1/capabilities', () => {
  it('returns a version, five templates, twelve blocks, and a compact summary', async () => {
    const res = await request(buildApp()).get('/api/v1/capabilities');

    expect(res.status).toBe(200);
    expect(res.body.version.hash).toBeTruthy();
    expect(res.body.templates).toHaveLength(5);
    expect(res.body.blocks).toHaveLength(13);
    expect(res.body.animations.length).toBe(9);
    expect(res.body.animations.map((a: {id: string}) => a.id)).toContain('fade-in');
    expect(res.body.compactSummary.templates).toHaveLength(5);
    expect(res.body.compactSummary.version).toBe(res.body.version.hash);
  });
});

describe('GET /api/v1/templates', () => {
  it('lists enabled templates', async () => {
    const res = await request(buildApp()).get('/api/v1/templates');
    expect(res.status).toBe(200);
    expect(res.body.templates.map((t: {id: string}) => t.id)).toContain('RealEstate');
  });

  it('returns a single template by id', async () => {
    const res = await request(buildApp()).get('/api/v1/templates/RealEstate');
    expect(res.status).toBe(200);
    expect(res.body.template.name).toBe('Real Estate');
    expect(res.body.template.requiredPlaceholders).toContain('property_name');
  });

  it('returns 404 for unknown template id', async () => {
    const res = await request(buildApp()).get('/api/v1/templates/NotATemplate');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/blocks', () => {
  it('lists enabled blocks and excludes disabled ones', async () => {
    const res = await request(buildApp()).get('/api/v1/blocks');
    expect(res.status).toBe(200);
    const ids = res.body.blocks.map((b: {id: string}) => b.id);
    expect(ids).toContain('property-hero');
    // All Phase 2 blocks are enabled; disabled animation presets live under /animations.
    expect(ids).toHaveLength(13);
  });

  it('returns a single block by id', async () => {
    const res = await request(buildApp()).get('/api/v1/blocks/property-hero');
    expect(res.status).toBe(200);
    expect(res.body.block.name).toBe('Property Hero');
  });

  it('returns 404 for unknown block id', async () => {
    const res = await request(buildApp()).get('/api/v1/blocks/not-a-block');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/styles and /api/v1/animations', () => {
  it('returns style presets', async () => {
    const res = await request(buildApp()).get('/api/v1/styles');
    expect(res.status).toBe(200);
    expect(res.body.styles.map((s: {id: string}) => s.id)).toContain('clean-brand');
  });

  it('returns all enabled animation presets (Phase 4)', async () => {
    const res = await request(buildApp()).get('/api/v1/animations');
    expect(res.status).toBe(200);
    expect(res.body.animations.length).toBe(9);
    expect(res.body.animations.map((a: {id: string}) => a.id)).toContain('fade-in');
    expect(res.body.animations.map((a: {id: string}) => a.id)).toContain('bounce-in');
  });
});
