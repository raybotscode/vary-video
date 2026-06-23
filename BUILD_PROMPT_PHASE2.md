# Vary.video — Build Prompt: Phase 2 (React Frontend)

## Overview
Build the user-facing React frontend for Vary.video — a web-based dashboard where users create video ad templates with dynamic placeholders, upload variant data, and trigger batch video renders.

The frontend is a **Vite + React + TypeScript** app deployed to Cloudflare Pages. It communicates with the Express API running on port 3001 (the mini PC for now, via Cloudflare Tunnel in testing, or directly when on the same machine).

## Design & Brand

### Brand Identity
- **Brand name:** Vary.video
- **Tagline:** "Batch video variants. One template, infinite ads."
- **Domain:** vary.video (bought and owned)

### Colour Palette
- Primary: `#1A365D` (dark navy — trust, authority, insurance-adjacent)
- Secondary: `#3182CE` (medium blue)
- Accent/Coral: `#FF6B5B` (warm accent for CTAs and active states)
- Background: `#F7FAFC` (light cool grey)
- Card/surface: `#FFFFFF`
- Text: `#1A202C` (near-black)
- Muted text: `#718096`

### Typography
- Headings: `Inter` font weight 700-800
- Body: `Inter` font weight 400-500
- Monospace: `JetBrains Mono` or `SF Mono` for code/placeholder display

### Visual Style
- Clean, modern, B2B SaaS feel
- Card-based dashboard layout
- Subtle shadows and rounded corners (8-12px radius)
- Generous whitespace
- Dark nav/header bar, white content area
- Mobile-first responsive design

## Project Structure

```
vary-video/
├── web/                       # THIS IS WHAT WE'RE BUILDING
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Router + layout
│   │   ├── index.css          # Global styles + CSS variables
│   │   ├── api/
│   │   │   └── client.ts      # HTTP client for the Vary API
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Landing page — explain product, CTA
│   │   │   ├── Dashboard.tsx  # Main dashboard — create templates, trigger renders
│   │   │   └── RenderHistory.tsx  # View/download previous renders
│   │   ├── components/
│   │   │   ├── Layout.tsx     # App shell — nav, sidebar, footer
│   │   │   ├── Navbar.tsx     # Top navigation bar
│   │   │   ├── TemplateForm.tsx   # The main form for creating a variant batch
│   │   │   ├── VariantEditor.tsx  # Add/edit variant data rows
│   │   │   ├── VariantTable.tsx   # Table showing all variants in current batch
│   │   │   ├── BrandSettings.tsx   # Colour/logo/font picker
│   │   │   ├── PlaceholderHelp.tsx # Help text explaining {{placeholder}} syntax
│   │   │   ├── RenderProgress.tsx  # Progress bar + status for active render
│   │   │   └── Footer.tsx
│   │   └── utils/
│   │       └── placeholder.ts  # Preview placeholder resolution in UI
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   └── vite.config.ts
├── api/                       # Already exists from Phase 1
├── src/                       # Already exists from Phase 1 (Remotion)
└── ...other files
```

## Pages

### Home Page (unauthenticated landing)
- Hero section: "Batch video variants. One template, infinite ads."
- Brief explanation of the product
- Screenshot or mockup of the dashboard (use a simple illustration or gradient placeholder)
- "Get Started" button → navigates to /dashboard
- Clean, single-column, responsive

### Dashboard (main workspace)
This is the core of the app. A single-page workspace with sections:

#### Step 1: Choose a Template
- Card selection showing available templates (just "Insurance Ad" for now)
- Each card shows: template name, thumbnail placeholder, brief description
- Clicking a template selects it and reveals Step 2

#### Step 2: Write Your Copy
- **Headline** text field with placeholder insertion UI
- **Subheadline** text field
- **Call to Action** text field
- A helper panel showing available placeholders: `{{age}}`, `{{gender}}`, `{{location}}`, `{{company}}`
- Users can click a placeholder to insert it at cursor position in the text field
- Live preview of ONE variant with current text and brand colours

#### Step 3: Add Variant Data
- A table where users input their variant data
- **Add Row** button to add more variants
- **Delete Row** button on each row
- Columns: Age, Gender (dropdown: man/woman), Location (text), Company (text)
- **Import JSON** button — opens a textarea where they paste a JSON array
- **Import CSV** button — simple CSV paste or file upload, parsed into the table
- The table must be usable on mobile (horizontal scroll if needed, or stacked cards)

#### Step 4: Brand Settings
- Brand colour: hex input + colour picker
- Secondary colour: hex input
- Background type: dropdown (solid, gradient, image)
- Logo URL: text input (for now — file upload later)
- Preview shows colours updating in real-time on a sample card

#### Step 5: Generate
- Summary card showing: template name, number of variants, estimated render time
- **Generate All Variants** button — calls POST /api/render/batch
- **Render Progress** section appears showing:
  - Progress bar per variant (from the renderer's onProgress)
  - Overall batch progress (X of Y completed)
  - Estimated time remaining
  - When complete: Download All as ZIP button
- **Download Individual** links for each variant MP4

### Render History (simple)
- List of previously rendered batches
- Shows: date, template name, number of variants, status
- Click to re-download

## API Endpoints (Already built — just consuming these)

| Endpoint | Method | What it does |
| :--- | :--- | :--- |
| `/api/compositions` | GET | Returns list of available compositions with their schemas |
| `/api/render/batch` | POST | Triggers a batch render. Body: `{compositionId, template, variants}` |
| `/api/render/status/:jobId` | GET | Returns progress (0-100 per variant) |
| `/api/render/download/:jobId/:variantIndex` | GET | Downloads a single rendered MP4 |
| `/api/render/download/:jobId` | GET | Downloads all as a ZIP file (Note: ZIP endpoint may need to be added) |

## Vite Config
- `base: '/'` for Cloudflare Pages deployment
- Proxy `/api` to `http://localhost:3001` during development
- Build output to `dist/` directory
- `minify: true` for production builds

## Cloudflare Pages Deployment
- Build command: `cd web && npm install && npm run build`
- Build output directory: `web/dist`
- Already configured via the Vary.video Pages project or we'll create it

## Development
```bash
cd web
npm install
npm run dev          # Vite dev server at localhost:5173, proxies /api to localhost:3001
npm run build        # Production build to dist/
npm run preview      # Preview the production build locally
```

## Mobile Responsiveness
- ALL pages must be fully responsive down to 320px width
- The variant table should show as a card layout on mobile (stacked rows, not a wide table)
- Forms should be single-column on mobile
- Touch-friendly buttons (min 44px tap target)
- The dashboard steps should work as a single scrollable page on mobile (no multi-column layout)

## Behaviour
- On page load, the frontend calls GET /api/compositions to populate the template selector
- When the user clicks "Generate All Variants", POST /api/render/batch is called
- The frontend polls GET /api/render/status/:jobId every 2 seconds to update progress
- On completion, download links appear — the user can download individual MP4s or all as a ZIP
- All API calls should have proper error handling (toast or inline error messages)
- Loading states on all buttons and data-dependent sections

## Rules
- React 19 + TypeScript
- No Tailwind — use vanilla CSS with CSS variables for the design system
- No heavy component libraries — write the UI with plain React + CSS
- Keep the bundle small — no unnecessary dependencies
- Mobile-first responsive design using CSS Grid + Flexbox
- All colours, fonts, and spacing use CSS custom properties defined in :root
- The app must work when the API is unavailable (show a friendly offline/error state)
- Import the Inter font from Google Fonts via CSS @import or link tag

## DO NOT Build in This Phase
- User authentication / login
- Payment / Stripe integration
- User accounts or multi-tenancy
- Social login
- Email notifications
- Analytics or tracking
- File upload for logos (text URL input is fine for now)
- The ZIP download endpoint (note it in the API as "not yet implemented" — download individual files instead)
