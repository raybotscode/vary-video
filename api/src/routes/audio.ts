import {Router} from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import {parseFile} from 'music-metadata';
import {validateAudioFile, sanitizeFilename} from '../services/audioValidation.js';
import {
  generateAudioJobId,
  saveAudioFile,
  deleteTempFile,
  listAudioFiles,
} from '../services/audioStorage.js';

const upload = multer({
  dest: 'public/audio/.tmp',
  limits: {fileSize: 20 * 1024 * 1024},
});

export const audioRouter = Router();

audioRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({error: 'No audio file provided'});
      return;
    }

    // Validate extension/MIME/size
    const validation = validateAudioFile({
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    if (!validation.ok) {
      await deleteTempFile(file.path);
      res.status(400).json({error: validation.errors.map((e) => e.message).join('; ')});
      return;
    }

    // Parse audio metadata for duration
    let durationSeconds: number | null = null;
    try {
      const metadata = await parseFile(file.path);
      durationSeconds = metadata.format.duration ?? null;
    } catch {
      // metadata parse failed — not fatal, duration will be null
    }

    const jobId = (req.body?.jobId as string) || generateAudioJobId();
    const safeFilename = sanitizeFilename(file.originalname);

    const stored = await saveAudioFile({
      tempPath: file.path,
      jobId,
      filename: safeFilename,
      mimeType: file.mimetype,
      durationSeconds,
    });

    res.json(stored);
  } catch (error) {
    // Clean up temp file on any error
    if (req.file?.path) {
      await deleteTempFile(req.file.path).catch(() => {});
    }
    res.status(500).json({error: error instanceof Error ? error.message : 'Upload failed'});
  }
});

audioRouter.get('/', async (_req, res) => {
  try {
    const audio = await listAudioFiles();
    res.json({audio});
  } catch (error) {
    res.status(500).json({error: error instanceof Error ? error.message : 'Failed to list audio'});
  }
});
