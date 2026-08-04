import express from 'express';
import request from 'supertest';
import {describe, it, expect, beforeEach} from 'vitest';
import {v1Router} from './index';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', v1Router);
  return app;
};

const sampleTemplate = {
  name: 'My SaaS Launch',
  description: 'Blue theme product launch',
  category: 'product',
  spec: {
    blocks: [
      {blockId: 'product-intro', content: {headlineTemplate: 'Hello'}},
    ],
    brandSettings: {brandColor: '#1A365D'},
  },
  sourcePrompt: 'Make a SaaS launch video',
  sourceMode: 'composed',
  baseTemplateId: null,
  isPublic: false,
  tags: ['saas', 'launch'],
};

describe('User Templates API', () => {
  describe('POST /api/v1/user-templates', () => {
    it('creates a template and returns 201', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/v1/user-templates')
        .send(sampleTemplate)
        .expect(201);

      expect(res.body.template).toMatchObject({
        name: 'My SaaS Launch',
        description: 'Blue theme product launch',
        category: 'product',
        sourceMode: 'composed',
        isPublic: false,
        useCount: 0,
        tags: ['saas', 'launch'],
      });
      expect(res.body.template.id).toMatch(/^utpl-/);
      expect(res.body.template.spec).toEqual(sampleTemplate.spec);
      expect(res.body.template.createdAt).toBeDefined();
    });

    it('rejects missing name', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/v1/user-templates')
        .send({...sampleTemplate, name: ''})
        .expect(400);

      expect(res.body.error).toBe('Invalid template data');
    });

    it('rejects name over 200 chars', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/v1/user-templates')
        .send({...sampleTemplate, name: 'x'.repeat(201)})
        .expect(400);

      expect(res.body.error).toBe('Invalid template data');
    });

    it('uses defaults for optional fields', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/v1/user-templates')
        .send({name: 'Minimal', spec: {blocks: []}})
        .expect(201);

      expect(res.body.template).toMatchObject({
        name: 'Minimal',
        description: '',
        category: 'product',
        sourceMode: 'manual',
        isPublic: false,
        tags: [],
      });
    });
  });

  describe('GET /api/v1/user-templates', () => {
    it('lists all templates', async () => {
      const app = buildApp();

      await request(app).post('/api/v1/user-templates').send({
        ...sampleTemplate,
        name: 'Public Template',
        isPublic: true,
      });
      await request(app).post('/api/v1/user-templates').send({
        ...sampleTemplate,
        name: 'Private Template',
        isPublic: false,
      });

      const res = await request(app)
        .get('/api/v1/user-templates')
        .expect(200);

      expect(res.body.templates.length).toBeGreaterThanOrEqual(2);
      expect(res.body.total).toBeGreaterThanOrEqual(2);
    });

    it('filters by scope=public', async () => {
      const app = buildApp();

      await request(app).post('/api/v1/user-templates').send({
        ...sampleTemplate,
        name: 'Public Only',
        isPublic: true,
      });

      const res = await request(app)
        .get('/api/v1/user-templates?scope=public')
        .expect(200);

      expect(res.body.templates.every((t: {isPublic: boolean}) => t.isPublic)).toBe(true);
    });

    it('filters by category', async () => {
      const app = buildApp();

      await request(app).post('/api/v1/user-templates').send(sampleTemplate);

      const res = await request(app)
        .get('/api/v1/user-templates?category=product')
        .expect(200);

      expect(res.body.templates.every((t: {category: string}) => t.category === 'product')).toBe(true);
    });
  });

  describe('GET /api/v1/user-templates/:id', () => {
    it('returns a template by ID', async () => {
      const app = buildApp();

      const createRes = await request(app)
        .post('/api/v1/user-templates')
        .send(sampleTemplate);

      const id = createRes.body.template.id;
      const res = await request(app)
        .get(`/api/v1/user-templates/${id}`)
        .expect(200);

      expect(res.body.template.id).toBe(id);
      expect(res.body.template.name).toBe('My SaaS Launch');
    });

    it('returns 404 for unknown ID', async () => {
      const app = buildApp();
      await request(app)
        .get('/api/v1/user-templates/nonexistent')
        .expect(404);
    });
  });

  describe('PUT /api/v1/user-templates/:id', () => {
    it('updates a template', async () => {
      const app = buildApp();

      const createRes = await request(app)
        .post('/api/v1/user-templates')
        .send(sampleTemplate);

      const id = createRes.body.template.id;
      const res = await request(app)
        .put(`/api/v1/user-templates/${id}`)
        .send({name: 'Updated Name', isPublic: true})
        .expect(200);

      expect(res.body.template.name).toBe('Updated Name');
      expect(res.body.template.isPublic).toBe(true);
    });

    it('returns 404 for unknown ID', async () => {
      const app = buildApp();
      await request(app)
        .put('/api/v1/user-templates/nonexistent')
        .send({name: 'Nope'})
        .expect(404);
    });
  });

  describe('PATCH /api/v1/user-templates/:id/publish', () => {
    it('toggles is_public', async () => {
      const app = buildApp();

      const createRes = await request(app)
        .post('/api/v1/user-templates')
        .send({...sampleTemplate, isPublic: false});

      const id = createRes.body.template.id;

      // Toggle to public
      const res1 = await request(app)
        .patch(`/api/v1/user-templates/${id}/publish`)
        .expect(200);

      expect(res1.body.isPublic).toBe(true);

      // Toggle back to private
      const res2 = await request(app)
        .patch(`/api/v1/user-templates/${id}/publish`)
        .expect(200);

      expect(res2.body.isPublic).toBe(false);
    });
  });

  describe('PATCH /api/v1/user-templates/:id/use', () => {
    it('increments use_count', async () => {
      const app = buildApp();

      const createRes = await request(app)
        .post('/api/v1/user-templates')
        .send(sampleTemplate);

      const id = createRes.body.template.id;

      const res1 = await request(app)
        .patch(`/api/v1/user-templates/${id}/use`)
        .expect(200);

      expect(res1.body.useCount).toBe(1);

      const res2 = await request(app)
        .patch(`/api/v1/user-templates/${id}/use`)
        .expect(200);

      expect(res2.body.useCount).toBe(2);
    });
  });

  describe('DELETE /api/v1/user-templates/:id', () => {
    it('deletes a template', async () => {
      const app = buildApp();

      const createRes = await request(app)
        .post('/api/v1/user-templates')
        .send(sampleTemplate);

      const id = createRes.body.template.id;

      await request(app)
        .delete(`/api/v1/user-templates/${id}`)
        .expect(204);

      await request(app)
        .get(`/api/v1/user-templates/${id}`)
        .expect(404);
    });

    it('returns 404 for unknown ID', async () => {
      const app = buildApp();
      await request(app)
        .delete('/api/v1/user-templates/nonexistent')
        .expect(404);
    });
  });
});
