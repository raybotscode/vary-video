# ZIP Download for Completed Render Jobs

## Goal
Add a ZIP download endpoint to the Vary.video API that bundles all completed MP4 outputs for a render job into a single ZIP file. Update the frontend to show the ZIP download button and remove the "not implemented" placeholder message.

## Why
The frontend currently shows "ZIP download is not implemented by the API yet. Download individual MP4 files above." — this needs to be functional.

## Changes Needed

### 1. API — Add ZIP download route

**File: `api/src/routes/render.ts`**

Add a new route after the existing `/download/:jobId/:variantIndex` route:

```typescript
renderRouter.get('/download/:jobId/zip', async (req, res) => {
  const jobId = req.params.jobId;
  const outputs = jobOutputs.get(jobId);
  if (!outputs || outputs.length === 0) {
    res.status(404).json({error: 'No rendered outputs found for this job'});
    return;
  }

  const JSZip = (await import('archiver')).default;
  // archiver uses default export
```

Actually, use `archiver` (already installed). Pattern:

```typescript
import archiver from 'archiver';
import fs from 'node:fs';

renderRouter.get('/download/:jobId/zip', (req, res) => {
  const jobId = req.params.jobId;
  const outputs = jobOutputs.get(jobId);
  if (!outputs || outputs.length === 0) {
    res.status(404).json({error: 'No rendered outputs found for this job'});
    return;
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="vary-video-${jobId}.zip"`);

  const archive = archiver('zip', {zlib: {level: 9}});
  archive.pipe(res);

  for (const output of outputs) {
    const filename = `variant-${output.index + 1}.mp4`;
    archive.file(output.outputPath, {name: filename});
  }

  archive.finalize();

  archive.on('error', (err) => {
    res.status(500).json({error: `ZIP error: ${err.message}`});
  });
});
```

Make sure to:
- Add `import archiver from 'archiver';` at the top of the file
- Add `import fs from 'node:fs';` if not already there
- The route order matters — put `/download/:jobId/zip` BEFORE `/download/:jobId/:variantIndex` so Express matches `zip` as a literal before `:variantIndex`

### 2. Frontend — Update RenderProgress

**File: `web/src/components/RenderProgress.tsx`**

Replace the placeholder text + add a ZIP download button:

Current lines 91-95:
```tsx
{status?.status === 'completed' && (
  <div className="completion-note">
    <p>ZIP download is not implemented by the API yet. Download individual MP4 files above.</p>
  </div>
)}
```

Replace with:
```tsx
{status?.status === 'completed' && (
  <div className="completion-actions">
    <a href={`${API_BASE}/api/render/download/${jobId}/zip`} className="primary-button zip-button">
      Download All as ZIP
    </a>
  </div>
)}
```

### 3. Install archiver

Already done — `archiver` is in node_modules.

## Verification
1. Start API server: `cd /home/raymo/vary-video && npm run api`
2. Start a render job via POST to /api/render/batch
3. Wait for completion
4. Check that GET /api/render/download/:jobId/zip returns a valid ZIP file containing all variant MP4s
5. Check the frontend shows the "Download All as ZIP" button on completion

## Files to Modify
- `api/src/routes/render.ts` — Add ZIP route + archiver import
- `web/src/components/RenderProgress.tsx` — Replace placeholder with ZIP button

## Build & Deploy
After changes, rebuild and redeploy:
```
cd /home/raymo/vary-video/web && npx vite build
cd /home/raymo/vary-video && npx wrangler pages deploy web/dist --project-name=vary-video
```
