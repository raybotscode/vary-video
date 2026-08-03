import fs from 'node:fs/promises';
import path from 'node:path';

export type StoredAudio = {
  id: string;
  jobId: string;
  filename: string;
  url: string;
  sizeBytes: number;
  durationSeconds: number | null;
  mimeType: string;
};

const AUDIO_ROOT = 'public/audio';

const getProjectRoot = (): string => {
  // api/src/services → api/src → api → project root
  return path.resolve(import.meta.dirname, '../../..');
};

const audioRootPath = (): string => path.join(getProjectRoot(), AUDIO_ROOT);

export const ensureAudioDir = async (jobId: string): Promise<string> => {
  const dir = path.join(audioRootPath(), jobId);
  await fs.mkdir(dir, {recursive: true});
  return dir;
};

export const generateAudioJobId = (): string =>
  `audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const saveAudioFile = async ({
  tempPath,
  jobId,
  filename,
  mimeType,
  durationSeconds,
}: {
  tempPath: string;
  jobId: string;
  filename: string;
  mimeType: string;
  durationSeconds: number | null;
}): Promise<StoredAudio> => {
  const dir = await ensureAudioDir(jobId);
  const destPath = path.join(dir, filename);
  await fs.rename(tempPath, destPath);

  const stat = await fs.stat(destPath);

  return {
    id: `${jobId}/${filename}`,
    jobId,
    filename,
    url: `/audio/${jobId}/${filename}`,
    sizeBytes: stat.size,
    durationSeconds,
    mimeType,
  };
};

export const deleteTempFile = async (tempPath: string): Promise<void> => {
  try {
    await fs.unlink(tempPath);
  } catch {
    // ignore — already gone
  }
};

export const listAudioFiles = async (): Promise<StoredAudio[]> => {
  const root = audioRootPath();
  const results: StoredAudio[] = [];

  let jobDirs: string[];
  try {
    const entries = await fs.readdir(root, {withFileTypes: true});
    jobDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return results;
  }

  for (const jobDir of jobDirs) {
    if (jobDir === '.tmp') continue;
    const jobPath = path.join(root, jobDir);
    const files = await fs.readdir(jobPath);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const filePath = path.join(jobPath, file);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) continue;

      const ext = path.extname(file).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
      };

      results.push({
        id: `${jobDir}/${file}`,
        jobId: jobDir,
        filename: file,
        url: `/audio/${jobDir}/${file}`,
        sizeBytes: stat.size,
        durationSeconds: null, // not cached on list
        mimeType: mimeMap[ext] ?? 'application/octet-stream',
      });
    }
  }

  return results;
};
