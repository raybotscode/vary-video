import {Router} from 'express';
import {generateTemplate} from '../../services/aiTemplateGenerator';

export const generateTemplateRouter = Router();

generateTemplateRouter.post('/', async (req, res) => {
  const {prompt} = req.body ?? {};

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({error: 'Missing required field: prompt (non-empty string)'});
    return;
  }

  if (prompt.length > 2000) {
    res.status(400).json({error: 'Prompt too long (max 2000 characters)'});
    return;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    res.status(500).json({error: 'OPENROUTER_API_KEY is not configured on the server'});
    return;
  }

  try {
    const result = await generateTemplate(prompt.trim());
    res.json({
      spec: result.spec,
      model: result.model,
      tokensUsed: result.tokensUsed,
      selectionMode: result.selectionMode,
      reusedTemplateId: result.reusedTemplateId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Template generation failed';
    console.error('[generate-template] Error:', message);
    res.status(500).json({error: message});
  }
});
