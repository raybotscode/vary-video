VARY.VIDEO V2 MASTER DEVELOPMENT ROADMAP

PURPOSE

This document is the master development brief for Raybot to build Vary.video v2.

It defines the product direction, why v2 is needed, what should be rebuilt, what should be retained from v1, the v2 architecture, the new template document model, the editor and Remotion rendering architecture, Cloudflare and render-server responsibilities, multi-user requirements, AI generation, the capability registry, the phased roadmap, testing, acceptance criteria, migration strategy and the required Codex review workflow.

This is a large build. Do not treat it as one coding task.

Every major phase must follow this sequence:

1. Codex inspects the relevant code and plans the work.
2. Raybot creates the implementation branch and manages execution.
3. DeepSeek performs most routine coding.
4. Raybot runs all tests and checks.
5. Codex reviews the complete diff.
6. Raybot applies corrections using DeepSeek or Codex as appropriate.
7. Codex performs final acceptance review.
8. Raybot merges only after approval.
9. Documentation and the technical overview are updated.

Do not begin a later architectural phase until the previous phase has met its acceptance criteria unless Codex explicitly approves parallel work.


============================================================
1. EXECUTIVE OVERVIEW
============================================================

Vary.video began as a batch video variant generator.

The original promise remains strong:

Create one reusable video template, add merge tags such as {{headline}}, {{price}}, {{location}}, {{imageUrl}} and {{brandColor}}, then upload CSV or JSON data and generate many personalised videos in multiple aspect ratios.

The proven v1 strengths include:

- Remotion video rendering
- AI-assisted template generation
- CSV and JSON variant input
- Merge-tag resolution
- Batch rendering
- Template discovery and gallery concepts
- Multi-aspect output
- Persistent render jobs
- Validation with Zod
- OpenRouter integration
- Existing test infrastructure
- Hundreds of tests and production learnings

The main architectural failure in v1 was the editing system.

The v1 block model was designed for sequential scene blocks, form-based configuration, preview and batch rendering. It was not designed for direct manipulation, dragging, resizing, rotation, layering, overlapping elements, per-element timing, responsive layout overrides or a Canva-like editor.

Attempts to bolt a direct-manipulation editor onto the existing render structure created competing editing approaches and unreliable behaviour.

The correct v2 direction is:

1. Build a new element-centric template document model.
2. Build a dedicated DOM-based editor.
3. Keep Remotion as the deterministic export engine.
4. Use one shared validated template JSON document for editor and renderer.
5. Build v2 beside v1 rather than rewriting v1 in place.
6. Reuse proven v1 services and patterns where appropriate.
7. Retire the old editor only after v2 reaches functional parity.

The correct architecture is:

- DOM-based editor for interaction
- Remotion-based renderer for final output
- Shared validated template document between both


============================================================
2. HIGH-LEVEL PRODUCT VISION
============================================================

Vary.video v2 should become a mobile-first, multi-user-ready, data-driven video creation and rendering platform where users and AI agents can build reusable templates, populate them with structured data and generate personalised videos at scale.

The platform should support four main creation flows.

FLOW 1: EXISTING TEMPLATE

1. Select an existing template.
2. Add or import variant data.
3. Select output formats.
4. Render one or many videos.

FLOW 2: VISUAL EDITOR

1. Create a template using text, image, shape and later video elements.
2. Position and style elements directly on a visual stage.
3. Create multiple scenes.
4. Define timing and animation.
5. Add merge tags.
6. Save the template.
7. Use it for batch rendering.

FLOW 3: PROMPT-TO-TEMPLATE

1. The user describes a video in plain language.
2. The system checks the current template and capability registry.
3. Existing templates are scored and reused when appropriate.
4. A new validated template document is generated only when needed.
5. The AI uses only available elements, animation presets, fonts, styles and aspect ratios.
6. A preview is shown before saving or rendering.

FLOW 4: API AND MCP

External systems and AI agents can:

- List templates
- Discover current capabilities
- Generate a template from a prompt
- Submit variant data
- Start render jobs
- Monitor render status
- Retrieve output files


============================================================
3. DEVELOPMENT OPERATING MODEL
============================================================

CODEX ROLE

Codex acts as senior architect, technical planner, code reviewer, security reviewer, data-model reviewer, migration reviewer, test-plan reviewer and final acceptance reviewer.

Codex must be used before implementation for every major phase.

Codex must:

1. Inspect the current repository and relevant files.
2. Produce a file-level implementation plan.
3. Identify dependencies and risks.
4. Define schemas and interfaces where architecture is involved.
5. Define test requirements.
6. Review the implementation diff.
7. Identify regressions and missing cases.
8. Approve or reject the phase against acceptance criteria.

Codex may also code when:

- The task is security-sensitive
- The task involves database migrations
- The task involves difficult TypeScript architecture
- The task involves complex Remotion rendering
- DeepSeek fails twice on the same focused problem
- Raybot needs a precise correction rather than another broad attempt

RAYBOT ROLE

Raybot is responsible for managing the implementation process, creating branches, assigning coding work to DeepSeek, running tests, resolving environment issues, keeping commits small, updating documentation, applying Codex review feedback and maintaining roadmap status.

DEEPSEEK ROLE

DeepSeek should perform most routine coding work, including:

- React components
- CSS and responsive layouts
- API routes
- Database repositories
- Validation schemas
- Utilities
- Unit tests
- Integration tests
- Routine refactors
- Documentation updates
- Error and loading states
- Small and medium bug fixes

REQUIRED WORKFLOW PER PHASE

1. Codex inspects the codebase.
2. Codex writes the implementation plan.
3. Raybot creates a dedicated branch.
4. DeepSeek implements the approved plan.
5. Raybot runs all required checks.
6. Codex reviews the diff.
7. DeepSeek or Codex applies corrections.
8. Raybot reruns tests.
9. Codex performs final acceptance review.
10. Raybot merges only after approval.
11. Raybot updates the changelog, technical overview, architecture documents, phase status and known issues.

COMMIT RULES

Use small, reviewable commits.

Good examples:

- Add v2 document schema
- Add text element definition
- Add selection model
- Add undo history
- Add D1 migration
- Add Remotion scene renderer
- Add mobile stage layout

Avoid large mixed commits such as:

- Build entire editor
- Fix everything
- Massive refactor
- Complete v2

Do not combine architecture changes, UI redesign, database migrations and render changes in one commit.


============================================================
4. V1 STRATEGY: KEEP, ADAPT AND RETIRE
============================================================

Do not delete v1 at the start.

Freeze the old editor and treat v1 as:

- A working batch-render reference
- A source of proven patterns
- A migration source
- A regression comparison
- A fallback during v2 development

KEEP OR ADAPT

Review and reuse where practical:

- Remotion renderer setup
- FFmpeg and Chromium configuration
- Batch rendering orchestration
- Job progress concepts
- ZIP generation
- Download handling
- OpenRouter integration
- AI provider configuration
- AI template scoring
- CSV parsing
- JSON parsing
- Merge-tag parsing and resolution
- Template gallery concepts
- Template visibility concepts
- Persistent render-job patterns
- Shared Zod validation patterns
- Existing tests that remain relevant
- Multi-aspect output logic
- Error-reporting patterns

REBUILD

Build new v2 implementations for:

- Template document schema
- Scene model
- Element model
- Editor stage
- Direct manipulation
- Layers
- Properties panel
- Timeline
- Editor playback
- Aspect-ratio overrides
- Undo and redo
- Asset browser
- V2 AI output schema
- V2 Remotion document interpreter

RETIRE LATER

Plan to retire:

- Old EditPanel
- Old EditCanvas
- Old EditOverlay
- Unreliable contentEditable implementation
- Competing editing state systems
- Block-sequence assumptions in the editor
- Transition doubling logic
- Temporary editing workarounds
- Renderer state mixed with selection state

Retirement should happen only after v2 supports template creation, editing, merge tags, single render, batch render, multiple aspect ratios, save and load, and stable preview.


============================================================
5. REPOSITORY AND PACKAGE STRUCTURE
============================================================

Preferred approach: preserve repository history and gradually evolve toward a monorepo-style structure.

Suggested structure:

vary-video/
  apps/
    web/
    api-worker/
    render-server/
  packages/
    document-schema/
    element-registry/
    editor-renderers/
    remotion-renderers/
    merge-tags/
    animation-presets/
    capability-registry/
    shared-types/
    database/
    auth/
  legacy/
    v1-editor/
  docs/
  migrations/
  tests/

Codex must inspect the actual repository before deciding whether files should be moved immediately.

Do not perform a large physical reorganisation before baseline tests pass, import boundaries are understood, shared modules are identified and a migration plan exists.

A gradual migration is likely safer than moving everything at once.


============================================================
6. V2 TEMPLATE DOCUMENT MODEL
============================================================

The v2 document must be:

- Versioned
- JSON serialisable
- Strictly validated
- Deterministic
- Independent from editor UI state
- Independent from React component implementation
- Suitable for AI generation
- Suitable for Remotion rendering
- Suitable for database storage
- Suitable for future migrations

BASE DOCUMENT

Recommended structure:

{
  "schemaVersion": 2,
  "id": "template-id",
  "name": "Product Launch",
  "description": "Short product launch video",
  "fps": 30,
  "defaultAspectRatio": "16:9",
  "supportedAspectRatios": ["16:9", "9:16", "1:1"],
  "scenes": [],
  "mergeTags": [],
  "metadata": {},
  "createdAt": "",
  "updatedAt": ""
}

SCENE MODEL

Each scene should include:

{
  "id": "scene-1",
  "name": "Opening",
  "durationFrames": 90,
  "background": {
    "type": "solid",
    "color": "#ffffff"
  },
  "elements": []
}

Initial background types:

- Solid colour
- Gradient
- Image
- Video later

ELEMENT MODEL

Each element should include:

{
  "id": "headline",
  "type": "text",
  "name": "Headline",
  "visible": true,
  "locked": false,
  "timing": {
    "startFrame": 0,
    "endFrame": 90
  },
  "transform": {
    "x": 0.5,
    "y": 0.4,
    "width": 0.8,
    "height": null,
    "rotation": 0,
    "anchorX": 0.5,
    "anchorY": 0.5,
    "zIndex": 10
  },
  "responsiveOverrides": {},
  "props": {},
  "animation": {}
}

COORDINATE MODEL

Use normalised coordinates where practical:

- x and y from 0 to 1
- width and height from 0 to 1
- rotation in degrees
- anchor values from 0 to 1

Use a consistent definition:

- x and y represent the anchor point
- width and height represent stage proportions
- anchorX and anchorY define how the element is positioned around x and y

Codex must define and document exact transform semantics before editor implementation begins.

TIMING MODEL

Use frames internally.

Do not store timing as floating-point seconds.

The UI may display seconds, but storage and rendering should use:

- startFrame
- endFrame
- durationFrames
- delayFrames

INITIAL ELEMENT TYPES

Start with:

1. Text
2. Image
3. Shape
4. Group only after base elements are stable
5. Video after image and timeline systems are stable

Do not begin with complex masks, motion paths, rich text spans, blend modes, nested compositions or arbitrary user code.

TEXT ELEMENT PROPS

Initial fields:

- content
- fontFamily
- fontSize
- fontWeight
- fontStyle
- lineHeight
- letterSpacing
- color
- textAlign
- verticalAlign
- textTransform
- maxLines
- overflow behaviour
- background colour
- padding
- border radius
- opacity

IMAGE ELEMENT PROPS

Initial fields:

- assetId or source
- fit: cover, contain, fill
- objectPositionX
- objectPositionY
- borderRadius
- opacity
- overlay colour
- overlay opacity
- blur
- shadow

SHAPE ELEMENT PROPS

Initial fields:

- shape type: rectangle, circle, line
- fill
- stroke
- strokeWidth
- borderRadius
- opacity

ANIMATION MODEL

Start with animation presets:

{
  "in": {
    "preset": "slide-up",
    "durationFrames": 15,
    "delayFrames": 0,
    "easing": "ease-out",
    "intensity": 1
  },
  "out": {
    "preset": "fade-out",
    "durationFrames": 9,
    "delayFrames": 0,
    "easing": "ease-in",
    "intensity": 1
  }
}

Initial presets:

- None
- Fade
- Slide left
- Slide right
- Slide up
- Slide down
- Scale in
- Scale out
- Zoom in
- Zoom out
- Bounce in

Do not build arbitrary property keyframes in the first release.

SCHEMA VERSIONING

Every document must include schemaVersion.

Build:

- Migration functions
- Validation functions
- Normalisation functions
- Safe defaults
- Unknown-version errors

Example API:

migrateDocument(document, targetVersion)

Never silently mutate stored documents without recording a migration.


============================================================
7. RESPONSIVE ASPECT-RATIO MODEL
============================================================

Do not assume a 16:9 design can be proportionally scaled into 9:16 and remain usable.

V2 must support per-aspect-ratio overrides.

Recommended model:

{
  "transform": {
    "x": 0.5,
    "y": 0.4,
    "width": 0.8,
    "height": null,
    "rotation": 0
  },
  "responsiveOverrides": {
    "9:16": {
      "x": 0.5,
      "y": 0.3,
      "width": 0.9
    },
    "1:1": {
      "x": 0.5,
      "y": 0.35,
      "width": 0.85
    }
  }
}

Required behaviour:

- New templates have one base layout.
- Switching aspect ratio initially applies proportional placement.
- Users can create format-specific overrides.
- Overrides are stored only when changed.
- Users can reset an override.
- Users can copy one format layout to another.
- Safe zones are visible.
- Text can have format-specific font size.
- Image crop and focal point can differ by format.

Initial formats:

- 16:9
- 9:16
- 1:1

Add 4:5 later after the system is stable.


============================================================
8. EDITOR ARCHITECTURE
============================================================

The editor must be DOM-based.

It must not use the final Remotion renderer as the interactive editing surface.

The editor and Remotion renderer should be separate React trees driven by the same document.

RECOMMENDED COMPONENT STRUCTURE

EditorApp
  Toolbar
  SceneNavigator
  AspectRatioSwitcher
  StageViewport
    StageScaler
    SceneBackground
    ElementLayer
      EditorTextElement
      EditorImageElement
      EditorShapeElement
    SelectionLayer
      BoundingBox
      ResizeHandles
      RotationHandle
      AlignmentGuides
  LayersPanel
  PropertiesPanel
  Timeline
  MobileEditorControls

PERSISTENT DOCUMENT STATE

- Scenes
- Elements
- Styles
- Timing
- Merge tags
- Responsive overrides

TEMPORARY EDITOR STATE

- Selected element IDs
- Hovered element
- Active tool
- Drag state
- Resize state
- Rotation state
- Snapping guides
- Current frame
- Zoom
- Pan
- Open panels
- Inline editing state

Do not save temporary editor state into the template document.

SELECTION

Support:

- Click to select
- Click empty stage to deselect
- Select from layers panel
- Delete selected element
- Duplicate selected element
- Lock element
- Hide element

Begin with single selection.

Add multi-selection only after the basic editor is stable.

DRAGGING

Dragging must:

- Use pointer events
- Work with mouse and touch
- Respect stage scaling
- Convert screen movement to normalised document coordinates
- Support snapping
- Respect locked elements
- Support keyboard nudging
- Commit one history entry per completed drag, not per pointer movement

RESIZING

Support:

- Corner handles
- Side handles
- Aspect-ratio lock
- Minimum dimensions
- Stage bounds
- Image crop behaviour
- Text auto-height where appropriate

ROTATION

Support:

- Rotation handle
- Numeric property input
- Shift snapping to common angles
- Stable transform origin

SNAPPING

Initial targets:

- Stage centre
- Stage edges
- Safe-zone edges
- Other element edges
- Other element centres

Show temporary alignment guides.

UNDO AND REDO

Undo and redo are required early.

Must support:

- Add element
- Delete element
- Move
- Resize
- Rotate
- Property changes
- Scene changes
- Reordering
- Timing changes

Do not add one undo record for every keystroke or pointer movement.

INLINE TEXT EDITING

Avoid uncontrolled contentEditable as the sole editing system.

Initial approach:

- Double-click text element to enter edit mode.
- Position a controlled text editor over the element.
- Preserve raw merge-tag text.
- Show resolved values outside edit mode.
- Commit on blur or keyboard command.
- Escape cancels.
- Properties panel remains available.

Do not implement full rich text initially.

Use one style per text element.

LAYERS PANEL

Support:

- Element names
- Selection
- Visibility
- Locking
- Reordering
- Duplicate
- Delete

TIMELINE

Initial timeline:

- One timeline per scene
- Element bars
- Start frame
- End frame
- Entry animation region
- Exit animation region
- Drag bars
- Trim start
- Trim end
- Current playhead
- Play and pause
- Loop scene

Do not build an After Effects-style graph editor initially.

PROPERTIES PANEL

The panel should be schema-driven where practical.

Text controls:

- Content
- Font
- Size
- Weight
- Alignment
- Colour
- Background
- Spacing
- Transform
- Timing
- Animation

Image controls:

- Asset
- Fit
- Crop position
- Border radius
- Opacity
- Overlay
- Transform
- Timing
- Animation

Shape controls:

- Shape
- Fill
- Stroke
- Border radius
- Transform
- Timing
- Animation


============================================================
9. MOBILE-FIRST EDITOR
============================================================

V2 must be mobile-first across the product.

The full editor will naturally be more capable on desktop, but mobile must still support meaningful editing.

VIEWPORT TARGETS

Test at:

- 320 px
- 360 px
- 390 px
- 430 px
- 768 px
- 1024 px
- 1440 px

MOBILE EDITOR LAYOUT

Recommended:

- Compact top toolbar
- Aspect-ratio control
- Stage preview
- Bottom mode tabs:
  - Scenes
  - Elements
  - Properties
  - Timeline
  - Data
- Properties as a bottom sheet
- Element library as a drawer
- Timeline can expand full screen
- Minimum 44 px touch targets
- No page-level horizontal scrolling

Mobile must support:

- Select
- Move
- Resize
- Change content
- Change colour
- Replace image
- Change timing
- Change animation
- Add and remove scenes
- Save
- Preview
- Render

DESKTOP LAYOUT

Recommended:

- Left: scenes, elements and layers
- Centre: stage
- Right: properties
- Bottom: timeline
- Top: toolbar, aspect ratio, undo, redo, preview and save

TABLET LAYOUT

Use collapsible side panels. Do not force desktop columns onto tablets.

ACCESSIBILITY

Support:

- Keyboard navigation
- Visible focus states
- ARIA labels
- Accessible dialogs
- Colour contrast
- Reduced-motion option
- Non-drag alternatives for reordering
- Screen-reader-friendly labels


============================================================
10. EDITOR PREVIEW AND FINAL RENDERING
============================================================

Use two preview systems.

FAST EDITOR PREVIEW

Purpose:

- Editing
- Selection
- Dragging
- Resizing
- Fast playback simulation

Implementation:

- DOM elements
- CSS transforms
- CSS or JavaScript animation simulation
- Current-frame state
- Lightweight playback

This preview does not need to be perfectly pixel-identical.

ACCURATE RENDER PREVIEW

Purpose:

- Verify final output
- Compare editor and render
- Confirm fonts, media and animation
- Generate still previews
- Generate low-resolution preview videos

Implementation:

- Remotion Player or render endpoint
- Read-only
- Final document interpreter

PREVIEW FIDELITY

Create comparison tests.

For every base element:

- Render editor snapshot
- Render Remotion still
- Compare layout and style
- Allow documented tolerances
- Track known differences


============================================================
11. REMOTION V2 RENDERER
============================================================

Build a v2 document interpreter for Remotion.

The renderer receives:

- Immutable template document
- Variant data
- Output aspect ratio
- Asset references
- Font references
- Render settings

RENDERER FLOW

1. Validate template document.
2. Validate schema version.
3. Apply aspect-ratio overrides.
4. Resolve merge tags.
5. Resolve asset references.
6. Calculate scene durations.
7. Calculate total duration.
8. Render scenes in order.
9. Render elements according to zIndex.
10. Apply timing.
11. Apply animation presets.
12. Encode output.
13. Upload to R2.
14. Update job status.

PARALLEL REGISTRY PATTERN

Use an element definition similar to:

ElementDefinition {
  type
  schema
  defaultProps
  editorComponent
  renderComponent
}

Editor and renderer share:

- Type ID
- Zod schema
- Default values
- Capability metadata

They use different React components.

Do not allow editor interaction state into Remotion components.

DETERMINISM

Avoid:

- CSS transitions in final render
- Random values without seeded randomness
- Browser-dependent layout assumptions
- Unvalidated network media
- Uncontrolled font loading

FONTS

Use a controlled font registry.

Each font should include:

- ID
- Family
- Available weights
- Source
- Licence metadata if needed
- Editor availability
- Renderer availability

AI must not invent arbitrary font names.

MEDIA

Prefer R2-controlled assets.

Queued jobs must use immutable asset references.


============================================================
12. MERGE TAG SYSTEM
============================================================

Merge tags remain central to the product.

INITIAL TYPES

- text
- number
- currency
- colour
- image
- boolean
- URL
- date
- video later

Example:

{
  "key": "headline",
  "type": "text",
  "label": "Headline",
  "defaultValue": "Your headline",
  "required": true
}

Supported initial fields:

- Text content
- Text colour
- Background colour
- Shape fill
- Shape stroke
- Image asset
- Image source
- Font size within controlled limits
- Visibility
- CTA text
- Numeric fields

Do not allow tags in every arbitrary internal field initially.

TAG PICKER

Provide:

- Insert-tag button
- Searchable tag picker
- Create new tag
- Tag type
- Default value
- Required status
- Usage list

VARIANT DATA

Support:

- Manual row entry
- CSV import
- JSON import
- Column mapping
- Validation
- Default values
- Errors per row
- Variant preview
- Duplicate row
- Delete row

Large CSV files must not freeze the browser.

RAW VERSUS RESOLVED VALUES

The document stores raw values such as {{headline}}.

The editor can display the resolved sample value.

Never replace the raw merge tag with the preview value.

ASSET TAGS

For commercial use, prefer asset IDs rather than arbitrary external URLs.

External URLs may be supported for development with strict validation.


============================================================
13. CAPABILITY REGISTRY
============================================================

Prompt-to-template must always use current capabilities.

Create one canonical registry describing:

- Available element types
- Element property schemas
- Animation presets
- Fonts
- Style presets
- Supported aspect ratios
- Existing templates
- Merge-tag types
- Media limits
- Enabled and disabled status
- Version information

Do not maintain separate capability lists for editor, AI, API, MCP and renderer.

CAPABILITY VERSION

Generate a deterministic version or hash.

Store it with:

- AI generations
- Saved templates
- Render jobs
- Template versions

RUNTIME AI DISCOVERY

Every prompt-to-template request must:

1. Load current capabilities.
2. Filter disabled items.
3. Shortlist suitable existing templates.
4. Provide relevant capabilities to the AI.
5. Validate returned capability IDs.
6. Reject stale or invented IDs.
7. Record the registry version.

Adding a new element or template later must make it available automatically without manually rewriting the AI prompt.


============================================================
14. AI TEMPLATE GENERATION
============================================================

Use an AI provider abstraction.

INITIAL PROVIDER

OpenRouter is recommended for the stable implementation.

An OpenCode-compatible API may be used for testing only if it provides a documented callable API, allows application integration, reliably returns structured JSON, keeps keys server-side and remains replaceable.

PROVIDER INTERFACE

interface AiProvider {
  generateTemplateProposal(input): Promise<result>
}

SERVER-SIDE CONFIGURATION

AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
AI_TIMEOUT_MS=
AI_MAX_RETRIES=
AI_DAILY_COST_LIMIT=

Never expose keys in the browser.

SELECTION ORDER

1. Search and score existing templates.
2. Reuse an existing template if it closely matches.
3. Adapt an existing template where safe.
4. Generate a new document only when necessary.
5. Explain when the request exceeds current capabilities.

DETERMINISTIC SHORTLISTING

Before the model call:

1. Filter enabled templates.
2. Score tags and metadata.
3. Match required fields.
4. Match duration.
5. Match aspect ratios.
6. Match industry.
7. Match media requirements.
8. Send only the best candidates and relevant capabilities.

AI MUST NOT

- Generate executable code
- Modify repository files
- Invent element IDs
- Invent fonts
- Invent animation presets
- Reference disabled capabilities
- Bypass validation

VALIDATION

Use:

- JSON schema or structured output
- Zod validation
- Unknown-key rejection
- Maximum two repair attempts
- Clear failure messages
- Cost limits
- Prompt length limits
- Output size limits
- Rate limiting

AI PREVIEW FLOW

1. User submits prompt.
2. System generates proposal.
3. Proposal is validated.
4. Sample stills are rendered.
5. Selected or generated structure is shown.
6. User edits or approves.
7. Template is saved as normal v2 JSON.
8. Variant data is added.
9. Videos are rendered.

AUDIT DATA

Record organisation, user, provider, model, prompt purpose, capability version, token use, cost, latency, success, validation failures and repair attempts.


============================================================
15. CLOUD ARCHITECTURE
============================================================

FRONTEND

Use Cloudflare Pages.

WORKER API

Use Cloudflare Workers for:

- Authentication session handling
- Template CRUD
- User and organisation APIs
- Asset metadata
- Signed R2 upload URLs
- AI generation requests
- Job creation
- Job status
- Webhooks
- API keys
- MCP-facing services where suitable

D1 DATABASE

Use D1 for:

- Users
- Organisations
- Memberships
- Templates
- Template versions
- Render jobs
- Render outputs
- Asset metadata
- AI generations
- API keys
- Webhooks
- Usage events
- Audit events

R2 STORAGE

Use R2 for:

- Uploaded images
- Uploaded clips later
- Logos
- Preview stills
- Preview videos
- Render outputs
- ZIP files
- Template preview images

RENDERING

Cloudflare Workers cannot run Remotion, Chromium or FFmpeg.

Use an external render server.

Initial render server:

- Mini PC for development
- Hetzner for production

The render server should:

1. Receive or claim queued jobs.
2. Fetch immutable job payloads.
3. Fetch assets.
4. Run Remotion.
5. Upload output to R2.
6. Report progress.
7. Record failures.
8. Retry according to policy.

QUEUE

Use a queue abstraction.

Possible implementations:

- Cloudflare Queues
- D1-backed leasing
- Another queue later
- Remotion Lambda adapter later

The API must not depend directly on one render provider.

IMMUTABLE RENDER PAYLOAD

A queued job must capture:

- Template version
- Document snapshot or immutable reference
- Variant data snapshot
- Asset IDs and versions
- Output formats
- FPS
- Rendering settings
- Job schema version
- Capability version

Editing a template after submission must not change a queued job.


============================================================
16. AUTHENTICATION AND MULTI-USER DESIGN
============================================================

Build all data as tenant-aware from the start.

Do not use Cloudflare Access as normal customer authentication unless Codex confirms it fits the final product.

Required entities:

- User
- Organisation
- Organisation membership
- Role
- Invitation
- Session
- API key
- Service account later

INITIAL ROLES

- Owner
- Admin
- Editor
- Viewer

OWNER

- Billing
- Organisation settings
- Member management
- API keys
- All templates
- All assets
- All renders

ADMIN

- Members
- Templates
- Assets
- Renders
- API keys

EDITOR

- Create templates
- Edit templates
- Upload assets
- Use AI
- Render

VIEWER

- View templates
- View renders
- Download outputs

TENANT ISOLATION

Every relevant record must include organisation ownership.

Never trust organisationId from request input as proof of access.

Derive organisation context from session, membership, API key or service account.

Audit sensitive actions.


============================================================
17. DATABASE MODEL
============================================================

Codex must define exact schemas and migrations.

Suggested tables:

- users
- organisations
- organisation_members
- invitations
- sessions
- api_keys
- templates
- template_versions
- assets
- render_jobs
- render_outputs
- ai_generations
- usage_events
- webhooks
- webhook_deliveries
- audit_events

TEMPLATES

Store:

- id
- organisation_id
- owner_user_id
- name
- description
- visibility
- current_version_id
- preview_asset_id
- created_at
- updated_at
- archived_at

TEMPLATE VERSIONS

Store immutable versions:

- id
- template_id
- schema_version
- document_json
- capability_version
- created_by
- created_at

RENDER JOBS

Store:

- id
- organisation_id
- user_id
- template_id
- template_version_id
- status
- progress
- input_snapshot
- formats
- output_count
- error_summary
- retry_count
- created_at
- started_at
- completed_at
- cancelled_at

RENDER OUTPUTS

Store:

- id
- render_job_id
- variant_index
- format
- status
- asset_id
- error
- duration
- file_size
- created_at

ASSETS

Store:

- id
- organisation_id
- owner_user_id
- type
- mime_type
- file_size
- width
- height
- duration
- r2_key
- checksum
- created_at
- deleted_at


============================================================
18. TESTING STRATEGY
============================================================

Testing is required in every phase.

UNIT TESTS

Cover:

- Document validation
- Schema migration
- Transform calculations
- Responsive overrides
- Selection utilities
- Drag conversion
- Resize calculations
- Rotation calculations
- Snapping
- Undo history
- Merge-tag extraction
- Merge-tag resolution
- Typed validation
- Animation calculations
- Scene timing
- Template scoring
- Capability filtering
- AI output validation
- Tenant access rules
- API key verification
- Queue leasing
- Job status transitions

INTEGRATION TESTS

Cover:

- Create account
- Create organisation
- Create template
- Create version
- Upload asset
- Add asset to document
- Save document
- Load document
- Submit render
- Persist job
- Restart and recover job
- Upload output
- Download output
- Generate AI proposal
- Reject invalid proposal
- Reject stale capability ID
- Import CSV
- Validate rows
- Render multiple variants

END-TO-END TESTS

Use Playwright for:

- Desktop editor
- Mobile editor
- Add text
- Edit text
- Add image
- Drag
- Resize
- Rotate
- Change layer order
- Undo
- Redo
- Add scene
- Change aspect ratio
- Save override
- Add merge tag
- Import CSV
- Preview variant
- Save template
- Render
- Download
- Authentication
- Organisation boundaries
- Viewer restrictions

VISUAL REGRESSION

Store screenshots for:

- Dashboard
- Template gallery
- Empty editor
- Text selected
- Image selected
- Properties panel
- Timeline
- Portrait layout
- Square layout
- Mobile editor
- Error state
- Loading state
- Empty state
- AI proposal
- Render history

REMOTION TESTS

Render:

- Text element
- Image element
- Shape element
- Every animation preset
- Every aspect ratio
- Every scene transition
- Long text
- Missing optional data
- Unicode
- Euro symbols
- Large images
- Small images
- Invalid assets
- Multiple overlapping elements

PERFORMANCE TESTS

Measure:

- Editor frame rate
- Large-document editing
- 100 elements
- Large CSV import
- AI response time
- Queue throughput
- R2 upload time
- D1 query performance

ACCESSIBILITY TESTS

Test:

- Keyboard navigation
- Focus order
- Screen-reader labels
- Colour contrast
- Reduced motion
- Dialog focus management
- Touch targets


============================================================
19. SECURITY REQUIREMENTS
============================================================

Implement:

- Strict input validation
- Zod schemas
- Request size limits
- Upload size limits
- MIME validation
- File-signature checks where practical
- API rate limiting
- AI cost limits
- API key hashing
- Secure sessions
- CSRF protection where relevant
- CORS allowlists
- SSRF protection
- Signed asset URLs
- Tenant checks
- Audit logs
- Secret management
- Dependency scanning
- Database backups

Do not:

- Expose provider keys
- Store plaintext API keys
- Render arbitrary remote URLs without validation
- Allow arbitrary code
- Allow user-generated React
- Trust AI JSON
- Expose internal file paths
- Log sensitive customer data
- Allow unbounded render jobs

DEFINE LIMITS FOR

- Maximum variants per job
- Maximum total outputs
- Maximum duration
- Maximum scenes
- Maximum elements per scene
- Maximum asset size
- Maximum total asset download
- Maximum concurrent jobs
- Maximum retries
- Maximum ZIP size
- Maximum AI generations per plan


============================================================
20. OBSERVABILITY AND OPERATIONS
============================================================

Use structured logging.

Include:

- Request ID
- User ID
- Organisation ID
- Template ID
- Template version
- Job ID
- Output ID
- Capability version

Track:

- API latency
- AI latency
- AI cost
- Render duration
- Queue wait
- Failed jobs
- Partial failures
- R2 usage
- D1 errors
- Worker errors
- Render-server health
- Webhook failures

Do not log passwords, session tokens, API keys, provider keys, full customer datasets or sensitive signed URLs.

BACKUPS

Back up:

- D1 database
- Template versions
- Asset metadata
- User data
- Organisation data
- Critical R2 assets

Rendered outputs may have retention rules because they can often be regenerated.


============================================================
21. PHASED V2 DEVELOPMENT ROADMAP
============================================================

PHASE 0: CURRENT-STATE AUDIT AND V2 PREPARATION

Goal: create a reliable baseline and define the migration boundary.

Codex plans:

- Current-state architecture map
- Reuse versus rebuild matrix
- Dependency graph
- Proposed package boundaries
- Initial v2 folder plan
- Risk list
- Migration plan
- Branch and commit plan

Raybot builds:

- Run all tests, type checks and builds
- Record known failures
- Create stable sample templates and CSV files
- Create smoke-render scripts
- Freeze old editor feature work
- Add v2 feature flag
- Create branch strategy
- Create docs/v2-roadmap-status.md

Codex reviews:

- Baseline reproducibility
- Reusable systems
- V2 boundary
- Parallel v1 and v2 safety

Acceptance criteria:

- Existing batch render works
- Test baseline is recorded
- Reuse matrix exists
- Folder and package strategy is approved
- Old editor is frozen


PHASE 1: V2 DOCUMENT SCHEMA AND MIGRATION FOUNDATION

Goal: create the canonical v2 document model.

Codex plans:

- Document, scene and element schemas
- Transform semantics
- Timing semantics
- Responsive override semantics
- Animation schema
- Merge-tag schema
- Versioning and migrations
- Validation strategy

Raybot builds:

- document-schema package
- Zod schemas
- TypeScript types
- Normalisation
- Validation helpers
- Migration helpers
- Sample documents
- Invalid fixtures
- Tests

Codex reviews:

- Editor independence
- Renderer independence
- Frame semantics
- Transform clarity
- AI suitability
- Database suitability
- Migration path

Acceptance criteria:

- Valid documents pass
- Invalid documents fail clearly
- Versioning works
- Initial element samples exist
- Semantics are documented
- Migration interface exists


PHASE 2: ELEMENT AND CAPABILITY REGISTRIES

Goal: create one source of truth for platform capabilities.

Codex plans:

- Element registry interface
- Renderer registration
- Defaults
- Property metadata
- Capability output
- Version hashing
- Enable and disable rules

Raybot builds:

- Element registry
- Text, image and shape definitions
- Animation registry
- Font registry
- Aspect-ratio registry
- Capability service
- Capability API output
- Version hash
- Tests

Codex reviews:

- Shared registry use
- No duplicate lists
- Disabled capability filtering
- AI metadata quality
- Deterministic versioning

Acceptance criteria:

- Adding an element updates capability output
- Disabled elements are rejected
- Version changes predictably
- Registries are shared


PHASE 3: MINIMAL DOM EDITOR

Goal: build a stable one-scene, one-format editor.

Codex plans:

- Editor state architecture
- Persistent versus temporary state
- Selection model
- Pointer strategy
- Stage scaling
- Coordinate conversion
- History architecture
- Mobile behaviour

Raybot builds:

- Editor shell
- Stage viewport and scaler
- Scene background
- Element layer
- Text, image and shape editor renderers
- Selection box
- Dragging
- Resizing
- Rotation
- Delete and duplicate
- Layers panel
- Basic properties
- Undo and redo
- Keyboard nudging
- Lock and visibility
- Mobile layout foundation

Scope limits:

- One scene
- One aspect ratio
- Single selection
- No timeline
- No AI
- No batch rendering

Codex reviews:

- State separation
- Pointer calculations
- History stability
- Mobile usability
- Stage boundaries
- Modular code

Acceptance criteria:

- Add text, image and shape
- Move, resize and rotate
- Edit properties
- Undo and redo
- Save and reload JSON
- Basic mobile editing works
- No page-level horizontal scrolling


PHASE 4: INLINE TEXT, LAYERS AND EDITOR POLISH

Goal: make direct editing reliable.

Codex plans:

- Controlled inline text strategy
- Merge-tag-safe editing
- Layer reorder strategy
- Snapping design
- Alignment guide calculations
- Selection edge cases

Raybot builds:

- Double-click text editing
- Controlled overlay editor
- Commit and cancel behaviour
- Raw tag preservation
- Layer reordering
- Stage and element snapping
- Alignment guides
- Shift constraints
- Rotation snapping
- Copy and paste
- Keyboard shortcuts
- Empty, loading and error states

Codex reviews:

- React text stability
- Merge-tag preservation
- Undo grouping
- Snapping determinism
- Touch usability

Acceptance criteria:

- Text editing is reliable
- Empty text works
- Merge tags are preserved
- Layer order updates zIndex
- Snapping works
- Copy and paste works


PHASE 5: SCENES AND TIMELINE

Goal: support multi-scene videos and overlapping timing.

Codex plans:

- Scene lifecycle
- Reordering
- Timeline data flow
- Playback clock
- Timing constraints
- Duration behaviour
- Animation validation

Raybot builds:

- Add, duplicate, delete, rename and reorder scenes
- Scene duration
- Timeline
- Element bars
- Start and end editing
- Trim handles
- Playhead
- Play, pause and loop
- Entry and exit animation regions
- Preset selection
- Duration, delay and easing controls
- Mobile timeline

Codex reviews:

- Deterministic timing
- Overlap behaviour
- Animation constraints
- Timeline synchronisation
- Persistent-state safety

Acceptance criteria:

- Multiple scenes work
- Elements overlap
- Timing edits visually
- Animation presets preview
- Invalid timings are prevented
- Mobile timeline works


PHASE 6: RESPONSIVE ASPECT-RATIO LAYOUTS

Goal: make 16:9, 9:16 and 1:1 first-class editable layouts.

Codex plans:

- Override merge rules
- Base-layout behaviour
- Copy and reset behaviour
- Safe zones
- Format-specific properties

Raybot builds:

- Aspect-ratio switcher
- Canvas resizing
- Proportional initial conversion
- Per-format transforms
- Font-size overrides
- Image crop overrides
- Safe-zone overlays
- Copy layout
- Reset overrides
- Responsive thumbnails
- Validation

Codex reviews:

- Base-layout integrity
- Override persistence
- Stable switching
- Renderer resolution rules
- Portrait usability

Acceptance criteria:

- All formats are editable
- Overrides save independently
- Copy and reset work
- Safe zones display
- No unintended cross-format changes


PHASE 7: MERGE TAGS AND VARIANT DATA

Goal: restore and improve the batch-variant promise.

Codex plans:

- Typed merge tags
- Allowed tag locations
- Raw versus resolved values
- CSV mapping
- Asset tags
- Validation
- Performance limits

Raybot builds:

- Tag definitions and picker
- Create, edit and delete tags
- Usage detection
- Defaults
- Manual rows
- CSV and JSON import
- Column mapping
- Type validation
- Row errors
- Variant preview
- Mobile cards
- Desktop table
- Colour, image, visibility and numeric tags

Adapt proven v1 utilities where practical.

Codex reviews:

- Raw value preservation
- Typed validation
- Large import safety
- Asset ownership
- Error clarity
- V1 parity

Acceptance criteria:

- Tags work in text, colour and image fields
- CSV rows resolve correctly
- Invalid rows are identified
- Variant preview works
- One template produces distinct variants
- Mobile editing works


PHASE 8: V2 REMOTION DOCUMENT INTERPRETER

Goal: render v2 documents accurately.

Codex plans:

- Document mapping
- Scene sequencing
- Element positioning
- Override resolution
- Animation functions
- Asset and font loading
- Deterministic output
- Error handling

Raybot builds:

- V2 root composition
- Scene renderer
- Text, image and shape Remotion renderers
- Responsive transform resolution
- Merge-tag resolution
- Animations
- Scene sequencing
- Still rendering
- Low-resolution preview
- Full render
- Renderer tests
- Editor-versus-render fixtures

Codex reviews:

- Validated input only
- Determinism
- Timing parity
- Responsive output
- Immutable assets
- Font reliability
- V1 coexistence

Acceptance criteria:

- V2 templates render
- Initial element types render
- All formats render
- Animations work
- Merge tags resolve
- Editor and output are visually close
- Errors are actionable


PHASE 9: AUTHENTICATION, ORGANISATIONS AND D1

Goal: create a proper multi-user foundation.

Codex plans:

- Auth abstraction
- Session strategy
- D1 schema
- Organisation and role model
- Tenant access layer
- Migration strategy
- Audit requirements

Raybot builds:

- Accounts
- Sign in
- Magic-link or selected auth flow
- Organisations
- Memberships
- Invitations
- Roles
- Sessions
- Tenant context
- D1 migrations
- Template ownership
- Version ownership
- Audit events
- Permission tests

Codex reviews:

- Tenant isolation
- Role enforcement
- Session security
- Migrations
- Request trust boundaries
- Audit coverage

Acceptance criteria:

- Users sign in
- Organisations work
- Templates are scoped
- Viewer cannot edit
- Cross-tenant access fails
- Invitations expire
- Audits record sensitive actions


PHASE 10: R2 ASSET LIBRARY

Goal: provide secure reusable media storage.

Codex plans:

- AssetStorage abstraction
- R2 keys
- Upload flow
- Ownership
- Validation
- Signed URLs
- Deletion
- Retention
- Immutable render references

Raybot builds:

- Asset metadata table
- Signed upload
- Image and logo upload
- Asset library UI
- Search and filter
- Preview
- Replace and delete
- Usage detection
- Metadata extraction
- MIME and size validation
- Editor asset picker
- Mobile asset picker

Codex reviews:

- Upload security
- Ownership
- R2 key design
- Deletion safety
- Render immutability
- SSRF risk
- Asset merge tags

Acceptance criteria:

- Users upload and reuse assets
- Assets are tenant-scoped
- Templates reference asset IDs
- Renders access assets
- In-use deletion is safe
- Invalid files are rejected


PHASE 11: PERSISTENT RENDER JOBS AND EXTERNAL RENDER SERVER

Goal: create the production render pipeline.

Codex plans:

- Job state machine
- Queue abstraction
- Leasing and retries
- Immutable payload
- Progress
- Partial failures
- Cancellation
- Output metadata
- Render-server security

Raybot builds:

- Render job API
- D1 jobs and outputs
- Queue adapter
- Render worker
- Leasing
- Heartbeats
- Retry
- Cancel
- Progress
- Partial completion
- R2 upload
- ZIP generation
- Signed downloads
- Render history UI
- Mobile result cards

Codex reviews:

- Restart safety
- Duplicate prevention
- Retry correctness
- Cancellation
- Tenant checks
- Immutable input
- Output ownership
- Internal path protection

Acceptance criteria:

- Jobs survive restart
- Render server processes jobs
- Outputs reach R2
- Partial failures are visible
- Retry and cancel work
- History works
- Cross-tenant downloads fail


PHASE 12: TEMPLATE GALLERY AND VERSIONING

Goal: build reusable public and private template workflows.

Codex plans:

- Visibility
- Version creation
- Draft versus published
- Duplication
- Ownership
- Search
- Compatibility status

Raybot builds:

- Private, organisation and public templates
- Drafts and published versions
- Duplicate template
- Preview images
- Search
- Categories and tags
- Sorting
- AI scoring metadata
- Compatibility warnings
- Archive

Codex reviews:

- Immutable versions
- Visibility rules
- Public-asset safety
- Safe duplication
- Old-version renderability

Acceptance criteria:

- Save versions
- Publish
- Duplicate
- Search and filter
- Public templates are safe
- Old jobs retain original versions


PHASE 13: AI PROVIDER AND PROMPT-TO-TEMPLATE

Goal: generate safe v2 templates from natural-language prompts.

Codex plans:

- Provider interface
- OpenRouter adapter
- Capability payload
- Shortlist scoring
- Output schema
- Validation
- Repair strategy
- Cost limits
- Audit model
- Failure handling

Raybot builds:

- Provider abstraction
- OpenRouter adapter
- Optional OpenCode test adapter
- Prompt wizard
- Existing-template search
- Scoring
- Capability injection
- Structured generation
- Validation
- Repair attempts
- Preview stills
- Regenerate
- Edit proposal
- Save template
- Usage tracking
- Rate limits
- Cost caps

Codex reviews:

- No generated code
- No invented capability IDs
- Existing-template preference
- Server-side keys
- Cost control
- Strict validation
- Prompt-injection risk
- Audit completeness

Acceptance criteria:

- User describes a video
- Current templates are checked
- New templates are automatically discoverable
- Output validates
- Invalid output is rejected
- Preview appears before saving
- Generated templates remain editable
- Costs are tracked


PHASE 14: PUBLIC REST API

Goal: expose stable commercial services.

Codex plans:

- Versioned API
- API keys and scopes
- Idempotency
- Error format
- Rate limits
- Webhook signatures
- OpenAPI structure

Raybot builds:

- Key creation, hashing, rotation and scopes
- Template endpoints
- Render endpoints
- File endpoints
- Capability endpoint
- AI proposal endpoint
- Idempotency
- Webhooks and retries
- OpenAPI docs
- JavaScript, Python and n8n examples

Codex reviews:

- Tenant scope
- Key security
- Idempotency
- Webhook signatures
- Error consistency
- Documentation accuracy
- Rate limiting

Acceptance criteria:

- External clients can use the platform
- Idempotent requests do not duplicate jobs
- Keys are shown once
- Webhooks are signed
- Docs match behaviour
- Limits are enforced


PHASE 15: MCP SERVER

Goal: allow AI agents to operate Vary.video safely.

Codex plans:

- MCP tool list
- Authentication
- Cost confirmation
- Structured responses
- Shared service usage
- File reference rules
- Agent safety limits

Raybot builds:

- list_capabilities
- list_templates
- get_template
- create_template_from_prompt
- render_videos
- get_render_status
- get_render_files
- cancel_render

Rules:

- Reuse shared services
- Do not duplicate capability lists
- Return references, not large binaries
- Include output count and estimated cost
- Validate all inputs
- Enforce tenant boundaries

Codex reviews:

- Current capability use
- Tool safety
- Authentication
- Cost safeguards
- Hidden internal paths
- Shared logic

Acceptance criteria:

- Agent discovers templates
- Agent generates proposals
- Agent starts renders
- Agent checks status
- Agent retrieves files
- Tenant and cost limits work


PHASE 16: MOBILE POLISH AND ACCESSIBILITY

Goal: bring the product to production-quality mobile and accessibility standards.

Codex plans and reviews:

- Mobile interaction model
- Keyboard behaviour
- Focus order
- Screen-reader support
- Touch behaviour
- Responsive performance

Raybot builds:

- Mobile dashboard
- Mobile editor
- Bottom sheets
- Full-screen timeline mode
- Variant cards
- Asset picker
- Render history
- Prompt wizard
- Navigation
- Empty, loading and error states
- Reduced motion
- Keyboard shortcuts
- Non-drag alternatives

Acceptance criteria:

- 320 px workflow works
- No page-level horizontal scrolling
- Core workflows work with touch
- Core workflows work with keyboard
- Focus management works
- Accessibility labels exist
- Reduced motion is supported
- Viewport regression tests pass


PHASE 17: PRODUCTION HARDENING

Goal: prepare for real customers.

Codex plans:

- Operational limits
- Backup policy
- Monitoring
- Incident handling
- Retention
- Security checklist
- Deployment checklist

Raybot builds:

- Structured logs
- Monitoring
- Health checks
- Alerts
- Render-server supervision
- Backups
- Restore tests
- Asset and output retention
- Rate limits
- Render limits
- AI limits
- Usage dashboard
- Admin diagnostics
- Dependency scanning
- Security headers
- CORS
- Load tests

Codex reviews:

- Restore success
- Abuse protection
- Monitoring coverage
- Secret safety
- Log privacy
- Repeatable deployment

Acceptance criteria:

- Production deployment is documented
- Restore test passes
- Monitoring and alerts work
- Abuse limits work
- Security review is complete
- Production smoke tests pass


PHASE 18: BILLING AND COMMERCIAL PLANS

Goal: add billing only after the workflow is validated with users.

Codex plans:

- Usage model
- Render credits
- AI credits
- Storage limits
- Plan enforcement
- Overage handling
- Billing events
- Failure states

Raybot builds:

- Plans
- Subscription status
- Usage meter
- Render credits
- AI limits
- Storage limits
- Upgrade flow
- Failed-payment handling
- Billing portal
- Admin controls

Codex reviews:

- Plan limits
- Usage accuracy
- Race conditions
- Payment failures
- Tenant billing ownership
- Bypass protection

Acceptance criteria:

- Usage is accurate
- Limits work
- Upgrades work
- Failed billing is safe
- Billing does not corrupt templates or renders


============================================================
22. INITIAL MILESTONE PRIORITIES
============================================================

Do not start with AI, billing or MCP.

MILESTONE A: V2 EDITOR PROOF

- V2 schema
- Capability registry
- One scene
- Text
- Image
- Shape
- Drag
- Resize
- Rotate
- Properties
- Undo and redo
- Save and load JSON
- Mobile foundation

MILESTONE B: VIDEO STRUCTURE

- Multiple scenes
- Timeline
- Overlapping elements
- Entry and exit animations
- Playback simulation
- 16:9, 9:16 and 1:1 overrides

MILESTONE C: BATCH PROMISE

- Merge tags
- CSV
- JSON
- Variant preview
- Per-row images
- Per-row colours
- V2 Remotion render
- Batch output

Only after these are stable should the build move fully into auth, D1, R2, AI, API and MCP.


============================================================
23. DEFINITION OF DONE
============================================================

A feature is complete only when:

- Codex approved the implementation plan
- The implementation matches the plan
- TypeScript passes
- Lint passes
- Unit tests pass
- Integration tests pass where relevant
- End-to-end tests pass where relevant
- Error states exist
- Loading states exist
- Empty states exist
- Mobile behaviour is tested
- Desktop behaviour is tested
- Keyboard behaviour is tested
- Touch behaviour is tested
- Tenant ownership is considered
- Security impact is reviewed
- Documentation is updated
- Codex reviewed the diff
- Review feedback is resolved
- No unexplained regressions remain
- Acceptance criteria are met


============================================================
24. ARCHITECTURAL RESTRICTIONS
============================================================

Do not:

- Use the Remotion render tree as the direct-manipulation editor
- Generate arbitrary React code with AI
- Execute AI-generated code
- Trust AI-generated JSON without validation
- Hard-code capabilities into AI prompts
- Maintain duplicate registries
- Store plaintext API keys
- Expose provider keys to the browser
- Accept arbitrary remote media without security checks
- Trust organisation IDs from request bodies
- Bind route handlers directly to database implementation
- Bind render logic directly to one queue provider
- Start with advanced keyframe curves
- Start with rich text
- Add billing before product validation
- Delete v1 before v2 is proven
- Mix selection state into saved documents
- Allow queued jobs to change after template edits
- Assume proportional format conversion is sufficient
- Neglect mobile until the end


============================================================
25. SUCCESSFUL V2 DEMONSTRATION
============================================================

The first complete public demonstration should show:

1. User signs in.
2. User opens the visual editor.
3. User creates a three-scene property video.
4. User adds text and image elements.
5. User drags, resizes and styles them.
6. User adds merge tags for propertyName, price, bedrooms, agentName, propertyImage and brandColor.
7. User creates layouts for 16:9, 9:16 and 1:1.
8. User previews one property.
9. User uploads a CSV containing multiple listings.
10. Each row uses different text, colour and image data.
11. User renders all variants.
12. Outputs appear in render history.
13. User downloads files or a ZIP.
14. User asks AI to generate another property template.
15. AI checks current templates and elements.
16. AI reuses or generates a validated v2 template.
17. User edits the AI result.
18. The same workflow is performed through the API.
19. The same workflow is performed through MCP.

This demonstrates the complete Vary.video vision: a programmable visual video-generation platform for structured data, automation and AI agents.


============================================================
26. FINAL INSTRUCTION TO RAYBOT
============================================================

Begin with Phase 0.

Ask Codex to inspect the actual repository and produce a file-level plan for Phase 0, Phase 1 and Phase 2.

The first Codex plan must identify:

- Existing files to reuse
- Existing files to freeze
- Existing files to retire later
- New packages to create
- New schemas to create
- Import boundaries
- Test migrations
- Repository risks
- Commit boundaries
- Safe implementation order

After Codex approves the plan:

1. Raybot creates the branch.
2. Raybot uses DeepSeek for implementation.
3. Raybot runs all tests and checks.
4. Codex reviews the diff.
5. Raybot applies corrections.
6. Codex gives final approval.
7. Raybot merges and updates documentation.

Repeat this process for every phase.

Do not attempt the entire roadmap in one autonomous coding session.

Do not allow DeepSeek to redesign architecture without Codex review.

Do not proceed from one architectural phase to the next with failing tests or unresolved review findings.

The immediate objective is not to ship the full SaaS.

The immediate objective is to prove that the v2 document model can support:

- A stable DOM editor
- A shared Remotion renderer
- Responsive aspect-ratio layouts
- Merge-tag variants
- Reliable save and load
- A clean path to multi-user infrastructure

Once that foundation is proven, continue through the roadmap in order.
