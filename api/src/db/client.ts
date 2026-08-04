import Database from 'better-sqlite3';
import {drizzle} from 'drizzle-orm/better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as schema from './schema.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../../..');
const dbPath = path.join(projectRoot, 'data/vary.db');

// Ensure data/ directory exists
fs.mkdirSync(path.dirname(dbPath), {recursive: true});

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Auto-create tables if they don't exist (idempotent)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','rendering','completed','failed')),
    progress REAL NOT NULL DEFAULT 0,
    completed_variants INTEGER NOT NULL DEFAULT 0,
    total_variants INTEGER NOT NULL DEFAULT 0,
    composition_id TEXT NOT NULL,
    template TEXT NOT NULL,
    variants TEXT NOT NULL,
    formats TEXT NOT NULL DEFAULT '["16:9"]',
    error TEXT,
    user_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    variant_index INTEGER NOT NULL,
    format TEXT NOT NULL,
    output_path TEXT NOT NULL,
    download_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ai_generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    estimated_cost_usd REAL NOT NULL,
    selection_mode TEXT NOT NULL CHECK(selection_mode IN ('existing-template', 'block-composition')),
    reused_template_id TEXT,
    prompt_length INTEGER NOT NULL,
    success INTEGER NOT NULL DEFAULT 1,
    error_message TEXT,
    user_id TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_job_downloads_job_id ON job_downloads(job_id);
  CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);
`);

export const db = drizzle(sqlite, {schema});
