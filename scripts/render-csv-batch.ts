#!/usr/bin/env tsx
/**
 * Simple batch renderer for InsuranceAd variants from a CSV file.
 * Renders each row as a separate MP4 using npx remotion render.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';

const CSV_PATH = path.resolve(__dirname, '../test-data/sample-insurance-leads.csv');
const OUTPUT_DIR = path.resolve(__dirname, '../public/renders');
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface VariantRow {
  age: string;
  gender: string;
  location: string;
  company: string;
  insurance_type: string;
  coverage_type: string;
  price_per_month: string;
  brand_color: string;
  secondary_color: string;
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || '').trim();
    });
    return row;
  });
}

function buildHeadline(row: Record<string, string>): string {
  // Dynamically build a headline based on insurance type
  const typeMap: Record<string, string> = {
    auto: 'Protect your {{insurance_type}} with {{coverage_type}} — just {{price_per_month}}',
    home: 'Secure your {{insurance_type}} with {{coverage_type}} — starting at {{price_per_month}}',
    life: 'Give your family {{coverage_type}} {{insurance_type}} insurance from {{price_per_month}}',
    health: 'Get {{coverage_type}} {{insurance_type}} insurance for only {{price_per_month}}',
    travel: 'Travel worry-free with {{coverage_type}} {{insurance_type}} insurance at {{price_per_month}}',
  };
  return typeMap[row.insurance_type] || `Are you a {{age}} year old {{gender}} in {{location}}?`;
}

function buildSubheadline(row: Record<string, string>): string {
  return `Get covered today with {{company}}`;
}

function buildProps(row: Record<string, string>): Record<string, unknown> {
  return {
    headlineTemplate: buildHeadline(row),
    subheadlineTemplate: buildSubheadline(row),
    data: {
      age: row.age,
      gender: row.gender,
      location: row.location,
      company: row.company,
      insurance_type: row.insurance_type,
      coverage_type: row.coverage_type,
      price_per_month: row.price_per_month,
    },
    ctaText: `Get Your ${(row.insurance_type || 'insurance').charAt(0).toUpperCase() + (row.insurance_type || 'insurance').slice(1)} Quote`,
    brandColor: row.brand_color,
    secondaryColor: row.secondary_color,
    logoUrl: '',
    backgroundType: 'gradient',
    backgroundColor: row.brand_color,
  };
}

function renderVariant(row: Record<string, string>, index: number): string {
  const outputPath = path.join(OUTPUT_DIR, `insurance-ad-variant-${index + 1}.mp4`);
  const props = buildProps(row);
  const propsJson = JSON.stringify(props).replace(/'/g, "'\\''");

  console.log(`\n🎬 Rendering variant ${index + 1}: ${row.company} ${row.insurance_type}...`);
  console.log(`   Props: ${row.age}y/o ${row.gender} in ${row.location}`);

  const cmd = `npx remotion render src/index.ts InsuranceAd "${outputPath}" --props='${JSON.stringify(props)}'`;
  console.log(`   Command: ${cmd.substring(0, 120)}...`);

  try {
    execSync(cmd, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      timeout: 300_000, // 5 min timeout per video
    });
    console.log(`   ✅ Done: ${outputPath}`);
    return outputPath;
  } catch (err) {
    console.error(`   ❌ Failed: ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  }
}

async function main() {
  const csv = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(csv);
  console.log(`📊 Loaded ${rows.length} variants from CSV`);

  fs.mkdirSync(OUTPUT_DIR, {recursive: true});

  const results: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    try {
      const path = renderVariant(rows[i], i);
      results.push(path);
    } catch {
      console.error(`Skipping variant ${i + 1} due to error`);
    }
  }

  console.log('\n=== RENDER SUMMARY ===');
  console.log(`Total variants: ${rows.length}`);
  console.log(`Successfully rendered: ${results.length}`);
  console.log('\nOutput paths:');
  results.forEach((p) => console.log(`  ${p}`));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
