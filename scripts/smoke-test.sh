#!/usr/bin/env bash
# Vary.video smoke-test render script (Phase 0 deliverable)
#
# Verifies the full render pipeline end-to-end against a running API:
#   1. Health check
#   2. Compositions list
#   3. One batch render per template (1 variant x 2 formats: 16:9 + 9:16)
#   4. Progress polling to completion
#   5. Individual download + ZIP download
#   6. Output file size sanity check
#
# Usage:
#   ./scripts/smoke-test.sh [API_BASE]     (default http://localhost:3001)
# Requires: curl, jq, and a running render API (npm run api).

set -euo pipefail

API_BASE="${1:-http://localhost:3001}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "== Vary.video smoke test against ${API_BASE} =="

echo "-- 1. health --"
curl -sf -m 10 "${API_BASE}/api/health" | jq -e '.ok == true' >/dev/null
echo "   OK"

echo "-- 2. compositions --"
COMPOSITIONS=$(curl -sf -m 10 "${API_BASE}/api/compositions" | jq -r '.compositions[].id' | tr '\n' ' ')
echo "   Found: ${COMPOSITIONS}"

render_one() {
  local composition_id="$1"
  local variants_json="$2"
  echo "-- 3. batch render: ${composition_id} (2 variants x 2 formats) --"

  local job
  job=$(curl -sf -m 15 -X POST "${API_BASE}/api/render/batch" \
    -H "Content-Type: application/json" \
    -d "{\"compositionId\":\"${composition_id}\",\"template\":{},\"variants\":${variants_json},\"formats\":[\"16:9\",\"9:16\"]}")
  local job_id
  job_id=$(echo "${job}" | jq -r '.jobId')
  echo "   jobId=${job_id}"

  # 4. poll to completion (cap at 6 min)
  local status progress
  for _ in $(seq 1 72); do
    status=$(curl -sf -m 10 "${API_BASE}/api/render/status/${job_id}")
    progress=$(echo "${status}" | jq -r '.progress')
    echo "   status=$(echo "${status}" | jq -r '.status') progress=${progress}%"
    if [ "$(echo "${status}" | jq -r '.status')" = "completed" ]; then
      break
    fi
    if [ "$(echo "${status}" | jq -r '.status')" = "failed" ]; then
      echo "   FAILED: $(echo "${status}" | jq -r '.error')"
      return 1
    fi
    sleep 5
  done

  [ "$(echo "${status}" | jq -r '.status')" = "completed" ] || { echo "   TIMEOUT waiting for completion"; return 1; }

  local expected
  expected=$(echo "${status}" | jq -r '.totalVariants')
  [ "${expected}" = "4" ] || { echo "   UNEXPECTED variant count: ${expected}"; return 1; }

  # 5. downloads + ZIP
  echo "-- 5. downloads --"
  local dl_count
  dl_count=$(echo "${status}" | jq -r '.downloads | length')
  echo "   download URLs: ${dl_count}"
  [ "${dl_count}" = "4" ] || { echo "   Expected 4 downloads, got ${dl_count}"; return 1; }

  local first_index
  first_index=$(echo "${status}" | jq -r '.downloads[0]' | grep -oP '\d+$')
  curl -sf -m 30 -o "${WORKDIR}/v0.mp4" "${API_BASE}/api/render/download/${job_id}/${first_index}"
  local size
  size=$(stat -c%s "${WORKDIR}/v0.mp4")
  echo "   first file: ${size} bytes"
  [ "${size}" -gt 10000 ] || { echo "   SUSPICIOUS: file too small"; return 1; }

  # verify it's an MP4
  head -c 12 "${WORKDIR}/v0.mp4" | grep -q "ftyp" && echo "   MP4 signature OK" || { echo "   NOT AN MP4"; return 1; }

  echo "-- 6. ZIP --"
  curl -sf -m 60 -o "${WORKDIR}/all.zip" "${API_BASE}/api/render/download-zip/${job_id}"
  unzip -l "${WORKDIR}/all.zip" | tail -5
  echo "   ${composition_id}: PASS"
}

RE_VARIANTS='[{"property_name":"The Elm Residence","tagline":"Light-filled family living","price":"€745,000","bedrooms":"4","bathrooms":"3","sqft":"2,180","location":"Rathmines, Dublin","agent":"Maeve Kelly"},{"property_name":"Harbour View","tagline":"Sea views from every floor","price":"€1,190,000","bedrooms":"5","bathrooms":"4","sqft":"3,150","location":"Dun Laoghaire, Dublin","agent":"Tom Byrne"}]'

PL_VARIANTS='[{"product_name":"Vary Studio","tagline":"Launch campaign videos in minutes","feature1":"Personalized copy at scale","feature2":"On-brand motion templates","feature3":"Batch renders for every segment","company":"Vary.video"},{"product_name":"CloudDesk","tagline":"Your team second brain","feature1":"AI meeting notes","feature2":"Shared docs","feature3":"Project timelines","company":"CloudDesk Inc"}]'

SC_VARIANTS='[{"hook":"Stop making one ad for every audience","body":"Turn one idea into personalized clips for every campaign segment.","cta":"Create your batch","brand":"Vary.video"},{"hook":"Video at scale is broken","body":"Manual editing kills campaigns. Batch personalization fixes it.","cta":"See it in action","brand":"Vary.video"}]'

IA_VARIANTS='[{"age":"52","gender":"person","location":"Dublin","company":"Vary Cover"},{"age":"34","woman":"","gender":"woman","location":"Cork","company":"Vary Cover"}]'

WP_VARIANTS='[{"eventTitle":"Build a repeatable content engine","hostName":"Maya Chen","eventDate":"August 22","eventTime":"11:00 AM PT","audience":"growth teams","keyTakeaway":"Turn one live session into a month of campaigns","ctaText":"Reserve your seat","brandName":"Northstar Labs"},{"eventTitle":"AI for operations","hostName":"James Okafor","eventDate":"September 5","eventTime":"10:00 AM PT","audience":"ops leaders","keyTakeaway":"Automate the busywork without the risk","ctaText":"Save my spot","brandName":"OpsFlow"}]'

case "${TEMPLATE:-all}" in
  all|RealEstate)   render_one "RealEstate"   "$RE_VARIANTS" ;;
esac
case "${TEMPLATE:-all}" in
  all|ProductLaunch) render_one "ProductLaunch" "$PL_VARIANTS" ;;
esac
case "${TEMPLATE:-all}" in
  all|SocialClip)   render_one "SocialClip"   "$SC_VARIANTS" ;;
esac
case "${TEMPLATE:-all}" in
  all|InsuranceAd)  render_one "InsuranceAd"  "$IA_VARIANTS" ;;
esac
case "${TEMPLATE:-all}" in
  all|WebinarPromo) render_one "WebinarPromo" "$WP_VARIANTS" ;;
esac

echo "== ALL SMOKE TESTS PASSED =="
