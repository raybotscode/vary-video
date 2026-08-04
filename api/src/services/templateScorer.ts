import {getEnabledTemplates} from '../../../src/shared/capabilities/registry';
import type {TemplateCapability} from '../../../src/shared/capabilities/types';

export type ScoredTemplate = {
  template: TemplateCapability;
  score: number;
  matchedKeywords: string[];
};

/**
 * Tokenize a prompt into lowercase keywords, stripping common stop words.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'that', 'this', 'was', 'are',
  'be', 'has', 'had', 'have', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'i', 'we', 'you', 'they',
  'me', 'my', 'our', 'your', 'their', 'its', 'make', 'create', 'build',
  'generate', 'want', 'need', 'show', 'video', 'template', 'scene',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

/**
 * Score a template against a user prompt.
 * Uses keyword matching across multiple template fields.
 */
function scoreTemplate(template: TemplateCapability, promptTokens: string[]): {
  score: number;
  matchedKeywords: string[];
} {
  const matchedKeywords: string[] = [];
  let score = 0;

  // Build searchable text corpus from template metadata
  const corpus = [
    template.name,
    template.description,
    template.category,
    template.useCase,
    ...template.tags,
  ].join(' ').toLowerCase();

  const corpusTokens = new Set(tokenize(corpus));

  for (const token of promptTokens) {
    // Exact match against corpus tokens
    if (corpusTokens.has(token)) {
      score += 2;
      matchedKeywords.push(token);
      continue;
    }

    // Partial match (token is substring of corpus token or vice versa)
    for (const corpusToken of corpusTokens) {
      if (corpusToken.includes(token) || token.includes(corpusToken)) {
        score += 1;
        matchedKeywords.push(token);
        break;
      }
    }
  }

  // Bonus for matching useCase specifically (most descriptive field)
  const useCaseTokens = tokenize(template.useCase);
  for (const token of promptTokens) {
    if (useCaseTokens.some((ut) => ut.includes(token) || token.includes(ut))) {
      score += 1;
    }
  }

  return {score, matchedKeywords: [...new Set(matchedKeywords)]};
}

/**
 * Score all enabled templates against a user prompt.
 * Returns sorted array (highest score first).
 */
export function scoreTemplates(prompt: string, limit = 5): ScoredTemplate[] {
  const promptTokens = tokenize(prompt);
  const templates = getEnabledTemplates();

  if (promptTokens.length === 0) {
    // No meaningful tokens — return all templates with equal score
    return templates.slice(0, limit).map((template) => ({
      template,
      score: 0,
      matchedKeywords: [],
    }));
  }

  const scored = templates
    .map((template) => {
      const {score, matchedKeywords} = scoreTemplate(template, promptTokens);
      return {template, score, matchedKeywords};
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
