import {Router} from 'express';
import {animationsRouter} from './animations';
import {audioRouter} from '../audio';
import {blocksRouter} from './blocks';
import {capabilitiesRouter} from './capabilities';
import {mediaRouter} from './media';
import {stylesRouter} from './styles';
import {templatesRouter} from './templates';

/**
 * /api/v1 — versioned commercial API surface.
 * All capability access goes through the shared registry (src/shared/capabilities),
 * so the UI, API, and future MCP server stay consistent.
 */
export const v1Router = Router();

v1Router.use('/capabilities', capabilitiesRouter);
v1Router.use('/templates', templatesRouter);
v1Router.use('/blocks', blocksRouter);
v1Router.use('/styles', stylesRouter);
v1Router.use('/animations', animationsRouter);
v1Router.use('/media', mediaRouter);
v1Router.use('/audio', audioRouter);
