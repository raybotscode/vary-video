# Codex Review — Phase 3 Commits 3-4

Verdict: REQUEST_CHANGES

## Findings

### 1. High: Redirect SSRF check runs after the private target has already been requested

- [api/src/services/mediaValidation.ts](/home/raymo/vary-video/api/src/services/mediaValidation.ts:120) uses `fetch(..., {redirect: 'follow'})`.
- [api/src/services/mediaValidation.ts](/home/raymo/vary-video/api/src/services/mediaValidation.ts:157) validates `response.url` only after fetch has followed the redirect.

This means an attacker can submit a public URL that returns `302 Location: http://169.254.169.254/...` or another internal address. The validator will eventually report invalid, but the server has already made the internal request. That is still SSRF.

Fix by disabling automatic redirects (`redirect: 'manual'`) and validating each `Location` before issuing the next request. Also cap redirect count and preserve the HTTPS-to-HTTP downgrade check before following the downgraded URL.

### 2. High: Hostname checks do not resolve DNS or block all non-public address targets

- [api/src/services/mediaValidation.ts](/home/raymo/vary-video/api/src/services/mediaValidation.ts:31) only classifies literal hostnames/IP strings.
- [api/src/services/variantResolution.ts](/home/raymo/vary-video/api/src/services/variantResolution.ts:152) uses only that local validation before render-time image fetching.

`https://attacker.example/image.png` can pass local validation while DNS resolves to `127.0.0.1`, `169.254.169.254`, RFC1918 space, IPv6 local/link-local, or other non-global ranges. The same gap affects batch rendering because Remotion later fetches the image URL, while the render route only validates URL syntax and literal private IPs.

Fix by resolving A/AAAA records server-side and rejecting every resolved non-public address before probing or rendering. The denylist should cover loopback, private, link-local, unique-local, unspecified, multicast, documentation/test networks, carrier-grade NAT, benchmarking ranges, and IPv4-mapped IPv6 forms. Ideally the actual outbound request should be bound to the validated address or performed through a hardened fetch layer to avoid DNS rebinding between validation and fetch.

### 3. Medium: The public validation API lets callers weaken MIME and size policy

- [api/src/routes/v1/media.ts](/home/raymo/vary-video/api/src/routes/v1/media.ts:9) accepts caller-provided `acceptedMimeTypes`.
- [api/src/routes/v1/media.ts](/home/raymo/vary-video/api/src/routes/v1/media.ts:10) accepts caller-provided `maxBytes`.

Because these values are passed directly into `validateMediaUrlRemote`, a client can validate `text/html` or raise `maxBytes` above the platform limit. If this endpoint is supposed to report whether media is acceptable for Vary.video, those policy knobs should not be client-controlled. Use the canonical media-field limits from `src/shared/capabilities/media.ts`, or restrict overrides to an internal-only path.

### 4. Medium: `media-image` advertises treatment as content, but render wiring expects a block-level object

- [src/shared/capabilities/blocks.ts](/home/raymo/vary-video/src/shared/capabilities/blocks.ts:249) declares `{key: 'treatment', type: 'image-treatment'}` inside `contentFields`.
- [src/compositions/SceneBlockPlayer/schema.ts](/home/raymo/vary-video/src/compositions/SceneBlockPlayer/schema.ts:26) models treatment as sibling `imageTreatment`, while `content` remains `Record<string, string>`.
- [src/compositions/blocks/ImageBlock.tsx](/home/raymo/vary-video/src/compositions/blocks/ImageBlock.tsx:25) reads only `imageTreatment`.

Consumers that build UI or AI specs from `contentFields` will naturally put treatment data in `content.treatment`, but the schema cannot hold the treatment object there and the renderer ignores it. This makes the feature easy to generate incorrectly and creates drift between capability metadata and runtime shape.

Fix by making the capability contract match the schema, for example a first-class `defaultImageTreatment`/`supportsImageTreatment` field on the block plus documentation in the block sequence schema, or by changing the renderer/schema to accept treatment in content with an object-safe content model.

### 5. Medium: `fit-width` and `fit-height` do not apply positioning/cropping semantics correctly

- [src/compositions/media/treatment.ts](/home/raymo/vary-video/src/compositions/media/treatment.ts:60) switches these modes to `width: 100%; height: auto` and `width: auto; height: 100%`.
- [src/compositions/media/ResponsiveImage.tsx](/home/raymo/vary-video/src/compositions/media/ResponsiveImage.tsx:109) renders the image directly without centering or translating it.

For `fit-height`, wide images anchor at the left edge instead of respecting `horizontalPosition` or `focalPoint`. For `fit-width`, tall images anchor at the top. `objectPosition` is not enough once the element itself has auto dimensions and is not absolutely positioned/translated inside the clipped container.

Fix by absolutely positioning the image and translating it based on horizontal/vertical/focal positioning, or keep a 100% x 100% image box and implement these modes with a deterministic transform. Add tests that verify generated styles include the positioning needed for `fit-width`/`fit-height`.

## Test Coverage Notes

The current tests cover the happy-path pure helpers and basic local URL rejections, and the focused suite passes:

```text
npm test -- api/src/services/mediaValidation.test.ts api/src/routes/v1/media.test.ts src/compositions/media/treatment.test.ts
npm run typecheck
```

Missing coverage that should be added before approval:

- Redirect chain tests proving no request is made to private redirect targets.
- DNS resolution tests for public hostnames resolving to private/non-public IPs, including IPv4-mapped IPv6.
- Tests that callers cannot weaken accepted MIME types or max byte limits through the public API.
- Integration tests proving `media-image` treatment can be represented in the same shape exposed by capabilities and consumed by `SceneBlockPlayer`.
- Treatment tests for `fit-width`/`fit-height` positioning, not only width/height values.

## Summary

The architecture direction is reasonable: a shared `ResponsiveImage` plus pure treatment helpers is a clean pattern for Remotion blocks. However, the current SSRF protection is incomplete in ways that still allow internal network requests, and the treatment capability contract does not line up with runtime rendering. These should be fixed before merging this range as Phase 3 complete.
