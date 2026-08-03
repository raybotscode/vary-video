import {Router} from 'express';
import {getEnabledAnimationPresets} from '../../../../src/shared/capabilities/animations';
import {animationPresetById} from '../../../../src/shared/capabilities/animations';

export const animationsRouter = Router();

/** GET /api/v1/animations — enabled animation presets (metadata only in Phase 2). */
animationsRouter.get('/', (_req, res) => {
  res.json({animations: getEnabledAnimationPresets()});
});

/** GET /api/v1/animations/:id — one preset, or 404. */
animationsRouter.get('/:id', (req, res) => {
  const animation = animationPresetById(req.params.id);
  if (!animation) {
    res.status(404).json({error: `Unknown animation: ${req.params.id}`});
    return;
  }
  res.json({animation});
});
