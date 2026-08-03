import {Router} from 'express';
import {getEnabledBlocks} from '../../../../src/shared/capabilities/registry';
import {blockCapabilityById} from '../../../../src/shared/capabilities/blocks';

export const blocksRouter = Router();

/** GET /api/v1/blocks — enabled blocks. */
blocksRouter.get('/', (_req, res) => {
  res.json({blocks: getEnabledBlocks()});
});

/** GET /api/v1/blocks/:id — one block, or 404. */
blocksRouter.get('/:id', (req, res) => {
  const block = blockCapabilityById(req.params.id);
  if (!block) {
    res.status(404).json({error: `Unknown block: ${req.params.id}`});
    return;
  }
  res.json({block});
});
