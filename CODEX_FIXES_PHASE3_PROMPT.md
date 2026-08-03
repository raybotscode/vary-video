# Phase 3 Codex Fixes: SSRF Hardening + Generic Media Naming

## Overview

Two Codex reviews returned REQUEST_CHANGES. This prompt addresses all blocking findings plus Ray's request to make media field naming generic (not industry-specific).

## Fix 1: SSRF — Redirect Chain

**File:** `api/src/services/mediaValidation.ts`

Current code uses `redirect: 'follow'` which makes the server actually request the private redirect target before rejecting it. Fix:

1. Change `fetch()` to `redirect: 'manual'`
2. Implement manual redirect loop (max 5 hops):
   - If response is 301/302/307/308, read the `Location` header
   - Validate the Location URL with `validateUrlLocally()` BEFORE following
   - If Location is invalid, return error immediately (no request made to private target)
   - Check for HTTPS→HTTP downgrade before following
   - Construct absolute URL if Location is relative
   - Make the next request only if Location passes all checks
3. After the loop, validate the final URL with `validateUrlLocally()` one more time
4. Return the final response's content-type, content-length, final URL, status code

## Fix 2: SSRF — DNS Resolution

**File:** `api/src/services/mediaValidation.ts`

Current `isPrivateHostname()` only checks literal IP strings. A hostname like `evil.example.com` can DNS-resolve to `127.0.0.1`. Fix:

1. Add `import dns from 'node:dns/promises';`
2. Add `async function resolveAndValidateHost(hostname: string): Promise<string[]>`:
   - Call `dns.lookup(hostname, {all: true})` to get all resolved addresses
   - For each resolved address, check against the extended denylist:
     - `127.0.0.0/8` (loopback)
     - `10.0.0.0/8` (RFC1918)
     - `172.16.0.0/12` (RFC1918)
     - `192.168.0.0/16` (RFC1918)
     - `169.254.0.0/16` (link-local)
     - `0.0.0.0/8` (unspecified)
     - `100.64.0.0/10` (carrier-grade NAT)
     - `198.18.0.0/15` (benchmarking)
     - `192.0.0.0/24` (IETF protocol assignments)
     - `192.0.2.0/24` (documentation)
     - `198.51.100.0/24` (documentation)
     - `203.0.113.0/24` (documentation)
     - `224.0.0.0/4` (multicast)
     - `240.0.0.0/4` (reserved)
     - `::1` (IPv6 loopback)
     - `fc00::/7` (IPv6 unique-local)
     - `fe80::/10` (IPv6 link-local)
     - `::ffff:0:0/96` (IPv4-mapped IPv6 — check the embedded IPv4 against the above ranges)
     - `::` (IPv6 unspecified)
     - `100::` (IPv6 discard)
     - `2001:db8::/32` (IPv6 documentation)
   - If ANY resolved address is non-public, return error
   - Also check raw hostname for literal private IPs (existing `isPrivateHostname` logic)
3. Integrate into `validateUrlLocally()` — make it async, call `resolveAndValidateHost` after scheme check
4. Integrate into `validateMediaUrlRemote()` — call DNS validation before fetch
5. In the manual redirect loop (Fix 1), validate DNS of each redirect target before following

**Important:** `validateUrlLocally` becomes async. Update all callers:
- `api/src/services/variantResolution.ts` `validateVariantMedia()` — make async, propagate
- `api/src/routes/v1/media.ts` — already async, just await
- `api/src/routes/render.ts` — `validateBatchVariants` caller — make async

## Fix 3: Public API Policy

**File:** `api/src/routes/v1/media.ts`

Remove caller-provided `acceptedMimeTypes` and `maxBytes` from the request schemas. Always use canonical limits:

```ts
import {ACCEPTED_IMAGE_MIME_TYPES, MAX_IMAGE_BYTES} from '../../../src/shared/capabilities/media';

// In /validate handler:
const result = await validateMediaUrlRemote(url, {
  acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
  maxBytes: MAX_IMAGE_BYTES,
});

// In /validate-batch handler:
const result = await validateMediaUrlRemote(url, {
  acceptedMimeTypes: ACCEPTED_IMAGE_MIME_TYPES,
  maxBytes: MAX_IMAGE_BYTES,
});
```

Update schemas to remove the optional fields:
```ts
const validateRequestSchema = z.object({
  url: z.string().url(),
  // acceptedMimeTypes and maxBytes REMOVED
});
```

## Fix 4: Generic Media Field Naming

Ray's directive: "I don't want to lock down naming conventions to property image etc. If someone is creating an ad for an insurance company they should be able to use this tool."

### 4a. Rename MediaFieldKind and capabilities

**File:** `src/shared/capabilities/media.ts`

```ts
export type MediaFieldKind =
  | 'logo'
  | 'background-image'
  | 'image1'       // was 'property-image'
  | 'image2'       // was 'product-image'
  | 'person1'      // was 'agent-image'
  | 'person2';     // was 'speaker-image'
```

Update `MEDIA_FIELD_PROP_MAP`:
```ts
export const MEDIA_FIELD_PROP_MAP: Record<MediaFieldKind, string> = {
  'logo': 'logoUrl',
  'background-image': 'backgroundImageUrl',
  'image1': 'image1Url',
  'image2': 'image2Url',
  'person1': 'person1Url',
  'person2': 'person2Url',
};
```

Update `mediaFieldCapabilities` array — change `id`, `kind`, `label`, `description`, `variantKey`, `templateProp` for each:

| Old ID | New ID | Old Kind | New Kind | Old variantKey | New variantKey | New Label |
|--------|--------|----------|----------|----------------|----------------|-----------|
| propertyImage | image1 | property-image | image1 | property_image_url | image1_url | Image 1 |
| productImage | image2 | product-image | image2 | product_image_url | image2_url | Image 2 |
| agentImage | person1 | agent-image | person1 | agent_image_url | person1_url | Person Photo |
| speakerImage | person2 | speaker-image | person2 | speaker_image_url | person2_url | Person Photo |

Add `legacyVariantKeys` field to each for backward compat:
```ts
{
  id: 'image1',
  kind: 'image1',
  label: 'Image 1',
  description: 'Primary image for the template — maps to whatever visual the template needs.',
  variantKey: 'image1_url',
  legacyVariantKeys: ['property_image_url', 'product_image_url'],
  templateProp: 'image1Url',
  // ... rest unchanged
}
```

Also add `legacyVariantKeys` to the type definition:
```ts
export type MediaFieldCapability = {
  // ... existing fields
  legacyVariantKeys?: string[];  // backward-compatible CSV column names
};
```

### 4b. Update variant resolver to use composition-aware dynamic mapping

**File:** `api/src/services/variantResolution.ts`

Replace the static `VARIANT_KEY_TO_TEMPLATE_PROP` with a dynamic builder:

```ts
import {mediaFieldCapabilities} from '../../../src/shared/capabilities/media';
import {getAllMediaFieldIdsForComposition} from '../../../src/shared/capabilities/registry';

/**
 * Build variant key → template prop map for a specific composition.
 * Includes both generic keys and legacy keys, plus brand colour keys.
 */
const buildVariantKeyMap = (compositionId: string): Record<string, string> => {
  const map: Record<string, string> = {
    // Brand colours — always available
    brand_color: 'brandColor',
    secondary_color: 'secondaryColor',
    accent_color: 'accentColor',
    background_color: 'backgroundColor',
  };

  const mediaFieldIds = getAllMediaFieldIdsForComposition(compositionId);
  for (const fieldId of mediaFieldIds) {
    const field = mediaFieldCapabilities.find((f) => f.id === fieldId);
    if (!field) continue;

    // Primary variant key
    map[field.variantKey] = field.templateProp;

    // Legacy variant keys (backward compat)
    if (field.legacyVariantKeys) {
      for (const legacyKey of field.legacyVariantKeys) {
        map[legacyKey] = field.templateProp;
      }
    }
  }

  return map;
};
```

Update `extractVariantBrandSettings` to accept `compositionId`:
```ts
export const extractVariantBrandSettings = (
  variant: RenderVariant,
  templateBrandSettings?: Record<string, unknown>,
  compositionId?: string,
): Record<string, unknown> => {
  const variantKeyMap = compositionId
    ? buildVariantKeyMap(compositionId)
    : {
        brand_color: 'brandColor',
        secondary_color: 'secondaryColor',
        accent_color: 'accentColor',
        background_color: 'backgroundColor',
      };

  const result: Record<string, unknown> = {...(templateBrandSettings ?? {})};
  for (const [variantKey, templateProp] of Object.entries(variantKeyMap)) {
    const value = variant[variantKey];
    if (value !== undefined && value !== '') {
      result[templateProp] = value;
    }
  }
  return result;
};
```

Update `resolveVariantProps` to pass compositionId through:
```ts
export const resolveVariantProps = (
  template: RenderTemplate,
  variant: RenderVariant,
  compositionId?: string,
): RenderTemplate => {
  const variantValues = extractVariantBrandSettings(variant, undefined, compositionId);
  // ... rest of logic unchanged
};
```

Update `validateVariantMedia` to check both primary and legacy variant keys:
```ts
for (const fieldId of templateMediaFieldIds) {
  const field = mediaFieldById(fieldId);
  if (!field) continue;

  // Check primary variant key
  const value = variant[field.variantKey]
    // Also check legacy keys
    ?? field.legacyVariantKeys?.reduce<string | undefined>((found, key) => found ?? variant[key], undefined);

  if (!value || value === '') {
    if (field.required) errors.push(`Missing required: ${field.label}`);
    continue;
  }
  // ... validate URL
}
```

### 4c. Update renderer to pass compositionId

**File:** `api/src/services/renderer.ts`

```ts
export const makeInputProps = (
  compositionId: string,
  template: RenderTemplate,
  variant: RenderVariant,
): Record<string, unknown> => {
  const resolvedTemplate = resolveVariantProps(template, variant, compositionId);
  return getSchemaForTemplate(compositionId).parse(resolvedTemplate);
};
```

### 4d. Update quick template schemas (add generic media props)

**File:** `src/templates/registry.ts`

Add `image1Url` and `image2Url` to schemas that use specific image props. This way, if a user sends `image1_url` in their CSV, it resolves correctly:

In `productLaunchSchema`:
```ts
productImageUrl: z.string().optional(),
image1Url: z.string().optional(),     // generic alias
image2Url: z.string().optional(),     // generic alias (productImage was image2)
```

In `realEstateSchema`:
```ts
propertyImageUrl: z.string().optional(),
image1Url: z.string().optional(),     // generic alias
person1Url: z.string().optional(),    // generic alias for agent
```

**Note:** The compositions themselves (IntroScene.tsx, HeroScene.tsx) still read the original prop names. The generic `image1Url` etc. are accepted by the schema but the composition doesn't use them YET. This is fine — the props exist for the variant resolver to populate, and a future refactor can make compositions read from generic props.

### 4e. Update template capability metadata

**File:** `src/shared/capabilities/templates.ts`

Update `mediaFields` arrays to use new IDs:
- InsuranceAd: `['logo', 'backgroundImage']` (unchanged)
- ProductLaunch: `['image1', 'logo', 'backgroundImage']` (was `['productImage', ...]`)
- RealEstate: `['image1', 'person1', 'logo', 'backgroundImage']` (was `['propertyImage', 'agentImage', ...]`)
- SocialClip: `['person2', 'logo', 'backgroundImage']` (was `['speakerImage', ...]`)
- WebinarPromo: `['person2', 'logo', 'backgroundImage']` (was `['speakerImage', ...]`)

Also update `optionalPlaceholders` to include generic names alongside legacy ones.

### 4f. Update SceneBlockPlayer block definitions

**File:** `src/shared/capabilities/blocks.ts`

If any blocks reference `mediaFields` with old IDs, update to new IDs.

### 4g. Fix treatment contract (non-blocking but quick to fix)

**File:** `src/shared/capabilities/blocks.ts`

The `media-image` block declares treatment as `contentFields: [{key: 'treatment', type: 'image-treatment'}]`. But the schema and renderer use `imageTreatment` as a sibling of `content`. Fix the block definition:

Change:
```ts
contentFields: [
  {key: 'imageUrl', label: 'Image URL', type: 'image', placeholder: '{{primary_image_url}}'},
  {key: 'altText', label: 'Alt Text', type: 'text', placeholder: 'Descriptive text'},
  {key: 'treatment', label: 'Image Treatment', type: 'image-treatment'},
],
```
To:
```ts
contentFields: [
  {key: 'imageUrl', label: 'Image URL', type: 'image', placeholder: '{{primary_image_url}}'},
  {key: 'altText', label: 'Alt Text', type: 'text', placeholder: 'Descriptive text'},
],
supportsImageTreatment: true,
```

Add `supportsImageTreatment?: boolean` to `BlockCapability` type in `types.ts`.

### 4h. Update all tests

Update test files to use new field IDs, variant keys, and kinds:
- `src/shared/capabilities/media.test.ts`
- `api/src/services/variantResolution.test.ts`
- `api/src/services/mediaValidation.test.ts`
- `api/src/routes/v1/media.test.ts`
- `web/src/utils/mediaFields.test.ts`

## Execution Order

1. Fix SSRF in `mediaValidation.ts` (redirect loop + DNS resolution)
2. Fix public API policy in `routes/v1/media.ts`
3. Rename media field kinds/IDs in `media.ts` + add `legacyVariantKeys`
4. Update template capabilities in `templates.ts`
5. Update variant resolver to use dynamic composition-aware mapping
6. Update renderer to pass compositionId
7. Fix treatment contract in `blocks.ts` + `types.ts`
8. Add generic props to quick template schemas in `registry.ts`
9. Update block definitions for new media field IDs
10. Update all tests
11. Run `npm test` and `npm run typecheck`

## Verification

After all changes:
```bash
npm test
npm run typecheck
```

All 174+ tests should pass. New tests should cover:
- DNS resolution rejects hostnames resolving to private IPs
- Redirect loop rejects redirects to private targets (no request made to target)
- Legacy variant keys (property_image_url, product_image_url etc.) still work
- Generic variant keys (image1_url, image2_url etc.) work
- Public API does not accept caller-provided MIME/size limits
- media-image block has supportsImageTreatment (not treatment in contentFields)
