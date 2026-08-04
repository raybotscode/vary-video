import {sceneBlockPlayerSchema, type SceneBlockPlayerProps} from '../../../src/compositions/SceneBlockPlayer/schema';
import {getCompactCapabilitySummary} from '../../../src/shared/capabilities/registry';
import {scoreTemplates, type ScoredTemplate} from './templateScorer';
import {templateCapabilities} from '../../../src/shared/capabilities/templates';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-scout';
const FALLBACK_MODEL = 'openai/gpt-4o-mini';

/** Score threshold above which we reuse an existing template directly. */
const TEMPLATE_REUSE_THRESHOLD = 8;

type GenerateResult = {
  spec: SceneBlockPlayerProps;
  model: string;
  tokensUsed: {input: number; output: number};
  selectionMode: 'existing-template' | 'block-composition';
  reusedTemplateId?: string;
};

/**
 * Build a SceneBlockPlayer spec directly from an existing template definition,
 * without calling the AI. The template's default blocks and content are used,
 * and the AI is only called to fill in variant data.
 */
const buildFromExistingTemplate = (
  templateId: string,
  scored: ScoredTemplate,
): {blocks: SceneBlockPlayerProps['blocks']; data: Record<string, string>} => {
  const capability = templateCapabilities.find((t) => t.id === templateId);
  if (!capability) {
    throw new Error(`Template ${templateId} not found in capabilities`);
  }

  const blocks = capability.defaultBlocks.map((blockId) => ({
    blockId,
    content: {} as Record<string, string>,
  }));

  return {blocks, data: {}};
};

const buildSystemPrompt = (userPrompt?: string): string => {
  const summary = getCompactCapabilitySummary();

  // If we have a user prompt, score templates and send only top matches
  let blockList: string;
  let templateContext = '';
  let reuseInstruction = '';

  if (userPrompt) {
    const scored = scoreTemplates(userPrompt, 5);
    const topBlockIds = new Set<string>();

    for (const {template, score, matchedKeywords} of scored) {
      for (const blockId of template.defaultBlocks) {
        topBlockIds.add(blockId);
      }
      templateContext += `\n- ${template.id} (score: ${score}, matched: ${matchedKeywords.join(', ')}) — ${template.description}`;
    }

    // If top template is a strong match, instruct AI to reuse it
    const topScore = scored[0]?.score ?? 0;
    if (topScore >= TEMPLATE_REUSE_THRESHOLD && scored[0]) {
      const top = scored[0];
      reuseInstruction = `
TEMPLATE PREFERENCE: The template "${top.template.id}" is an excellent match (score: ${top.score}) for the user's request.
You MUST reuse this template's block sequence: ${top.template.defaultBlocks.join(', ')}.
Do NOT invent new block arrangements. Use the exact block sequence above.
Fill in content and data that matches the user's description.`;
    }

    // Include all blocks (for flexibility) but highlight the relevant ones
    const allBlocks = summary.blocks;
    const relevantBlocks = allBlocks.filter((b) => topBlockIds.has(b.id));
    const otherBlocks = allBlocks.filter((b) => !topBlockIds.has(b.id));

    blockList = [
      ...relevantBlocks.map((b) => `- ${b.id} (${b.name}, ${b.category}): fields=[${b.contentFields.join(', ')}], compatible=[${b.compatibleSchemas.join(', ')}] ★ RECOMMENDED`),
      ...otherBlocks.map((b) => `- ${b.id} (${b.name}, ${b.category}): fields=[${b.contentFields.join(', ')}], compatible=[${b.compatibleSchemas.join(', ')}]`),
    ].join('\n');
  } else {
    blockList = summary.blocks
      .map((b) => `- ${b.id} (${b.name}, ${b.category}): fields=[${b.contentFields.join(', ')}], compatible=[${b.compatibleSchemas.join(', ')}]`)
      .join('\n');
  }

  const animationList = summary.animations.join(', ');

  return `You are a video template generator. Given a user description, produce a valid SceneBlockPlayer JSON spec.

AVAILABLE BLOCKS:
${blockList}
${templateContext ? `\nRELEVANT TEMPLATES (matched to user intent):${templateContext}` : ''}
${reuseInstruction}

AVAILABLE ANIMATIONS: ${animationList}

TRANSITION TYPES: crossfade, slide, zoom, wipe
- Optional: direction (left/right/up/down), durationFrames (int), easing (linear/ease-in/ease-out/ease-in-out/spring)

OUTPUT SCHEMA:
{
  "blocks": [
    {
      "blockId": "<one of the available block IDs>",
      "content": { "<key>": "<value>" },
      "durationFrames": <optional int>,
      "animation": { "entry": { "presetId": "<id>" }, "exit": { "presetId": "<id>" } },
      "transition": { "type": "<type>", "durationFrames": <int>, "direction": "<dir>" }
    }
  ],
  "brandSettings": {
    "brandColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "logoUrl": "",
    "backgroundType": "gradient",
    "backgroundColor": "#hex"
  },
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "data": { "<placeholder_key>": "<default_value>" }
}

RULES:
- Only use block IDs from the provided list.
- Content values should use {{placeholder}} syntax when they reference variant data, or literal text when appropriate.
- The data object maps placeholder keys to default values.
- Always end with a brand-frame or agent-cta / social-outro block as CTA.
- Use durationFrames sparingly — omit to use block defaults.
- Return ONLY valid JSON. No markdown fences, no explanation.

EXAMPLE 1 — Real Estate (4 scenes):
{"blocks":[{"blockId":"property-hero","content":{"headlineTemplate":"{{property_name}}","taglineTemplate":"{{tagline}}","priceTemplate":"{{price}}"}},{"blockId":"property-details","content":{"specsLine":"{{bedrooms}} bed · {{bathrooms}} bath · {{sqft}} sq ft","locationLine":"{{location}}"}},{"blockId":"data-callout","content":{"value":"{{price}}","label":"Asking Price"}},{"blockId":"agent-cta","content":{"ctaText":"Schedule a Viewing"}}],"brandSettings":{"brandColor":"#1A365D","secondaryColor":"#3182CE","accentColor":"#38A169","logoUrl":"","backgroundType":"gradient","backgroundColor":"#F7FAFC"},"data":{"property_name":"The Elm Residence","tagline":"Light-filled family living","price":"€450,000","bedrooms":"3","bathrooms":"2","sqft":"1,400","location":"Dublin 6"}}

EXAMPLE 2 — Product Launch (4 scenes):
{"blocks":[{"blockId":"product-intro","content":{"headlineTemplate":"Introducing {{product_name}}","taglineTemplate":"{{tagline}}"}},{"blockId":"features-grid","content":{"feature1Template":"{{feature1}}","feature2Template":"{{feature2}}","feature3Template":"{{feature3}}"}},{"blockId":"pricing-card","content":{"taglineTemplate":"{{tagline}}","ctaText":"Get Started Today"}},{"blockId":"brand-frame","content":{"ctaText":"Learn More at example.com"}}],"brandSettings":{"brandColor":"#1A365D","secondaryColor":"#3182CE","accentColor":"#FF6B5B","logoUrl":"","backgroundType":"gradient","backgroundColor":"#F7FAFC"},"data":{"product_name":"Acme Pro","tagline":"Ship faster, together","feature1":"Real-time collab","feature2":"One-click deploy","feature3":"Built-in analytics"}}

EXAMPLE 3 — Social Clip (3 scenes):
{"blocks":[{"blockId":"social-hook","content":{"hookTemplate":"{{hook}}"}},{"blockId":"social-body","content":{"bodyTemplate":"{{body}}"}},{"blockId":"social-outro","content":{"ctaText":"{{cta}}"}}],"brandSettings":{"brandColor":"#1A365D","secondaryColor":"#3182CE","accentColor":"#9F7AEA","logoUrl":"","backgroundType":"gradient","backgroundColor":"#F7FAFC"},"data":{"hook":"Stop blending in","body":"Stand out with video that converts.","cta":"Try it free"}}`;
};

const callOpenRouter = async (
  systemPrompt: string,
  userPrompt: string,
  model: string = MODEL,
): Promise<{content: string; model: string; tokens: {input: number; output: number}}> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured on the server');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {role: 'system', content: systemPrompt},
        {role: 'user', content: userPrompt},
      ],
      response_format: {type: 'json_object'},
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenRouter API error ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices: Array<{message: {content: string}}>;
    model: string;
    usage?: {prompt_tokens: number; completion_tokens: number};
  };

  return {
    content: data.choices[0]?.message?.content ?? '',
    model: data.model ?? model,
    tokens: {
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  };
};

const validateAndParse = (rawJson: string): SceneBlockPlayerProps => {
  // Strip markdown fences if present
  let cleaned = rawJson.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(cleaned);
  return sceneBlockPlayerSchema.parse(parsed);
};

export const generateTemplate = async (userPrompt: string): Promise<GenerateResult> => {
  // Score templates to determine selection mode
  const scored = scoreTemplates(userPrompt, 5);
  const topScore = scored[0]?.score ?? 0;
  const isStrongMatch = topScore >= TEMPLATE_REUSE_THRESHOLD && scored[0];

  const selectionMode: 'existing-template' | 'block-composition' =
    isStrongMatch ? 'existing-template' : 'block-composition';

  const systemPrompt = buildSystemPrompt(userPrompt);

  // First attempt
  const {content, model, tokens} = await callOpenRouter(systemPrompt, userPrompt);

  try {
    const spec = validateAndParse(content);
    return {
      spec,
      model,
      tokensUsed: tokens,
      selectionMode,
      reusedTemplateId: isStrongMatch ? scored[0].template.id : undefined,
    };
  } catch (firstError) {
    // Retry once with error feedback
    const retryPrompt = `${userPrompt}\n\nIMPORTANT: Your previous response failed validation with this error:\n${firstError instanceof Error ? firstError.message : String(firstError)}\n\nFix the JSON and return a valid spec.`;

    const retry = await callOpenRouter(systemPrompt, retryPrompt, model);
    const spec = validateAndParse(retry.content);
    return {
      spec,
      model: retry.model,
      tokensUsed: {
        input: tokens.input + retry.tokens.input,
        output: tokens.output + retry.tokens.output,
      },
      selectionMode,
      reusedTemplateId: isStrongMatch ? scored[0].template.id : undefined,
    };
  }
};
