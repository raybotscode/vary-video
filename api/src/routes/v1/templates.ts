import {Router} from 'express';
import {getEnabledTemplates} from '../../../../src/shared/capabilities/registry';
import {templateCapabilityById} from '../../../../src/shared/capabilities/templates';

export const templatesRouter = Router();

/** GET /api/v1/templates — enabled templates. */
templatesRouter.get('/', (_req, res) => {
  res.json({templates: getEnabledTemplates()});
});

/** GET /api/v1/templates/:id — one template, or 404. */
templatesRouter.get('/:id', (req, res) => {
  const template = templateCapabilityById(req.params.id);
  if (!template) {
    res.status(404).json({error: `Unknown template: ${req.params.id}`});
    return;
  }
  res.json({template});
});
