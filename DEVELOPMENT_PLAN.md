# Vary.video Development Plan

## Instructions for Raybot

You are continuing development of **Vary.video**, a batch video generation platform built with Remotion, React, TypeScript, Express and Cloudflare Pages.

The current system allows a user to select a template, enter or import variant data, choose aspect ratios, render multiple videos and download the results. It also contains a partially built block-based visual composer and a generic JSON-driven composition called `SceneBlockPlayer`.

The goal is to evolve this from a functional technical MVP into a responsive, multi-user-ready, AI-assisted commercial SaaS product.

Preserve the existing block system and `SceneBlockPlayer` architecture. Do not replace them with a separate incompatible template system.

---

# 1. Model Roles and Development Workflow

## 1.1 Codex role

Use Codex as the senior architect, technical lead and reviewer.

Codex should be used for:

- Understanding the existing codebase before changes begin
- Planning each development phase
- Identifying architectural risks
- Defining TypeScript interfaces and schemas
- Reviewing database design
- Reviewing authentication and multi-tenancy boundaries
- Reviewing AI prompt and tool design
- Reviewing security-sensitive code
- Reviewing pull requests and major code changes
- Diagnosing difficult bugs
- Writing or correcting complex code when DeepSeek struggles
- Checking that a completed feature matches its acceptance criteria
- Identifying regressions and missing tests
- Reviewing responsive UI implementation
- Reviewing deployment and infrastructure changes

Codex should not automatically write every implementation. Its normal role is to plan, specify and review.

Codex may take over implementation when:

- DeepSeek produces repeated failures
- The feature affects authentication, billing or tenant isolation
- The feature involves complex Remotion timing or rendering behaviour
- The feature involves database migrations
- The feature involves security-sensitive input validation
- The feature requires significant refactoring
- The implementation does not pass review after two focused correction attempts

## 1.2 DeepSeek role

Use DeepSeek as the primary implementation model through OpenCode Go.

DeepSeek should normally handle:

- React component implementation
- CSS and responsive layouts
- Form controls
- TypeScript utilities
- API route implementation
- Database repository functions
- Tests
- Schema updates
- UI states
- Error handling
- Documentation updates
- Routine refactoring
- Small and medium bug fixes

DeepSeek must work from a Codex-approved implementation plan for major features.

## 1.3 Required workflow for every feature

For each feature:

1. Codex inspects the relevant files.
2. Codex produces a concise implementation specification.
3. DeepSeek implements the feature in a dedicated branch.
4. DeepSeek adds or updates tests.
5. Run type checking, linting, unit tests and relevant render tests.
6. Codex reviews the diff.
7. DeepSeek applies corrections.
8. Codex performs final acceptance review.
9. Merge only when acceptance criteria pass.
10. Update `TECHNICAL_OVERVIEW.md` after significant architectural changes.

Do not make large, loosely defined changes in one pass.

Prefer small, reviewable commits grouped by feature.

---

# 2. Core Product Direction

Vary.video should become:

> A mobile-first, data-driven video generation platform that allows people and AI agents to create reusable video templates, populate them with structured data and render large numbers of personalised videos in multiple formats.

The platform should support three primary creation methods:

1. Select an existing template and provide variant data.
2. Build a template visually from available scene blocks.
3. Describe a video in natural language and allow AI to construct a valid template specification from currently available blocks, templates and styles.

The AI must generate validated JSON specifications for `SceneBlockPlayer`. It must not generate executable React components or modify the composition registry at runtime.

---

# 3. Non-Negotiable Product Principles

## 3.1 Mobile first

All new interfaces must be designed for mobile first.

Desktop layouts should enhance the mobile design rather than being built first and compressed later.

Minimum supported viewport:

- 320 px wide
- 360 px wide as the primary small-mobile reference
- 390 px and 430 px modern mobile references
- 768 px tablet reference
- 1024 px laptop reference
- 1440 px desktop reference

Every feature must be usable without horizontal page scrolling.

## 3.2 Responsive by default

Every major screen must work well on:

- Mobile portrait
- Mobile landscape
- Tablet portrait
- Tablet landscape
- Laptop
- Large desktop

Responsive behaviour must be explicitly implemented and tested.

## 3.3 Touch friendly

Interactive controls must be comfortable to use with touch.

Use:

- Minimum 44 px touch targets
- Clear selected states
- Adequate spacing
- Large tap areas for cards and buttons
- Mobile-friendly dialogs and drawers
- Drag handles that do not require pixel-perfect input
- Keyboard-accessible alternatives to drag and drop

## 3.4 Progressive complexity

A first-time user should not need to understand Remotion, schemas, JSON or rendering infrastructure.

The product should reveal complexity gradually:

- Quick mode for simple batch generation
- Composer mode for visual control
- Advanced settings for technical users
- API and MCP access for developers and agents

## 3.5 Tenant-aware architecture

Even before full account functionality is launched, new database and API code should assume that data belongs to an account or organisation.

Avoid creating new global resources without ownership fields.

---

# 4. Current Architecture to Preserve

The frontend is a static Vite and React application hosted on Cloudflare Pages. It communicates with an Express render API that runs on a real machine because Remotion requires Node.js, Chromium and FFmpeg.

The current major components are:

- `web/` for the React frontend
- `api/` for Express and rendering orchestration
- `src/` for Remotion compositions
- `SceneBlockPlayer` for generic JSON-driven templates
- Shared Zod validation
- CSV and JSON variant importing
- Multiple output formats
- In-memory render jobs

The current job system is not commercially suitable because jobs disappear when the API restarts.

---

# 5. Recommended Target Architecture

## 5.1 Frontend

Use:

- React
- TypeScript
- Vite
- Existing routing approach
- Mobile-first CSS
- Reusable responsive components
- Accessible dialogs, sheets and controls
- A shared design token system

Do not introduce a large UI framework unless there is a clear advantage and the migration cost is justified.

A lightweight accessible primitive library may be used for:

- Dialogs
- Dropdowns
- Tabs
- Tooltips
- Sheets
- Popovers

The finished visual design should not look like an unmodified component library.

## 5.2 API

Continue using:

- Node.js
- Express
- TypeScript
- Zod

Introduce versioned commercial routes under:

```text
/api/v1/
```

Keep existing routes working until the frontend has fully migrated.

## 5.3 Database

Introduce a persistent database before implementing commercial API access.

Recommended initial approach:

- SQLite for simple local development and first deployment
- Drizzle ORM or another lightweight typed database layer
- Migrations stored in the repository
- Repository and service layers that can later move to Postgres

Do not spread direct SQL queries throughout route handlers.

Recommended tables:

- users
- organisations
- organisation_members
- api_keys
- templates
- template_versions
- render_jobs
- render_outputs
- assets
- usage_events
- webhooks
- webhook_deliveries
- ai_generations

Every relevant table should include:

- `id`
- `organisation_id` where applicable
- `created_at`
- `updated_at`
- Ownership and status fields
- Soft deletion where it has real value

## 5.4 Asset storage

Use a storage abstraction.

Initial options:

- Local filesystem in development
- Cloudflare R2 for commercial deployment

Create an `AssetStorage` interface so storage can change without rewriting template or render logic.

Support:

- Image upload
- Logo upload
- Background image upload
- Later, short video clip upload
- File metadata
- MIME validation
- File size limits
- Ownership
- Expiry and deletion policies

## 5.5 Render infrastructure

Continue using the mini PC for development and testing.

Use a Hetzner server for early commercial deployment.

Do not migrate to Remotion Lambda unless actual rendering demand justifies the additional complexity.

---

# 6. Phase 0: Baseline Audit and Stabilisation

Before adding major features, inspect and document the current application.

## Tasks

1. Run all existing tests.
2. Run frontend and backend type checks.
3. Run production builds.
4. Test every existing template.
5. Test all four aspect ratios.
6. Confirm CSV importing.
7. Confirm JSON importing.
8. Confirm ZIP output.
9. Confirm render progress polling.
10. Confirm Cloudflare tunnel override behaviour.
11. Record current rendering times.
12. Identify dead code and duplicated types.
13. Identify duplicated frontend and backend template definitions.
14. Confirm all current Zod schemas match actual runtime behaviour.
15. Create a known-good sample data set for each template.
16. Create a smoke-test render script.

## Deliverables

- `docs/current-state-audit.md`
- Known issue list
- Baseline test results
- Sample CSV files
- Sample template specifications
- A repeatable rendering smoke test

## Acceptance criteria

- Existing functionality is documented.
- Existing tests pass or failures are explained.
- A developer can reproduce one successful render for every template.
- The application has a stable baseline before refactoring begins.

---

# 7. Phase 1: Mobile-First UI Foundation

This phase must happen before major new product interfaces are added.

## 7.1 Create a responsive design system

Define reusable tokens for:

- Spacing
- Font sizes
- Border radii
- Shadows
- Surface colours
- Text colours
- Focus rings
- Breakpoints
- Maximum content widths
- Control heights
- Animation durations

Use CSS custom properties where practical.

## 7.2 Responsive application shell

Rebuild or refine:

- Navbar
- Page container
- Footer
- Main content spacing
- Mobile navigation
- Desktop navigation
- Toast and notification positioning
- Dialog behaviour
- Loading states

On mobile:

- Navigation should collapse cleanly.
- Important actions should remain easy to reach.
- Long page titles should wrap.
- Secondary actions can move into menus.
- Dialogs may become bottom sheets or full-screen panels where appropriate.

## 7.3 Dashboard responsive structure

### Mobile

Use a single-column workflow.

Recommended order:

1. Mode selector
2. Template selection
3. Template preview
4. Copy or block configuration
5. Variant data
6. Format selection
7. Render summary
8. Render action
9. Progress and downloads

Use collapsible sections to prevent excessive scrolling.

Consider a sticky mobile action bar containing:

- Estimated output count
- Render button
- Current validation status

### Desktop

Use a two or three-column workspace where useful:

- Left: templates or block palette
- Centre: preview and timeline
- Right: properties and brand settings

Do not force the desktop layout onto tablets.

## 7.4 Mobile composer behaviour

The composer requires a distinct mobile interaction model.

Recommended mobile layout:

- Preview at top
- Bottom tab bar or segmented control for:
  - Scenes
  - Content
  - Brand
  - Data
- Selected scene editor opens as a bottom sheet or full-screen panel
- Timeline becomes a vertical ordered list
- Reordering supports move-up and move-down buttons as well as drag and drop
- Block palette opens as a searchable drawer
- Preview can be expanded full screen

## 7.5 Responsive variant data editor

Do not display a wide spreadsheet table unchanged on mobile.

Implement two responsive modes:

### Desktop

- Table interface
- Sticky headers
- Horizontal scrolling inside the table container only
- Column management
- Bulk editing
- Validation indicators

### Mobile

- One card per variant
- Variant number or name
- Key field summary
- Expand to edit all fields
- Previous and next navigation
- Duplicate and delete actions
- Validation errors shown inside the card

For large data sets, mobile users should be encouraged to upload CSV rather than manually edit hundreds of rows.

## 7.6 Responsive render results

On mobile:

- Show each output as a card
- Include variant name
- Format
- Status
- Download button
- Retry action where needed

On desktop:

- Show a compact table or grouped grid
- Allow filtering by variant and format

## Testing

Use automated viewport tests with Playwright.

Required screenshots:

- 360 × 800
- 390 × 844
- 430 × 932
- 768 × 1024
- 1024 × 768
- 1440 × 900

## Acceptance criteria

- No page-level horizontal scrolling at 320 px width.
- Core workflows work using touch only.
- Core workflows work using keyboard only.
- Forms remain readable at all supported widths.
- The composer is genuinely usable on mobile.
- Lighthouse accessibility and mobile usability results are recorded.
- Visual regression screenshots are stored for important screens.

---

# 8. Phase 2: Template Registry as a Runtime Capability

The AI must always know which templates, blocks, scenes, animation presets and style presets are currently available.

Do not hard-code a static list inside the AI prompt.

## 8.1 Create a canonical capability registry

Create a central registry that describes all currently available capabilities.

It should include:

### Templates

- ID
- Name
- Description
- Category
- Recommended use cases
- Supported formats
- Required fields
- Optional fields
- Default blocks
- Preview image
- Version
- Status
- Tags

### Blocks

- ID
- Name
- Description
- Category
- Compatible schemas
- Content fields
- Default duration
- Required brand settings
- Supported animation types
- Tags
- Example uses

### Animation presets

- ID
- Name
- Description
- Supported entry or exit position
- Parameter limits
- Compatible block types

### Style presets

- ID
- Name
- Description
- Colours
- Typography
- Background treatment
- Default animations
- Suitable industries
- Tags

## 8.2 API endpoints

Add endpoints such as:

```text
GET /api/v1/capabilities
GET /api/v1/templates
GET /api/v1/templates/:id
GET /api/v1/blocks
GET /api/v1/styles
GET /api/v1/animations
```

`GET /api/v1/capabilities` should return a compact machine-readable summary suitable for AI use.

## 8.3 Runtime discovery

Every AI template generation request must:

1. Fetch the current capability registry.
2. Include only currently enabled templates and blocks.
3. Ask the model to select from those capabilities.
4. Reject references to unknown or disabled IDs.
5. Validate the returned specification.
6. Record the capability registry version used for generation.

This ensures that a template or block added next week becomes available to AI generation without rewriting the AI integration.

## 8.4 Capability versioning

Generate a deterministic registry version or hash.

Store it with:

- AI generation requests
- Saved templates
- Render jobs

This allows debugging when available capabilities change.

## Acceptance criteria

- Adding a new block to the registry makes it appear in the composer and AI capability endpoint.
- The AI does not require a manually updated hard-coded template list.
- Disabled blocks cannot be selected.
- Every AI-generated template records the capability version it used.
- Unknown block IDs fail validation with a useful error.

---

# 9. Phase 3: Per-Variant Branding and Media

This is the highest-value product feature for proving batch variation.

## 9.1 Placeholder support in brand settings

Allow placeholders in:

- `brandColor`
- `secondaryColor`
- `accentColor`
- `backgroundColor`
- `logoUrl`
- `backgroundImageUrl`

Example:

```json
{
  "brandColor": "{{brand_color}}",
  "logoUrl": "{{logo_url}}",
  "backgroundImageUrl": "{{property_image_url}}"
}
```

Resolve these fields using the same per-variant placeholder system used for text.

## 9.2 Media fields

Add support for:

- Property image
- Product image
- Logo
- Background image
- Agent or speaker image
- Optional image arrays later

## 9.3 Image treatment controls

Each image block should support:

- Cover
- Contain
- Fit width
- Fit height
- Focal point
- Horizontal position
- Vertical position
- Optional dark overlay
- Optional blur
- Optional gradient overlay

## 9.4 Security

Validate external URLs.

Protect against:

- Invalid schemes
- Localhost requests
- Private network requests
- Unexpected redirects
- Excessively large downloads
- Unsupported MIME types

Prefer uploaded and controlled assets over arbitrary remote URLs for commercial use.

## 9.5 Responsive editing

On mobile, media fields should provide:

- Large upload controls
- Image thumbnail
- Replace button
- Remove button
- Crop or focal point control
- Clear error messages

## Acceptance criteria

- Two rows in the same batch can use different colours.
- Two rows can use different logos.
- Two rows can use different primary images.
- Invalid media produces a clear row-specific error.
- Image rendering works in every supported video format.
- Missing optional images use a safe fallback.

---

# 10. Phase 4: Animation Presets

Add a small curated set of deterministic Remotion animation presets.

## Initial presets

Entry:

- Fade in
- Slide in left
- Slide in right
- Slide in up
- Slide in down
- Zoom in
- Bounce in
- None

Exit:

- Fade out
- Slide out left
- Slide out right
- Slide out up
- Slide out down
- Zoom out
- None

## Schema

Each block should support:

```ts
animationIn?: {
  preset: string;
  durationFrames?: number;
  intensity?: number;
};

animationOut?: {
  preset: string;
  durationFrames?: number;
  intensity?: number;
};
```

Using objects rather than plain strings leaves room for controlled parameters without requiring a timeline editor.

## UI

Desktop:

- Preset grid in BlockEditor
- Small visual preview
- Entry and exit tabs
- Duration control
- Intensity control where supported

Mobile:

- Horizontally scrollable preset chips or cards
- Large tap areas
- Preview selected animation
- Sensible defaults

## Acceptance criteria

- Animations render deterministically.
- The same animation works across all formats.
- Invalid preset IDs are rejected.
- Entry and exit animations do not exceed block duration.
- Users can reset to defaults.
- Mobile controls remain usable at 320 px.

---

# 11. Phase 5: Persistent Jobs and Multi-User-Ready Data Model

Do this before presenting the system as a commercial API.

## 11.1 Persist render jobs

Replace the in-memory Map with persistent storage.

A render job should store:

- ID
- Organisation ID
- User ID where available
- Template ID
- Template version
- Input data snapshot
- Requested formats
- Status
- Progress
- Error details
- Estimated completion time
- Created time
- Started time
- Completed time
- Output records
- Retry count

## 11.2 Job statuses

Use explicit statuses:

- queued
- validating
- rendering
- packaging
- completed
- partially_completed
- failed
- cancelled

## 11.3 Queue abstraction

Create a queue interface.

Initial implementation may run locally in-process, but queue state must be persisted.

Later implementations may use:

- pg-boss
- BullMQ and Redis
- A managed queue
- Remotion Lambda adapter

Do not bind API routes directly to one queue technology.

## 11.4 Tenant isolation

Every job, template, asset and API key must be associated with an organisation.

Even if authentication is temporarily mocked, route and service signatures should accept a tenant context.

Example:

```ts
type RequestContext = {
  userId: string;
  organisationId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
};
```

Never accept `organisationId` directly from the request body as proof of access.

## Acceptance criteria

- Restarting the API does not lose jobs.
- Users can retrieve only jobs belonging to their organisation.
- Failed jobs retain useful diagnostics.
- Individual failed outputs can be retried.
- Output files have ownership metadata.
- Job history supports pagination.

---

# 12. Phase 6: AI Provider Abstraction

The prompt-to-template feature must not be tied directly to one AI vendor.

## 12.1 Provider interface

Create an AI provider interface such as:

```ts
interface AiProvider {
  generateTemplateSpec(input: TemplateGenerationInput): Promise<TemplateGenerationResult>;
}
```

Implement adapters separately.

Potential adapters:

- OpenRouter
- OpenAI-compatible endpoint
- OpenCode-compatible testing endpoint, if it provides an appropriate callable API
- Local model endpoint later

## 12.2 Recommended initial provider

Use OpenRouter for the first stable implementation because it provides a standard API and allows model switching without changing the application architecture.

An OpenCode API key may be used for development testing only if:

- It supports the required API calls
- Its usage terms allow application integration
- It can reliably return structured output
- The key is stored server-side
- It is not exposed to the frontend
- The adapter remains replaceable

Do not build the product around an undocumented or developer-specific OpenCode behaviour.

## 12.3 Configuration

Use environment variables:

```text
AI_PROVIDER=openrouter
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
AI_TIMEOUT_MS=
AI_MAX_RETRIES=
AI_DAILY_COST_LIMIT=
```

Never expose provider keys in:

- Client-side JavaScript
- Cloudflare Pages environment variables available to the browser
- Logs
- Render output
- Saved template JSON

## 12.4 Structured output

Require the AI to return JSON matching an explicit schema.

Use:

- JSON schema or structured output mode where supported
- Zod validation
- Strict unknown-key rejection
- Controlled repair attempt
- Maximum two AI repair attempts
- Clear user-facing failure state

## 12.5 Cost controls

Record:

- Provider
- Model
- Input tokens
- Output tokens
- Estimated cost
- Latency
- Success or failure
- Organisation
- User
- Generation purpose

Add:

- Per-user rate limits
- Per-organisation limits
- Daily cost cap
- Maximum prompt length
- Maximum output size
- Timeout
- Retry rules

## Acceptance criteria

- Providers can be changed through configuration.
- API keys never reach the browser.
- Malformed AI output cannot reach the renderer.
- Every AI call is recorded.
- Cost limits are enforced.
- Provider failures produce a useful error and do not corrupt saved templates.

---

# 13. Phase 7: Prompt-to-Template

## 13.1 User workflow

The user enters:

- Description
- Intended platform
- Duration
- Industry or use case
- Preferred style
- Required information
- Optional brand assets
- Preferred aspect ratios

Example:

> Create a 15-second modern property listing video. Use navy and white. Show the address, price, bedrooms, bathrooms and agent details. Make it suitable for Instagram Reels and Facebook.

## 13.2 Generation pipeline

1. Validate the user's request.
2. Fetch the current capability registry.
3. Retrieve the user's organisation brand settings where available.
4. Build a model request containing:
   - Current templates
   - Current blocks
   - Current styles
   - Current animation presets
   - Allowed placeholders
   - Output schema
   - Safety rules
5. Ask the AI to choose:
   - An existing template where appropriate
   - A block composition where no existing template is sufficient
6. Validate returned JSON.
7. Reject unavailable IDs.
8. Calculate duration.
9. Extract required placeholders.
10. Render preview stills.
11. Present the proposed template to the user.
12. Allow edits.
13. Save it as a user template.
14. Collect variant data.
15. Render videos.

## 13.3 Existing-template preference

The AI should not always construct a new block composition.

Use this selection order:

1. Reuse an existing complete template when it closely matches.
2. Reuse an existing template with safe content and brand changes.
3. Build from available blocks when no complete template is suitable.
4. Explain when the requested design cannot be produced with current capabilities.

The AI must not invent blocks, templates, fonts or animation presets.

## 13.4 Template selection scoring

Provide the model or deterministic pre-selection system with:

- Industry match
- Use-case match
- Required-field coverage
- Duration compatibility
- Aspect-ratio support
- Media requirements
- Style compatibility
- Template status
- Template version

Consider implementing a deterministic shortlist before calling the AI.

For example:

1. Filter disabled templates.
2. Score metadata and tags.
3. Send the top five templates plus relevant blocks to the AI.
4. Allow the AI to select or compose.

This reduces token use and improves reliability as the registry grows.

## 13.5 AI output schema

The result should include:

```ts
type GeneratedTemplateProposal = {
  name: string;
  description: string;
  selectionMode: 'existing-template' | 'block-composition';
  baseTemplateId?: string;
  blocks: GeneratedBlock[];
  brandSettings: BrandSettings;
  requiredPlaceholders: PlaceholderDefinition[];
  recommendedFormats: VideoFormat[];
  fps: number;
  width: number;
  height: number;
  estimatedDurationFrames: number;
  explanation: string;
  capabilityRegistryVersion: string;
};
```

## 13.6 Preview before rendering

Do not immediately render a full batch.

Generate:

- One or more still frames
- Optionally a low-resolution preview video
- Placeholder sample data

The user must be able to:

- Approve
- Edit
- Regenerate
- Change style
- Replace blocks
- Change animation presets

## 13.7 Mobile experience

On mobile, prompt-to-template should be a guided wizard:

1. Describe video
2. Select goal
3. Add brand
4. Review suggested structure
5. Preview
6. Add data
7. Render

Avoid presenting a large desktop composer immediately after generation.

## Acceptance criteria

- The AI reads the current registry for every generation.
- Newly added enabled templates become available automatically.
- Removed or disabled templates are not selected.
- Unknown IDs never reach rendering.
- The user sees a preview before batch rendering.
- Generated templates remain editable in the composer.
- Failed generation does not consume an unlimited number of retries.
- Saved generated templates record provider, model and capability version.

---

# 14. Phase 8: Commercial REST API

Create a documented public API.

## Initial endpoints

```text
POST   /api/v1/templates
GET    /api/v1/templates
GET    /api/v1/templates/:id
PATCH  /api/v1/templates/:id
DELETE /api/v1/templates/:id

POST   /api/v1/renders
GET    /api/v1/renders/:id
POST   /api/v1/renders/:id/cancel
POST   /api/v1/renders/:id/retry
GET    /api/v1/renders/:id/files
GET    /api/v1/renders/:id/zip

POST   /api/v1/ai/template-proposals
GET    /api/v1/capabilities
```

## API key security

- Store only hashed API keys.
- Show the full key only once.
- Support revoke and rotate.
- Record last-used time.
- Support scopes.
- Apply organisation limits.
- Never log full keys.

## Idempotency

Support idempotency keys for render creation.

This prevents external agents from accidentally creating duplicate render batches.

## Webhooks

Support events:

- render.started
- render.progress
- render.completed
- render.partially_completed
- render.failed

Webhook requirements:

- Signature verification
- Retry schedule
- Delivery logs
- Disable after repeated failure
- Manual redelivery
- No secret data in payloads

## Documentation

Generate:

- OpenAPI specification
- Example curl requests
- JavaScript example
- Python example
- n8n example
- Error reference
- Rate-limit documentation

## Acceptance criteria

- API keys are tenant-scoped.
- Duplicate idempotent requests do not create duplicate jobs.
- Webhooks are signed.
- All endpoints have consistent error responses.
- OpenAPI documentation matches actual behaviour.
- Existing frontend uses the same service layer where practical.

---

# 15. Phase 9: MCP Server

The MCP server should wrap stable service-layer functionality rather than duplicate business logic.

## Initial MCP tools

- `list_templates`
- `get_template`
- `list_capabilities`
- `create_template_from_prompt`
- `render_videos`
- `get_render_status`
- `get_render_files`
- `cancel_render`

## MCP design rules

- Use the same authentication and tenant rules as the REST API.
- Validate every tool input with Zod.
- Return concise structured responses.
- Do not return huge binary files directly.
- Return secure download references.
- Do not expose internal server paths.
- Require explicit confirmation in the client before costly large render jobs where appropriate.
- Include estimated output count and estimated cost before starting large jobs.

## Dynamic capability use

`create_template_from_prompt` must call the same runtime capability service used by the web application.

The MCP server must not contain its own stale list of templates.

## Acceptance criteria

- An MCP client can discover current templates.
- An MCP client can create a validated proposal from a prompt.
- An MCP client can start a render.
- Render status survives server restart.
- Tenant boundaries are enforced.
- The MCP implementation uses the shared application services.

---

# 16. Phase 10: Authentication and Multi-User Product

The internal data model should already support this before the UI is introduced.

## Required capabilities

- Sign up
- Sign in
- Password reset or passwordless login
- Organisation creation
- Team invitations
- Roles
- Profile
- API key management
- Usage dashboard
- Template ownership
- Render history
- Asset library

## Suggested roles

- Owner
- Admin
- Editor
- Viewer
- API service account

## Permissions

### Owner

- Billing
- Organisation deletion
- Member management
- All content

### Admin

- Member management
- API keys
- Templates
- Renders
- Assets

### Editor

- Create and edit templates
- Upload assets
- Run renders
- Use AI generation

### Viewer

- View templates
- View render history
- Download outputs

## Acceptance criteria

- Users cannot access another organisation's data.
- Membership is checked in service-layer code.
- Role changes take effect immediately.
- Invitations expire.
- Audit events are recorded for sensitive actions.

---

# 17. Phase 11: Reliability, Security and Operations

## Security

Implement:

- Secure headers
- CORS allowlist
- Request body limits
- File upload limits
- MIME validation
- Rate limiting
- API key hashing
- Tenant checks
- Signed asset URLs where needed
- SSRF protection
- Input sanitisation
- Structured audit logging
- Secrets management
- Dependency scanning
- Regular backups

## Rendering safety

Set limits for:

- Maximum variants per job
- Maximum formats per job
- Maximum duration
- Maximum image size
- Maximum total downloaded media
- Maximum concurrent renders
- Maximum retries
- Maximum ZIP size

## Observability

Record:

- API latency
- AI latency
- Render duration
- Queue wait time
- Failed render count
- Browser or FFmpeg failures
- Storage use
- AI cost
- Output count
- Webhook failures

Use structured logs with:

- Request ID
- Job ID
- User ID
- Organisation ID
- Template ID

Do not log:

- API keys
- AI provider keys
- Passwords
- Full private customer data
- Sensitive asset URLs unnecessarily

## Backup

Back up:

- Database
- Saved templates
- Organisation settings
- Asset metadata
- Critical uploaded assets

Rendered outputs may use a separate retention policy because they can often be regenerated.

---

# 18. Phase 12: Testing Strategy

## Unit tests

Cover:

- Placeholder resolution
- Brand placeholder resolution
- Capability filtering
- Template scoring
- Zod schemas
- Animation functions
- Duration calculation
- Tenant access checks
- API key verification
- AI output validation
- AI repair logic
- Usage limits

## Integration tests

Cover:

- Create template
- Create render job
- Persist job
- Restart and retrieve job
- Upload asset
- Use asset in render
- Generate AI proposal
- Reject unknown block
- Render multiple variants and formats
- Download ZIP
- Webhook retry

## Remotion tests

Render:

- Still frames
- Short sample videos
- Every block
- Every animation
- Every supported aspect ratio
- Missing optional fields
- Very long text
- Unicode and euro symbols
- Large and small images

## End-to-end tests

Use Playwright for:

- Mobile quick mode
- Mobile composer
- Desktop quick mode
- Desktop composer
- CSV upload
- Prompt-to-template
- Preview approval
- Render progress
- Download
- Account switching
- Permission restrictions

## Visual regression

Store screenshots for:

- Landing page
- Dashboard
- Template selection
- Composer
- Variant editor
- Prompt wizard
- Preview
- Render history
- Mobile navigation
- Error states
- Empty states

---

# 19. Suggested Build Order

Follow this order unless Codex identifies a blocking dependency.

## Milestone 1: Stabilise

- Current-state audit
- Baseline tests
- Smoke-render scripts
- Architecture documentation

## Milestone 2: Mobile-first foundation

- Responsive design tokens
- App shell
- Dashboard
- Quick mode
- Composer mobile interaction
- Responsive variant editor
- Responsive results

## Milestone 3: Dynamic capability registry

- Canonical registry
- Runtime capability endpoint
- Registry versioning
- Frontend integration

## Milestone 4: Better variants

- Per-row colours
- Per-row logos
- Per-row images
- Image treatment controls
- Responsive asset controls

## Milestone 5: Animation system

- Animation registry
- Schema
- Renderer integration
- Mobile and desktop controls

## Milestone 6: Commercial data foundation

- Persistent database
- Tenant-aware repositories
- Persisted render jobs
- Queue abstraction
- Job history

## Milestone 7: AI foundation

- Provider abstraction
- OpenRouter adapter
- Optional OpenCode-compatible test adapter
- Structured outputs
- Usage and cost tracking

## Milestone 8: Prompt-to-template

- Prompt wizard
- Dynamic capability selection
- Template scoring
- Proposal validation
- Preview
- Save and edit

## Milestone 9: Public API

- API keys
- Versioned endpoints
- Idempotency
- Webhooks
- OpenAPI documentation

## Milestone 10: MCP

- MCP tools
- Tenant authentication
- Shared service layer
- Agent-safe limits

## Milestone 11: Accounts

- Authentication
- Organisations
- Members and roles
- Usage dashboard
- Asset library

## Milestone 12: Production deployment

- Hetzner
- Process management
- Reverse proxy
- TLS
- Backups
- Monitoring
- Storage policies
- Production smoke tests

## Milestone 13: Billing

Add billing only after the principal workflow has been tested with real users.

---

# 20. Immediate Next Sprint

The next sprint should not begin with AI or MCP.

Complete these items first:

1. Audit the current responsive behaviour.
2. Build the mobile-first application shell.
3. Make Quick Mode excellent on mobile.
4. Create a usable mobile composer interaction model.
5. Create the canonical capability registry.
6. Add a capability endpoint.
7. Add placeholder resolution to brand colours.
8. Add per-variant image URL support.
9. Add sample property CSV data containing images and branding.
10. Add responsive tests and screenshots.
11. Have Codex review the architecture before merging.

The reason for prioritising the capability registry early is that the composer, REST API, MCP server and prompt-to-template feature must all use the same source of truth.

---

# 21. Definition of Done for Every Feature

A feature is not complete merely because it works once on the developer's desktop.

It is complete only when:

- The implementation matches the approved plan.
- TypeScript passes.
- Tests pass.
- Error states are implemented.
- Loading states are implemented.
- Empty states are implemented.
- Mobile behaviour is tested.
- Desktop behaviour is tested.
- Keyboard access is tested.
- Touch interaction is tested.
- Tenant ownership is considered.
- Security implications are reviewed.
- Documentation is updated.
- Codex reviews and approves the diff.
- No unrelated regressions are introduced.

---

# 22. Important Architectural Restrictions

Do not:

- Generate and execute arbitrary React code from AI output.
- Expose AI API keys to the browser.
- Hard-code a template list inside AI prompts.
- Create separate capability registries for the UI, API and MCP server.
- Add new global database records without ownership.
- Bind business logic directly to Express route handlers.
- Bind rendering directly to one queue provider.
- Depend permanently on the mini PC for production.
- Introduce billing before the core workflow is validated.
- Build a complex timeline editor for animation presets.
- Assume desktop layouts will automatically work on mobile.
- Accept arbitrary remote media URLs without security controls.
- Store plaintext API keys.
- Trust AI-generated JSON without strict validation.

---

# 23. Strategic Product Positioning

Vary.video should avoid competing primarily as a general-purpose video editor.

Its strongest position is:

> A programmable video-generation platform for structured data, business automation and AI agents.

The initial vertical should remain real estate because the project already contains relevant property templates and blocks, and property data maps naturally to batch generation.

The initial flagship demonstration should be:

1. Upload a property CSV.
2. Include a different image, price and address per row.
3. Generate portrait, square and landscape videos.
4. Download all videos.
5. Repeat the same workflow through the API.
6. Repeat it through an AI agent using MCP.
7. Generate a new property template through a natural-language prompt using the currently available block registry.

That demonstration communicates the complete Vary.video vision more clearly than adding many unrelated fixed templates.

---

# 24. Final Instruction to Raybot

Begin by asking Codex to inspect the current repository and turn **Phase 0, Phase 1 and Phase 2** into a file-level implementation plan.

Codex should identify:

- Files to modify
- New files to create
- Shared types to consolidate
- Responsive components to refactor
- Registry duplication to remove
- Tests to add
- Risks
- Migration steps
- Commit boundaries

After Codex approves the plan, use DeepSeek through OpenCode Go for the normal implementation work.

Codex must review every major diff before it is considered complete.

Do not begin prompt-to-template development until:

- The mobile-first UI foundation is stable
- The capability registry is canonical
- Per-variant images work
- Templates can be validated from structured specifications
- Persistent storage design has been approved
