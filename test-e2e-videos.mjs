#!/usr/bin/env node
/**
 * vary-video end-to-end test — acts as a real user
 * Creates 5 videos using AI template generation + realistic CSV data
 * Saves rendered videos to /tmp/vary-video-test/
 */

const API = 'http://localhost:3001';
const OUTPUT_DIR = '/tmp/vary-video-test';

import fs from 'node:fs';
import path from 'node:path';

// ─── Realistic test data (text-only, no image references) ──────────
const testCases = [
  {
    name: 'SaaS Product Launch',
    prompt: 'Product launch video for a project management tool called FlowBoard. Blue and white theme. Features: real-time collaboration, Kanban boards, team analytics. Price $12/month. CTA: Start Free Trial.',
    variants: [
      { heading: 'FlowBoard', subheading: 'Project Management, Reimagined', body: 'Real-time collaboration for modern teams', cta: 'Start Free Trial', price: '$12/mo' },
      { heading: 'FlowBoard', subheading: 'Ship Faster Together', body: 'Kanban boards with live updates', cta: 'Try It Free', price: '$12/mo' },
    ],
  },
  {
    name: 'Real Estate Listing',
    prompt: 'Real estate video for a luxury 4-bed house in Malahide Dublin. Price 1.2 million euro. Elegant premium feel with gold accents on dark background. Agent: Sherry FitzGerald.',
    variants: [
      { heading: '4 Bed Detached, Malahide', body: 'Sea views, south-facing garden, smart home', price: '€1,200,000', cta: 'Book Viewing', subheading: 'Sherry FitzGerald' },
      { heading: 'Luxury Living, Malahide', body: '4 bed, 3 bath, 280 sqm, sea views', price: '€1,200,000', cta: 'View Details', subheading: 'Sherry FitzGerald' },
    ],
  },
  {
    name: 'Customer Testimonial',
    prompt: 'Testimonial video for a B2B SaaS success story. Customer Sarah Chen, VP Engineering at DataScale says the product cut deployment time by 80 percent. Clean trustworthy design with green accents.',
    variants: [
      { quote: 'Cut our deployment time by 80%', author: 'Sarah Chen', body: 'VP Engineering, DataScale', subheading: 'From 45 minutes to 9 minutes per deploy' },
      { quote: 'The best investment we made this year', author: 'Sarah Chen', body: 'VP Engineering, DataScale', subheading: 'ROI within the first month' },
    ],
  },
  {
    name: 'Tech Conference Promo',
    prompt: 'Event promo video for DevConnect 2026 in Dublin. October 15-16. Speakers from OpenAI and Stripe. Bold purple gradient. Early bird tickets 199 euro.',
    variants: [
      { heading: 'DevConnect 2026', body: 'Dublin, Oct 15-16', cta: 'Get Early Bird Tickets', price: '€199', subheading: '2 Days. 50 Speakers. 1 Community.' },
      { heading: 'DevConnect 2026', body: 'The Future of Software', cta: 'Register Now', price: '€199', subheading: 'OpenAI, Stripe, 50+ Speakers' },
    ],
  },
  {
    name: 'YouTube Channel Intro',
    prompt: 'YouTube intro for a tech education channel called CodeCraft. Energetic modern dark theme with neon green accents. Bold typography. Tagline: Build Ship Learn.',
    variants: [
      { heading: 'CodeCraft', subheading: 'Build. Ship. Learn.', body: 'New episodes every Tuesday' },
      { heading: 'CodeCraft', subheading: 'Level Up Your Code', body: 'Subscribe for weekly deep dives' },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────
async function apiPost(endpoint, body) {
  const res = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${data.error || JSON.stringify(data)}`);
  return data;
}

async function apiGet(endpoint) {
  const res = await fetch(`${API}${endpoint}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`${endpoint}: ${data.error || JSON.stringify(data)}`);
  return data;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main ───────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('🎬 vary-video end-to-end test');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🎯 ${testCases.length} videos to create\n`);

  const results = [];

  for (const [i, tc] of testCases.entries()) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📹 Video ${i + 1}/${testCases.length}: ${tc.name}`);
    console.log(`${'═'.repeat(60)}`);

    // Step 1: AI template generation (with retry)
    console.log(`\n🤖 Generating template from prompt...`);
    const genStart = Date.now();

    let genResult;
    let genAttempts = 0;
    const maxGenAttempts = 3;

    while (genAttempts < maxGenAttempts) {
      genAttempts++;
      try {
        genResult = await apiPost('/api/v1/generate-template', { prompt: tc.prompt });
        break;
      } catch (err) {
        if (genAttempts < maxGenAttempts && err.message.includes('JSON')) {
          console.log(`   ⚠️  AI returned invalid JSON, retrying (${genAttempts}/${maxGenAttempts})...`);
          await sleep(2000);
          continue;
        }
        console.error(`❌ AI generation failed: ${err.message}`);
        break;
      }
    }

    if (!genResult) {
      results.push({ name: tc.name, status: 'failed', error: 'AI generation failed after retries' });
      continue;
    }

    const genTime = ((Date.now() - genStart) / 1000).toFixed(1);
    console.log(`✅ Template generated in ${genTime}s`);
    console.log(`   Model: ${genResult.model}`);
    console.log(`   Mode: ${genResult.selectionMode}`);
    if (genResult.reusedTemplateId) {
      console.log(`   Reused: ${genResult.reusedTemplateId}`);
    }
    console.log(`   Tokens: ${genResult.tokensUsed?.input || '?'} in / ${genResult.tokensUsed?.output || '?'} out`);

    // Step 2: Submit render job
    console.log(`\n🎥 Submitting render job (${tc.variants.length} variants, 16:9)...`);

    const template = genResult.spec;
    const compositionId = template.compositionId || 'SceneBlockPlayer';

    let jobResult;
    try {
      jobResult = await apiPost('/api/render/batch', {
        compositionId,
        template,
        variants: tc.variants,
        formats: ['16:9'],
      });
    } catch (err) {
      console.error(`❌ Render submission failed: ${err.message}`);
      results.push({ name: tc.name, status: 'failed', error: err.message });
      continue;
    }

    console.log(`✅ Job created: ${jobResult.jobId}`);
    console.log(`   Estimated time: ${jobResult.estimatedTimeSeconds}s`);

    // Step 3: Poll for completion
    console.log(`\n⏳ Waiting for render...`);
    let status;
    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      await sleep(5000);
      attempts++;

      try {
        status = await apiGet(`/api/render/status/${jobResult.jobId}`);
      } catch {
        continue;
      }

      const bar = '█'.repeat(Math.floor(status.progress / 5)) + '░'.repeat(20 - Math.floor(status.progress / 5));
      process.stdout.write(`\r   [${bar}] ${status.progress}% — ${status.status} (${attempts * 5}s)`);

      if (status.status === 'completed') {
        console.log(`\n✅ Render complete!`);
        break;
      }
      if (status.status === 'failed') {
        console.log(`\n❌ Render failed: ${status.error}`);
        break;
      }
    }

    if (status?.status !== 'completed') {
      results.push({ name: tc.name, status: status?.status || 'timeout', error: status?.error });
      continue;
    }

    // Step 4: Download videos
    // status.downloads is an array of URL strings: ["/api/render/download/jobId/0", ...]
    const downloadUrls = status.downloads || [];
    console.log(`\n📥 Downloading ${downloadUrls.length} video(s)...`);

    for (let di = 0; di < downloadUrls.length; di++) {
      const dlUrl = `${API}${downloadUrls[di]}`;
      const filename = `${tc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-variant-${di + 1}.mp4`;
      const outPath = path.join(OUTPUT_DIR, filename);

      try {
        const res = await fetch(dlUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(outPath, buffer);
        const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
        console.log(`   ✅ ${filename} (${sizeMB} MB)`);
        results.push({ name: tc.name, status: 'success', file: outPath, size: sizeMB, filename });
      } catch (err) {
        console.error(`   ❌ ${filename}: ${err.message}`);
        results.push({ name: tc.name, status: 'download-failed', error: err.message });
      }
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 RESULTS SUMMARY`);
  console.log(`${'═'.repeat(60)}`);

  const success = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');

  console.log(`✅ Successful: ${success.length}`);
  for (const r of success) {
    console.log(`   ${r.name} — ${r.size} MB — ${r.filename}`);
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    for (const r of failed) {
      console.log(`   ${r.name}: ${r.error || r.status}`);
    }
  }

  console.log(`\n📁 All videos saved to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
