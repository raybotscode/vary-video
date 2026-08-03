import {Router} from 'express';
import {
  getCapabilityRegistry,
  getCompactCapabilitySummary,
} from '../../../../src/shared/capabilities/registry';

export const capabilitiesRouter = Router();

/**
 * GET /api/v1/capabilities
 * Full machine-readable capability registry — the canonical source AI tools
 * and the frontend should query. Includes version hash + compact summary.
 */
capabilitiesRouter.get('/', (_req, res) => {
  const registry = getCapabilityRegistry();
  res.json({
    ...registry,
    compactSummary: getCompactCapabilitySummary(),
  });
});
