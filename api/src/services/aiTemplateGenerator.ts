import {sceneBlockPlayerSchema, type SceneBlockPlayerProps} from '../../../src/compositions/SceneBlockPlayer/schema';
import {getCompactCapabilitySummary} from '../../../src/shared/capabilities/registry';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-4-scout';
const FALLBACK_MODEL = 'openai/gpt-4o-mini';

type GenerateResult = {
  spec: SceneBlockPlayerProps;
  model: string;
  tokensUsed: {input: number; output: number};
};

const buildSystemPrompt = (): string => {
  const summary = getCompactCapabilitySummary();

  const blockList = summary.blocks
    .map((b) => `- ${b.id} (${b.name}, ${b.category}): fields=[${b.contentFields.join(', ')}], compatible=[${b.compatibleSchemas.join(', ')}]`)
    .join('\n');

  const animationList = summary.animations.join(', ');

  return `You are a video template generator. Given a user description, produce a valid SceneBlockPlayer JSON spec.

AVAILABLE BLOCKS:
${blockList}

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
  const systemPrompt = buildSystemPrompt();

  // First attempt
  const {content, model, tokens} = await callOpenRouter(systemPrompt, userPrompt);

  try {
    const spec = validateAndParse(content);
    return {spec, model, tokensUsed: tokens};
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
    };
  }
};
