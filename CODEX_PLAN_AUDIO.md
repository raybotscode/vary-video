# Audio Integration Spec — vary-video Phase 5

You are the senior architect for Vary.video. Produce a file-level implementation plan for audio integration. Write to `CODEX_SPEC_audio.md` in the repo root. DO NOT modify source files.

## Context
- Vary.video is a batch video rendering platform using Remotion (React/TS)
- Remotion has built-in `<Audio>` component that muxes audio into MP4 via FFmpeg
- SceneBlockPlayer is the generic JSON-driven composition system
- Pixabay API works for images/video but has NO music endpoint
- Freesound.org has a proper REST API for music and sound effects (CC licensed)
- User audio upload is the simplest first step

## What to plan

### Task 1: Audio Types & Schema
Add audio configuration to the shared types and SceneBlockPlayer schema:
- `AudioConfig` type: source URL, volume (0-1), fade in (seconds), fade out (seconds), loop, start offset
- Add `audio?: AudioConfig` to SceneBlockPlayer schema (top-level, not per-block — background music is composition-wide)
- Zod schema with sensible defaults (volume: 0.3, fadeIn: 2s, fadeOut: 2s)
- API route to upload audio files (MP3, WAV, OGG)

### Task 2: Audio Upload & Storage
- `POST /api/v1/audio/upload` — accepts multipart form with audio file
- Saves to `public/audio/{jobId}/{filename}` (local disk for now, R2 later)
- Returns URL for use in composition
- Validate: file type (MP3, WAV, OGG, M4A), max size (20MB), duration (via music-metadata)
- `GET /api/v1/audio` — list uploaded audio files

### Task 3: Remotion Audio Integration
- Modify SceneBlockPlayer to render `<Audio>` when audio config is present
- Use `staticFile()` for local audio files
- Implement volume control, fade in/out (via FFmpeg post-processing or Remotion's `volume` prop)
- Handle loop: use Remotion's `loop` prop or repeat via `<Series>`
- Audio should play across all blocks (composition-wide, not block-specific)

### Task 4: Frontend Audio Controls
- Audio picker in Dashboard/BrandSettings:
  - Upload button (file input, accept audio/*)
  - Volume slider (0-100%)
  - Fade in/out duration sliders (0-5 seconds)
  - Loop toggle
  - Preview button (play/pause)
- Store audio config in template payload
- CSS for audio controls (mobile-first, 44px touch targets)

### Task 5: FFmpeg Post-Processing for Fades
- After Remotion renders the video, apply audio fades via FFmpeg
- `ffmpeg -i input.mp4 -af "afade=t=in:d=2,afade=t=out:st={duration-2}:d=2" output.mp4`
- Or use Remotion's volume interpolation if it supports frame-based volume

## Key files to examine
- `src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx` — main composition
- `src/compositions/SceneBlockPlayer/schema.ts` — schema
- `api/src/routes/render.ts` — render pipeline
- `api/src/services/renderer.ts` — Remotion render calls
- `web/src/pages/Dashboard.tsx` — frontend state
- `web/src/components/BrandSettings.tsx` — brand settings UI
- `web/src/index.css` — design tokens

## Constraints
- Remotion's `<Audio>` component handles muxing — don't fight it
- Audio files must be accessible via `staticFile()` (copy to project's public dir before render)
- For Freesound API integration later, download to same location
- Mobile-first UI: 320px min, 44px touch targets
- Keep existing tests passing

## Output
Write complete plan to `/home/raymo/vary-video/CODEX_SPEC_audio.md`.
