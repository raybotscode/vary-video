import {Router} from 'express';
import {animationsRouter} from './animations';
import {audioRouter} from '../audio';
import {blocksRouter} from './blocks';
import {capabilitiesRouter} from './capabilities';
import {generateTemplateRouter} from './generate-template';
import {mediaRouter} from './media';
import {rendersRouter} from './renders';
import {stylesRouter} from './styles';
import {templatesRouter} from './templates';
import {previewRouter} from './preview';
import {getUsageSummary} from '../../services/aiCostTracker';

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
v1Router.use('/renders', rendersRouter);
v1Router.use('/preview', previewRouter);
v1Router.use('/generate-template', generateTemplateRouter);

/** GET /api/v1/ai-usage — AI generation cost tracking summary */
v1Router.get('/ai-usage', (_req, res) => {
  try {
    const summary = getUsageSummary();
    res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch usage';
    res.status(500).json({error: message});
  }
});
