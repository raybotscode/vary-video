# Review: Phase 3 SSRF Hardening + Generic Media Naming

Review commit a7938a3 against its parent a580d0e.

## Context

Two Codex reviews (phase3_commits12.md and phase3_commits34.md) returned REQUEST_CHANGES with these blockers:

1. SSRF: redirect chain fetches private targets before rejecting
2. SSRF: hostname checks don't resolve DNS (public domains → private IPs)
3. Public API lets callers weaken MIME/size policy
4. Media field naming locked to real-estate/product specific terms (propertyImage, productImage, agentImage, speakerImage)
5. media-image block treatment contract mismatch (content.treatment vs imageTreatment)

This commit addresses all 5. Review whether the fixes are complete and correct.

## Review Checklist

### SSRF — Redirect Chain
- `mediaValidation.ts` should use `redirect: 'manual'`, not `'follow'`
- Each redirect hop should be validated with `validateUrlLocally()` BEFORE the next fetch
- HTTPS→HTTP downgrade should be blocked before following
- Max redirect hops should be capped

### SSRF — DNS Resolution
- `validateUrlLocally()` should be async and call `dns.lookup()` to resolve hostnames
- Resolved addresses should be checked against comprehensive denylists:
  - IPv4: 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, 0/8, 100.64/10, 198.18/15, 192.0/24, 192.0.2/24, 198.51.100/24, 203.0.113/24, 224/4, 240/4
  - IPv6: ::1, fc00::/7, fe80::/10, ::/128, 100::/64, 2001:db8::/32
  - IPv4-mapped IPv6 (::ffff:0:0/96) should extract embedded IPv4 and check IPv4 denylist
- DNS lookup failures should be reported as errors

### Public API Policy
- `/api/v1/media/validate` and `/validate-batch` should NOT accept `acceptedMimeTypes` or `maxBytes` from request body
- Should use `ACCEPTED_IMAGE_MIME_TYPES` and `MAX_IMAGE_BYTES` from shared module
- `/accepted-types` should use the shared constants too

### Generic Naming
- `MediaFieldKind` should use generic names: image1, image2, person1, person2 (not property-image, product-image, etc.)
- `mediaFieldCapabilities` should use generic IDs and labels
- `legacyVariantKeys` field should provide backward compat for old CSV column names
- Template capabilities should reference new generic IDs in `mediaFields` arrays
- Variant resolver should build mapping dynamically from composition, not static map

### Treatment Contract
- `media-image` block should NOT have `treatment` in `contentFields`
- Should have `supportsImageTreatment: true` instead
- `BlockCapability` type should include `supportsImageTreatment?: boolean`

### Async Propagation
- `validateUrlLocally()` is now async — all callers should await it
- `validateVariantMedia()` and `validateBatchVariants()` should be async
- `render.ts` route handler should await `validateBatchVariants()`

## Test Verification

```bash
npm test
npm run typecheck
```

Expect 179+ tests passing.

## Output Format

Return:
- VERDICT: APPROVE or REQUEST_CHANGES
- For each checklist item: PASS, FAIL, or NOTE
- Any remaining blockers or concerns
- Test coverage gaps that should be addressed
