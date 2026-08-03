import {Router} from 'express';
import {getEnabledStylePresets} from '../../../../src/shared/capabilities/styles';
import {stylePresetById} from '../../../../src/shared/capabilities/styles';

export const stylesRouter = Router();

/** GET /api/v1/styles — enabled style presets (metadata only in Phase 2). */
stylesRouter.get('/', (_req, res) => {
  res.json({styles: getEnabledStylePresets()});
});

/** GET /api/v1/styles/:id — one style preset, or 404. */
stylesRouter.get('/:id', (req, res) => {
  const style = stylePresetById(req.params.id);
  if (!style) {
    res.status(404).json({error: `Unknown style: ${req.params.id}`});
    return;
  }
  res.json({style});
});
