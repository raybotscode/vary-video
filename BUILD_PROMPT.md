# Vary.video — Build Prompt: Phase 1 (Core Engine)

## Project Overview
Build a Remotion-based batch video variant generation engine. The platform allows users to create video ad templates with dynamic text placeholders (e.g. "Are you a {{age}} year old {{gender}} in {{location}}?"), upload a JSON/CSV file with variant data, and batch-render all variants as MP4 videos.

**Brand:** Vary.video  
**Domain:** vary.video  
**Tagline concept:** "Batch video variants. One template, infinite ads."  
**Target users:** Advertising agencies, marketing teams running multi-variant ad campaigns  
**First vertical:** Insurance ads (but the engine must be template-agnostic)

## Architecture

```
vary-video/
├── src/                       # Remotion compositions
│   ├── compositions/
│   │   ├── InsuranceAd/       # First template — insurance ad
│   │   │   ├── InsuranceAd.tsx   # Main composition
│   │   │   ├── DynamicText.tsx   # Text with auto-fit + placeholders
│   │   │   ├── BrandFrame.tsx    # Branded end frame
│   │   │   └── schema.ts         # Defines expected props + defaults
│   │   └── index.ts           # Export all compositions
│   ├── components/            # Shared Remotion components
│   │   ├── FitText.tsx         # Reusable auto-fit text component
│   │   └── util.ts             # Helpers (seeded RNG, placeholder replacement)
│   ├── Root.tsx               # Register all compositions
│   └── index.ts               # Entry point
├── api/                       # Express API
│   ├── src/
│   │   ├── index.ts           # Express server (port 3001)
│   │   ├── routes/
│   │   │   └── render.ts      # POST /api/render — trigger single or batch render
│   │   └── services/
│   │       └── renderer.ts    # Remotion render orchestration
│   ├── package.json
│   └── tsconfig.json
├── scripts/
│   ├── batch-render.ts        # CLI script to batch-render from JSON
│   └── render-variant.sh      # Shell helper for rendering
├── web/                       # React frontend (Phase 2 — scaffold only for now)
│   └── index.html             # Placeholder
├── public/                    # Static assets served by API
│   └── renders/               # Output MP4s go here
├── remotion.config.ts         # Remotion config with WSL LD_LIBRARY_PATH fix
├── package.json               # Root workspace
├── tsconfig.json
└── BUILD_PROMPT.md
```

## CRITICAL: Dynamic Text Handling

Use `@remotion/layout-utils` for ALL dynamic text fitting. This is non-negotiable.

### Install
```bash
npm install @remotion/layout-utils
```

### Pattern for Every Dynamic Text Element

```typescript
import { fitText, fillTextBox, measureText } from "@remotion/layout-utils";
import { useVideoConfig } from "remotion";

// Inside your component, measure text at render time:
const { fontSize } = fitText({
  text: resolvedText,
  width: boundingBoxWidth,
  fontFamily: "Inter",
  maxFontSize: 48,
  minFontSize: 14,
});

// Then verify it fits in height:
const { lines, exceedsBox } = fillTextBox({
  text: resolvedText,
  width: boundingBoxWidth,
  height: boundingBoxHeight,
  fontSize,
  fontFamily: "Inter",
});

// If exceedsBox, shrink further or truncate
const safeFontSize = exceedsBox ? Math.max(fontSize - 4, 12) : fontSize;
```

### Create a Reusable `<FitText>` Component

A component that:
- Accepts `text`, `width`, `height`, `fontFamily`, `maxFontSize`, `minFontSize` props
- Internally uses `fitText()` + `fillTextBox()` to find the optimal size
- Renders the text at that size
- If text still overflows, adds ellipsis truncation as fallback
- Supports multi-line text with auto line-breaking
- Animates font size transitions smoothly (don't jump)

### Placeholder Text System

The user writes: `"Are you a {{age}} year old {{gender}} in {{location}}?"`

Create a helper `resolvePlaceholders(text: string, data: Record<string, string>): string` that replaces `{{key}}` with values from the data object. The composition receives both the template string and the data object as props.

## First Template: InsuranceAd

A 15-second (450 frames at 30fps) insurance ad with:

### Composition Props
```typescript
type InsuranceAdProps = {
  // Content
  headlineTemplate: string;  // e.g. "Are you a {{age}} year old {{gender}} in {{location}}?"
  subheadlineTemplate: string; // e.g. "Get covered today with {{company}}"
  data: Record<string, string>; // e.g. { age: "52", gender: "man", location: "Dublin" }
  ctaText: string;           // e.g. "Get a Quote Today"
  
  // Branding
  brandColor: string;        // Primary colour hex
  secondaryColor: string;    // Secondary colour hex
  logoUrl: string;           // URL to brand logo PNG
  
  // Background
  backgroundType: "solid" | "gradient" | "image";
  backgroundColor: string;
  backgroundImageUrl?: string;
};
```

### Scene Breakdown

**Scene 1 (0-3s): Hook**
- Headline appears letter-by-letter or line-by-line using `fitText()`
- Dynamic values ({{age}}, {{gender}}, {{location}}) are resolved before rendering
- Clean animated entrance on brand-colored background
- The resolved headline text is auto-sized to fit within safe margins (80% of canvas width)

**Scene 2 (3-12s): Value Proposition**
- Subheadline fades in
- Supporting copy (from props) slides in
- Use spring easing for natural feel

**Scene 3 (12-15s): Call to Action**
- BrandFrame with logo overlay
- CTA text bounces or fades in
- Brand colour scheme
- Optional: website URL

### Visual Style
- Clean, modern, corporate — suitable for insurance companies
- Sans-serif font (Inter from Google Fonts)
- Subtle motion — text sliding, fading, gentle scaling
- Brand colors used for accents, dividers, backgrounds
- 1920x1080 (16:9) at 30fps

### Colors (Insurance Ad Default)
- Primary: #1A365D (dark blue — trust/authority)
- Secondary: #3182CE (medium blue)
- Accent: #E53E3E (red for urgency on CTA)
- Background: gradient from #F7FAFC to #EDF2F7

## Render Queue & API

### POST /api/render/batch
Accepts JSON:
```json
{
  "compositionId": "InsuranceAd",
  "template": {
    "headlineTemplate": "Are you a {{age}} year old {{gender}} in {{location}}?",
    "subheadlineTemplate": "Get covered today with {{company}}",
    "ctaText": "Get a Quote Today",
    "brandColor": "#1A365D",
    "secondaryColor": "#3182CE",
    "logoUrl": "https://example.com/logo.png",
    "backgroundType": "gradient",
    "backgroundColor": "#1A365D"
  },
  "variants": [
    { "age": "52", "gender": "man", "location": "Dublin", "company": "XYZ Insurance" },
    { "age": "53", "gender": "woman", "location": "London", "company": "XYZ Insurance" },
    { "age": "55", "gender": "man", "location": "New York", "company": "ABC Cover" }
  ]
}
```

Returns: Job ID, estimated time, status endpoint URL.

### GET /api/render/status/:jobId
Returns: Progress (0-100), completed variants, download URLs.

### GET /api/render/download/:jobId/:variantIndex
Returns: The rendered MP4 file.

### POST /api/compositions
Returns: List of available composition IDs and their schemas (props they accept).

## Batch Render Script (scripts/batch-render.ts)

A CLI tool for offline testing:
```bash
npx tsx scripts/batch-render.ts --composition InsuranceAd --data variants.json --output ./public/renders
```

It reads a JSON file with the template config + variants array, renders each one sequentially or in parallel (configurable with `--parallel` flag), and saves MP4s to the output directory with filenames like `variant-0.mp4`, `variant-1.mp4`, etc.

Each render should call `renderMedia()` from `@remotion/renderer` programmatically (not via CLI) for better control and progress reporting.

## Critical: Rendering Setup

### remotion.config.ts
Must include the WSL LD_LIBRARY_PATH fix:
```typescript
import { Config } from "@remotion/cli/config";

process.env.LD_LIBRARY_PATH = [
  "/home/raymo/.local/lib-fixes/usr/lib/x86_64-linux-gnu",
  process.env.LD_LIBRARY_PATH,
].filter(Boolean).join(":");
```

### Chromium executable
Use `@remotion/renderer`'s `getChromiumExecutable()` or specify the path explicitly if needed.

### Output format
- MP4 with H.264 codec
- 1920x1080 at 30fps
- CRF 18 for good quality

## Development

```bash
npm install
npx remotion studio       # Opens Remotion Studio at localhost:3000
npm run api               # Starts Express API on port 3001
npm run batch -- --data variants.json  # Batch render test
```

## Styles & Fonts
- Use Inter from Google Fonts (loaded via CSS import)
- All components should be responsive to text length using `fitText()`
- No hardcoded font sizes for dynamic text — always measure first

## What to NOT build in this phase
- User authentication
- Payment integration
- Template marketplace
- Frontend UI (React app) — just a placeholder index.html
- CSV parsing (JSON only for now — CSV can be added later)
- Database — store everything in memory/in-memory job queue for MVP

## Rules
- All animations use `useCurrentFrame()` and Remotion's interpolation utilities
- All particle/random content uses seeded RNG (mulberry32) not Math.random()
- Every composition must be registered in Root.tsx
- TypeScript throughout — no `any` types
- Proper error handling in the API
- Progress reporting during renders
- The DynamicText / FitText component MUST use `@remotion/layout-utils`
