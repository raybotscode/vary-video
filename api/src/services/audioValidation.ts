import path from 'node:path';

const ALLOWED_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a']);

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
]);

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export type AudioValidationError = {
  field: string;
  message: string;
};

export type AudioValidationResult =
  | {ok: true}
  | {ok: false; errors: AudioValidationError[]};

export const validateAudioFile = ({
  filename,
  mimeType,
  sizeBytes,
}: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): AudioValidationResult => {
  const errors: AudioValidationError[] = [];

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    errors.push({
      field: 'file',
      message: `Unsupported file extension "${ext}". Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
    });
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    errors.push({
      field: 'file',
      message: `Unsupported MIME type "${mimeType}". Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
    });
  }

  if (sizeBytes > MAX_SIZE_BYTES) {
    errors.push({
      field: 'file',
      message: `File too large (${(sizeBytes / 1024 / 1024).toFixed(1)}MB). Maximum: 20MB`,
    });
  }

  if (errors.length > 0) return {ok: false, errors};
  return {ok: true};
};

export const sanitizeFilename = (raw: string): string => {
  const base = path.basename(raw);
  // Remove path separators, control chars, collapse whitespace, cap length
  return base
    .replace(/[/\\]/g, '')
    .replace(/[\x00-\x1f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 200);
};
