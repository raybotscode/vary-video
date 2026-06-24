# Vary.video — Phase 2: Scene Block Architecture & Sequencer

## Overview
Replace monolithic templates with composable scene blocks. Users pick blocks from a library, arrange them in any order, configure per-block content, and the system stitches them into a single Remotion video.

You MUST read existing files before modifying them. Always import from existing locations.

## Existing Architecture Reference

**Existing template compositions** (read these to understand the scene pattern):
- `src/compositions/ProductLaunch/IntroScene.tsx` — Takes `{props: ProductLaunchProps}`, renders frames 0-120
- `src/compositions/ProductLaunch/FeaturesScene.tsx` — Takes `{props: ProductLaunchProps}`, renders frames 130-270
- `src/compositions/ProductLaunch/PricingScene.tsx` — Takes `{props: ProductLaunchProps}`, renders frames 280-360
- `src/compositions/RealEstate/HeroScene.tsx` — Takes `{props: RealEstateProps}`, frames 0-150
- `src/compositions/RealEstate/DetailsScene.tsx` — Takes `{props: RealEstateProps}`, frames 160-300
- `src/compositions/RealEstate/CTAScene.tsx` — Takes `{props: RealEstateProps}`, frames 310-360
- `src/compositions/SocialClip/HookScene.tsx` — Takes `{props: SocialClipProps}`, frames 0-100
- `src/compositions/SocialClip/BodyScene.tsx` — Takes `{props: SocialClipProps}`, frames 110-260
- `src/compositions/SocialClip/OutroScene.tsx` — Takes `{props: SocialClipProps}`, frames 270-360
- `src/components/BrandFrame.tsx` — Takes `{brandColor, secondaryColor, logoUrl, ctaText}`, frames 360-450
- All scenes use: `useCurrentFrame()`, `interpolate()`, `spring()` from remotion
- All scenes import `DynamicText` from `../../components/DynamicText`
- All scenes import `safeHexColor` from `../../components/util`
- All parent compositions parse props via Zod schema then pass to scenes

**Existing shared components:**
- `src/components/DynamicText.tsx` — Re-exports from `src/compositions/InsuranceAd/DynamicText`
- `src/components/BrandFrame.tsx` — Re-exports from `src/compositions/InsuranceAd/BrandFrame`
- `src/components/FitText.tsx` — Auto-sizing text
- `src/components/util.ts` — resolvePlaceholders, mulberry32, hashSeed, safeHexColor

**Existing frontend:**
- `web/src/pages/Dashboard.tsx` — Main workflow page with steps
- `web/src/components/TemplateForm.tsx` — Template picker + copy fields
- `web/src/components/VariantEditor.tsx` — Variant data table
- `web/src/components/BrandSettings.tsx` — Brand color settings
- `web/src/components/FormatSelector.tsx` — Output format checkboxes
- `web/src/api/client.ts` — API client with types
- `web/src/utils/templates.ts` — Frontend template definitions
- `web/src/utils/placeholder.ts` — Placeholder utilities
- `web/src/App.tsx` — App shell with route navigation

## Step 1: Create Scene Block Registry

Create `src/compositions/blocks/registry.ts` — a single source of truth for ALL scene blocks.

Each block definition has:
```typescript
type SceneBlockDefinition = {
  id: string;                    // Unique block ID (kebab-case)
  name: string;                  // Human-readable name
  description: string;           // Short description
  icon: string;                  // Emoji or text icon
  category: 'intro' | 'feature' | 'cta' | 'detail' | 'hook' | 'body' | 'outro';
  defaultDurationFrames: number; // How many frames this block takes
  // Which template schemas this block can use — the props interface it expects
  compatibleSchemas: string[];   // e.g. ['ProductLaunch', 'RealEstate', 'SocialClip', 'any']
  // Whether this block needs brand settings
  needsBrandSettings: boolean;
  // Default content template (placeholder-based, same {{variable}} syntax)
  defaultContent: Record<string, string>;
};
```

Define these blocks:

### From ProductLaunch:
1. `product-intro` — name: 'Product Intro', category: 'intro', 120 frames, compatible with ProductLaunch
2. `features-grid` — name: 'Features Grid', category: 'feature', 140 frames, compatible with ProductLaunch
3. `pricing-card` — name: 'Pricing Card', category: 'cta', 80 frames, compatible with ProductLaunch

### From RealEstate:
4. `property-hero` — name: 'Property Hero', category: 'intro', 150 frames, compatible with RealEstate
5. `property-details` — name: 'Property Details', category: 'detail', 140 frames, compatible with RealEstate
6. `agent-cta` — name: 'Agent CTA', category: 'cta', 50 frames, compatible with RealEstate

### From SocialClip:
7. `social-hook` — name: 'Social Hook', category: 'hook', 100 frames, compatible with SocialClip
8. `social-body` — name: 'Social Body', category: 'body', 150 frames, compatible with SocialClip
9. `social-outro` — name: 'Social Outro', category: 'outro', 90 frames, compatible with SocialClip

### Generic/reusable:
10. `brand-frame` — name: 'Brand Frame', category: 'outro', 90 frames, compatible with ['any']
11. `text-overlay` — name: 'Text Overlay', category: 'body', 120 frames, compatible with ['any'] — simple text with background
12. `data-callout` — name: 'Data Callout', category: 'feature', 120 frames, compatible with ['any'] — big number in the center

Each block needs a `render` property — a React component that renders the block's frames.
The render function accepts `{frame: number, fps: number, width: number, height: number, content: Record<string, string>, brand: BrandSettings}`.

Export:
```typescript
export const blockRegistry: Record<string, SceneBlockDefinition>;
export const blockRenderers: Record<string, React.FC<BlockRenderProps>>;
export function getBlock(id: string): SceneBlockDefinition;
export function getAllBlocks(): SceneBlockDefinition[];
export function getBlocksByCategory(category: string): SceneBlockDefinition[];
```

## Step 2: Create Generic Scene Blocks

Create `src/compositions/blocks/TextOverlay.tsx` — simple text-over-background block.
Create `src/compositions/blocks/DataCallout.tsx` — big number/data highlight block.

These are NEW blocks that work with ANY template schema. They're simple:
- TextOverlay: renders headline text centered over a colored/semi-transparent background
- DataCallout: renders a large number ({{value}}) with a label ({{label}}) underneath

Both use DynamicText and FitText from existing components.

## Step 3: Create SceneBlockPlayer Composition

Create `src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx` — a new Remotion composition that plays a sequence of blocks.

Props (Zod schema):
```typescript
{
  blocks: Array<{
    blockId: string;
    content: Record<string, string>;  // {{placeholder}} values for this block
    durationFrames?: number;           // Override default duration
    transitionFrames?: number;         // Frames for fade transition
  }>;
  brandSettings: {
    brandColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    backgroundType: 'solid' | 'gradient' | 'image';
    backgroundColor: string;
    backgroundImageUrl?: string;
  };
  fps: number;
  width: number;
  height: number;
}
```

**IMPORTANT — How SceneBlockPlayer works:**
1. Total duration = sum of all block durations
2. Each block gets a frame offset (start frame for that block)
3. `useCurrentFrame()` tells us the current frame
4. Find which block should be playing at this frame
5. Calculate the local frame within that block (frame - blockStartFrame)
6. Pass local frame + block's content + brand settings to the block's render function
7. Render transition overlay (simple crossfade between blocks)
8. BrandFrame block at the end uses the existing BrandFrame component

```typescript
// Pseudocode for the composition
const currentFrame = useCurrentFrame();
let accumulated = 0;
for (const block of sortedBlocks) {
  const duration = block.durationFrames ?? defaultDuration;
  if (currentFrame >= accumulated && currentFrame < accumulated + duration) {
    const localFrame = currentFrame - accumulated;
    const Renderer = blockRenderers[block.blockId];
    return <Renderer frame={localFrame} content={block.content} brand={brandSettings} ... />;
  }
  accumulated += duration;
}
```

Create `src/compositions/SceneBlockPlayer/schema.ts` with the Zod schema.

Register in `src/Root.tsx` with `id="SceneBlockPlayer"`.

Export from `src/compositions/index.ts`.

## Step 4: Extract Existing Scenes as Reusable Blocks

The existing scene components (IntroScene, FeaturesScene, etc.) need CONVERTER functions — NOT to be moved or changed.

Create `src/compositions/blocks/adapters.ts` that adapts existing scene components to the block render interface:

```typescript
// Each adapter maps a blockId to a render function that calls the original scene
export const blockAdapters: Record<string, (props: BlockRenderProps) => React.ReactElement> = {
  'product-intro': ({frame, fps, width, height, content, brand}) => {
    // Create props object for the original IntroScene
    const props = makeBlockRenderProps(content, brand);
    return <IntroScene props={props} frame={frame} />;
  },
  // ... etc
};
```

DO NOT modify the original scene files. The adapters allow blocks to work with existing components without touching them.

## Step 5: Update Template Registry

Update `src/templates/registry.ts` to add:
- A `blockSequence` field to each TemplateDefinition — the default sequence of block IDs for that template
- A function `getBlockSequence(templateId: string): string[]` that returns the default block order

Example block sequences:
- ProductLaunch → ['product-intro', 'features-grid', 'pricing-card', 'brand-frame']
- RealEstate → ['property-hero', 'property-details', 'agent-cta', 'brand-frame']
- SocialClip → ['social-hook', 'social-body', 'social-outro', 'brand-frame']
- InsuranceAd → ['product-intro', 'features-grid', 'pricing-card', 'brand-frame'] (reuse - insurance ad works with product launch blocks)

## Step 6: Build the Scene Sequencer Frontend

### Create `web/src/components/BlockPalette.tsx`
Shows all available blocks grouped by category with drag/drag-start support.
Each block card shows: icon, name, description, duration.

### Create `web/src/components/SceneTimeline.tsx`
Shows the current sequence of blocks as a horizontal timeline.
- Each block is a card with its name, duration, and a delete button
- Blocks can be reordered (for MVP, use move up/move down buttons — NOT full drag-and-drop to keep it simpler)
- "Add Block" button opens a modal/panel with the BlockPalette
- Total duration shown at the bottom

### Create `web/src/components/BlockEditor.tsx`
When a block in the timeline is selected, this panel shows:
- The block's content fields (placeholder text inputs)
- Duration slider/input
- Optional: color overrides per block

### Update `web/src/pages/Dashboard.tsx`
Add a new mode toggle at the top of the Dashboard:
- **"Quick Template"** — the existing step-by-step flow (keep this EXACTLY as-is)
- **"Scene Composer"** — the new block-based flow

When in "Scene Composer" mode, replace Steps 1-2 with:
- Step 1: Pick base template (same template cards)
- Step 2: Compose scenes (BlockPalette + SceneTimeline + BlockEditor)
- Step 3: Add variant data (same as existing)
- Step 4: Brand settings (same as existing)
- Step 5: Output formats (same as existing)
- Step 6: Generate (renders using SceneBlockPlayer composition)

### Update `web/src/api/client.ts`
Add a new composition type for SceneBlockPlayer:
```typescript
export type BlockSequence = {
  blockId: string;
  content: Record<string, string>;
  durationFrames?: number;
}[];
```

Update the batch render request to support block sequences alongside template payloads.

### Update route
Add a `/composer` route in `web/src/App.tsx`:
- 'composer' route → shows SceneComposer page
- Navbar gets a "Composer" nav link
- Home page gets a "Scene Composer" call-to-action alongside "Get Started"

## Design Rules

1. **DO NOT rename or delete existing scene files** — the original compositions still work
2. **DO NOT change existing components** unless adding new props with defaults
3. **Use the same styling patterns** — CSS-in-JS for Remotion, CSS classes for frontend
4. **Mobile responsive** — the sequencer must work on mobile
5. **No new npm dependencies** unless absolutely necessary
6. **Placeholder resolution** uses `{{variable_name}}` syntax
7. **Duration scaling** — blocks with their own frame counting (useCurrentFrame) need to be adapted to receive a localFrame parameter instead
8. **TypeScript** — no `any` types, proper interfaces everywhere

## What NOT to do
- Don't implement actual HTML5 drag-and-drop (use move up/down buttons for MVP)
- Don't implement save/load of custom sequences (in-memory only for MVP)
- Don't modify the existing 4 template compositions (they work and are separate from the block system)
- Don't change the rendering pipeline (bundle, renderMedia, selectComposition)
- Don't modify Vite config or deploy config

## Verification
1. `npx tsc --noEmit` from project root passes
2. `cd web && npx tsc --noEmit` passes
3. `cd web && npx vite build` succeeds
4. Frontend shows "Quick Template" and "Scene Composer" modes
5. Scene Composer shows block palette, timeline, and editor
6. Can select blocks, reorder them, and configure content
