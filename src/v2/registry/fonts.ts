/**
 * V2 Font Registry — controlled font definitions.
 *
 * AI must not invent arbitrary font names.
 * Editor and renderer both read from this registry.
 */

export type FontDefinition = {
  id: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';
  weights: number[];
  /** Source: Google Fonts via @remotion/google-fonts or custom URL */
  source: string;
  /** Whether available in editor preview (DOM) */
  editorAvailable: boolean;
  /** Whether available in Remotion renderer */
  rendererAvailable: boolean;
  license: string;
  tags: string[];
  status: 'enabled' | 'disabled';
};

const fonts: FontDefinition[] = [
  {
    id: 'inter',
    family: 'Inter',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    source: '@remotion/google-fonts/Inter',
    editorAvailable: true,
    rendererAvailable: true,
    license: 'OFL',
    tags: ['system', 'body', 'default'],
    status: 'enabled',
  },
  {
    id: 'montserrat',
    family: 'Montserrat',
    category: 'sans-serif',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    source: '@remotion/google-fonts/Montserrat',
    editorAvailable: true,
    rendererAvailable: true,
    license: 'OFL',
    tags: ['display', 'headline'],
    status: 'enabled',
  },
  {
    id: 'roboto',
    family: 'Roboto',
    category: 'sans-serif',
    weights: [100, 300, 400, 500, 700, 900],
    source: '@remotion/google-fonts/Roboto',
    editorAvailable: true,
    rendererAvailable: true,
    license: 'Apache 2.0',
    tags: ['body', 'system'],
    status: 'enabled',
  },
  {
    id: 'playfair-display',
    family: 'Playfair Display',
    category: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
    source: '@remotion/google-fonts/PlayfairDisplay',
    editorAvailable: true,
    rendererAvailable: true,
    license: 'OFL',
    tags: ['serif', 'display', 'elegant'],
    status: 'enabled',
  },
  {
    id: 'oswald',
    family: 'Oswald',
    category: 'sans-serif',
    weights: [200, 300, 400, 500, 600, 700],
    source: '@remotion/google-fonts/Oswald',
    editorAvailable: true,
    rendererAvailable: true,
    license: 'OFL',
    tags: ['display', 'condensed', 'bold'],
    status: 'enabled',
  },
  {
    id: 'roboto-mono',
    family: 'Roboto Mono',
    category: 'monospace',
    weights: [100, 200, 300, 400, 500, 600, 700],
    source: '@remotion/google-fonts/RobotoMono',
    editorAvailable: true,
    rendererAvailable: true,
    license: 'Apache 2.0',
    tags: ['monospace', 'code', 'data'],
    status: 'enabled',
  },
];

/** Get a font by ID. */
export function getFont(id: string): FontDefinition | undefined {
  return fonts.find(f => f.id === id);
}

/** Get all enabled fonts. */
export function getEnabledFonts(): FontDefinition[] {
  return fonts.filter(f => f.status === 'enabled');
}

/** Check if a font ID is valid and enabled. */
export function isValidFontId(id: string): boolean {
  return fonts.some(f => f.id === id && f.status === 'enabled');
}

/** Get all font families as a simple list (for AI prompts). */
export function getFontFamilies(): string[] {
  return getEnabledFonts().map(f => f.family);
}
