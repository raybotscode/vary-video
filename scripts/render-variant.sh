#!/usr/bin/env bash
set -euo pipefail

DATA_FILE="${1:-variants.json}"
OUTPUT_DIR="${2:-./public/renders}"

npx tsx scripts/batch-render.ts --composition InsuranceAd --data "$DATA_FILE" --output "$OUTPUT_DIR"
