# Phase 3 Commits 1-2 Review

REQUEST_CHANGES

## Blocking Findings

1. **Per-variant media/brand values are written to the wrong prop shape for quick templates**

   `api/src/services/variantResolution.ts:81-99` always resolves CSV media and brand columns into `brandSettings`. That works only for `SceneBlockPlayer`. The shipped quick templates read these values from top-level props:

   - `src/templates/registry.ts:48-66` expects `brandColor`, `logoUrl`, `backgroundImageUrl`, `productImageUrl` at the top level for `ProductLaunch`.
   - `src/templates/registry.ts:73-95` expects `brandColor`, `logoUrl`, `backgroundImageUrl`, `propertyImageUrl` at the top level for `RealEstate`.
   - `src/compositions/ProductLaunch/IntroScene.tsx:44-47` and `src/compositions/RealEstate/HeroScene.tsx:20-23` render those top-level media props.

   Because Zod object schemas strip unknown keys by default, `makeInputProps()` parses `brandSettings` away for these templates (`api/src/services/renderer.ts:50-57`). A CSV row with `product_image_url` or `property_image_url` will validate but render as if no image was provided. The same applies to `brand_color`, `logo_url`, and background image values for non-SceneBlockPlayer templates.

   Suggested fix: resolve into the shape required by the selected composition. For the existing quick templates, write mapped values to top-level props. For `SceneBlockPlayer`, write them into `brandSettings`. Add integration tests around `makeInputProps('ProductLaunch', ..., {product_image_url})`, `makeInputProps('RealEstate', ..., {property_image_url})`, and a SceneBlockPlayer case.

2. **Media validation is effectively opt-in and can be skipped by normal render payloads**

   `/render/batch` gets media fields from the untrusted request body at `api/src/routes/render.ts:79-82`:

   ```ts
   const mediaFieldIds = (parsed.data.template.mediaFields as string[]) ?? [];
   ```

   The dashboard sends only edited template values (`web/src/api/client.ts:229-238`), and `templateDefaults()` strips down to runtime defaults without capability metadata (`web/src/pages/Dashboard.tsx:31-34`). The frontend adapters also do not carry `mediaFields` into the submitted template (`web/src/utils/templates.ts:31-48`, `web/src/utils/capabilityAdapters.ts:31-56`). As a result, ordinary UI renders will not run `validateBatchVariants()` at all.

   Even outside the UI, a caller can omit `template.mediaFields` while still sending renderable media props such as `logoUrl`, `backgroundImageUrl`, or block image content. That bypasses the new URL checks.

   Suggested fix: derive media field IDs server-side from `compositionId` and/or the enabled block sequence, using the shared capability registry. Do not trust `template.mediaFields` as the authority for what must be validated.

3. **URL validation does not sufficiently protect the renderer from SSRF/local network fetches**

   `validateVariantMedia()` only rejects non-http(s), `localhost`, `127.0.0.1`, and `::1` (`api/src/services/variantResolution.ts:126-135`). It still allows common local/private targets such as:

   - `http://127.1/logo.png`
   - `http://0.0.0.0/logo.png`
   - `http://10.0.0.1/logo.png`
   - `http://172.16.0.1/logo.png`
   - `http://192.168.1.1/logo.png`
   - `http://169.254.169.254/latest/meta-data/`
   - IPv6 private/link-local ranges

   Remotion `Img` fetches these URLs during render, so this is a server-side fetch surface. DNS rebinding and redirects are also not handled here.

   Suggested fix: centralize URL validation for every remote media source. Resolve hostnames server-side and reject loopback, link-local, private, multicast, unspecified, and metadata ranges after DNS resolution; reject redirects to disallowed hosts; enforce http/https only; consider allowlisting trusted asset hosts if practical.

4. **The enabled `media-image` block can be selected and validated but renders blank**

   Commit 1 adds an enabled `media-image` block (`src/shared/capabilities/blocks.ts:239-263`). `SceneBlockPlayer` validates block IDs against enabled capabilities, so this block is accepted. But `src/compositions/blocks/registry.ts:62-66` does not register a renderer for `media-image`, and `renderPositionedBlock()` returns `null` when no renderer exists (`src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx:67-70`).

   Suggested fix: either add a `media-image` renderer and pass its image treatment through `BlockRenderProps`, or keep the capability disabled until render support lands. Add a schema/render registry invariant test that every enabled block has a renderer.

## Non-Blocking Findings

1. **`imageTreatment` is accepted but unused**

   `src/compositions/SceneBlockPlayer/schema.ts:26-31` accepts `imageTreatment` on each block, but `renderPositionedBlock()` does not pass it into block renderers (`src/compositions/SceneBlockPlayer/SceneBlockPlayer.tsx:75-87`), and `BlockRenderProps` has no corresponding field (`src/compositions/blocks/registry.ts:20-29`). If treatment support is intended for Phase 3, this should be wired through and tested. If it is schema-only groundwork, document that limitation.

2. **Media schema metadata is loose where stronger guarantees would help**

   `src/shared/capabilities/schema.ts:45-61` validates `variantKey`, `templateProp`, and MIME types as arbitrary non-empty strings. That catches shape errors but not registry drift. The existing tests cover the current mappings, but the schema itself would still accept `variantKey: "wrong"` or `acceptedMimeTypes: ["text/html"]`.

   Suggested improvement: constrain `kind`, `variantKey`, and `templateProp` as a discriminated union per media kind, or add registry invariant tests that every capability matches `MEDIA_FIELD_PROP_MAP`, expected variant keys, allowed image MIME types, and unique IDs.

3. **Template validation still uses unresolved first-row props**

   `api/src/validation/composition.ts:26-34` validates `{...template, data: firstVariant}` rather than using the same `resolveVariantProps()` path as `makeInputProps()`. This is less important once batch media validation is fixed, but it means the synchronous validation path can differ from the actual render parse path.

   Suggested improvement: have validation call the same resolver used by `makeInputProps()`, and validate every variant for fields whose resolved values can affect schema parsing.

## Test Coverage Gaps

- Add `makeInputProps()` tests proving CSV media/brand columns become the actual props consumed by each quick template.
- Add render route tests where `template.mediaFields` is omitted but the selected composition has media fields.
- Add SSRF-focused URL validation tests for alternate loopback forms, RFC1918 ranges, link-local metadata IPs, IPv6 local ranges, redirects, and hostnames resolving to private addresses.
- Add an enabled-block/render-registry invariant test so capability metadata cannot expose blank blocks.
- Add tests for placeholder URL values in template media props, not just direct variant URL columns.

## Architecture Notes

The shared/API/Remotion split is directionally sound: JSON-safe media capability metadata lives in `src/shared`, API resolution lives under `api/src/services`, and render schemas remain in Remotion composition code. The current issue is not the layer split itself; it is that the resolver and validator are not driven by the same canonical composition/block metadata that the renderer actually consumes.

## Performance Notes

Placeholder resolution is linear in the number of string fields and variants, and the current implementation only resolves `brandSettings`, so CPU cost is not a concern for large batches. Once resolution expands to blocks and template copy/media fields, consider precomputing the fields that contain placeholders per template/block once per job instead of scanning every key for every variant.
