/**
 * Audio File Detection & Validation Service for Tone
 * Handles audio format detection, MIME type resolution, browser audio compatibility,
 * and audio source validation.
 */

export const SUPPORTED_AUDIO_EXTENSIONS = [
  'mp3',
  'mpeg',
  'mpg',
  'wav',
  'm4a',
  'aac',
  'flac',
  'ogg',
  'oga',
  'opus',
  'weba',
] as const;

export const SUPPORTED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/aac',
  'audio/x-aac',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/x-ogg',
  'audio/opus',
  'audio/webm',
] as const;

export const ACCEPTED_INPUT_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'audio/ogg',
  '.mpeg',
  '.mp3',
  '.wav',
  '.m4a',
  '.aac',
  '.flac',
  '.ogg',
  'audio/*',
].join(',');

export const NO_SUPPORTED_AUDIO_FILES_MESSAGE =
  'No supported audio files detected. Supported formats: MP3, MPEG, WAV, M4A, AAC, FLAC and OGG.';

/**
 * Extracts lowercase file extension from filename.
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Resolves an appropriate audio MIME type for a file.
 * If file.type is valid audio/*, it is prioritized.
 * If file.type is empty, unusual, or generic (e.g. application/octet-stream, video/mpeg),
 * the filename extension is used as a reliable fallback.
 */
export function resolveAudioMimeType(file: { name: string; type?: string }): string {
  const ext = getFileExtension(file.name);
  const rawType = (file.type || '').trim().toLowerCase();

  // If MIME is a recognized specific audio type, use it
  if (rawType.startsWith('audio/') && rawType !== 'audio/unknown') {
    return rawType;
  }

  // Extension fallback mapping
  switch (ext) {
    case 'mpeg':
    case 'mpg':
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    case 'flac':
      return 'audio/flac';
    case 'ogg':
    case 'oga':
      return 'audio/ogg';
    case 'opus':
      return 'audio/opus';
    case 'weba':
      return 'audio/webm';
    default:
      return rawType || 'audio/mpeg';
  }
}

/**
 * Checks whether a file could potentially be an audio file based on:
 * - file.type (any audio/* or known audio MIME type)
 * - filename extension (including .mpeg, .mp3, .wav, .m4a, .aac, .flac, .ogg, etc.)
 * - fallback for empty or unusual MIME types (such as application/octet-stream or video/mpeg)
 */
export function isPotentialAudioFile(file: { name: string; type?: string }): boolean {
  if (!file || !file.name) return false;

  const rawType = (file.type || '').trim().toLowerCase();

  // Any audio/* MIME type is a candidate
  if (rawType.startsWith('audio/')) {
    return true;
  }

  // Check supported extension
  const ext = getFileExtension(file.name);
  if (!ext) return false;

  return (SUPPORTED_AUDIO_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Checks if the browser's audio engine can play the given MIME type.
 */
export function isBrowserAudioCodecSupported(mimeType: string): boolean {
  if (!mimeType) return true;
  if (typeof document === 'undefined' || !document.createElement) return true;

  try {
    const audio = document.createElement('audio');
    if (!audio.canPlayType) return true;

    // Check direct MIME
    let canPlay = audio.canPlayType(mimeType);
    if (canPlay === 'probably' || canPlay === 'maybe') {
      return true;
    }

    // Common alias fallbacks
    if (mimeType === 'audio/mp3') {
      canPlay = audio.canPlayType('audio/mpeg');
      if (canPlay === 'probably' || canPlay === 'maybe') return true;
    }

    if (mimeType === 'audio/x-wav' || mimeType === 'audio/wave') {
      canPlay = audio.canPlayType('audio/wav');
      if (canPlay === 'probably' || canPlay === 'maybe') return true;
    }

    if (mimeType === 'audio/x-m4a' || mimeType === 'audio/m4a') {
      canPlay = audio.canPlayType('audio/mp4');
      if (canPlay === 'probably' || canPlay === 'maybe') return true;
    }

    // If canPlayType returned a non-empty string, it's considered playable
    return canPlay !== '';
  } catch {
    return true;
  }
}

/**
 * Validates that the browser can actually create an audio source for the file
 * and parse its audio metadata. This ensures non-audio files or corrupt files
 * with audio extensions are rejected before being imported into the library.
 */
export function validateAudioSource(
  file: File | Blob,
  timeoutMs = 4000
): Promise<{ valid: boolean; duration: number }> {
  return new Promise((resolve) => {
    // In environments without HTML5 Audio (e.g. Node tests), resolve safely
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return resolve({ valid: true, duration: 0 });
    }

    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      return resolve({ valid: false, duration: 0 });
    }

    const audio = new Audio();
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      audio.onloadedmetadata = null;
      audio.oncanplay = null;
      audio.onerror = null;
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Safe ignore
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      // Timed out before the browser could create an audio source / parse headers
      resolve({ valid: false, duration: 0 });
    }, timeoutMs);

    audio.onloadedmetadata = () => {
      const duration = isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration) : 0;
      cleanup();
      clearTimeout(timer);
      resolve({ valid: true, duration });
    };

    audio.oncanplay = () => {
      const duration = isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration) : 0;
      cleanup();
      clearTimeout(timer);
      resolve({ valid: true, duration });
    };

    audio.onerror = () => {
      cleanup();
      clearTimeout(timer);
      resolve({ valid: false, duration: 0 });
    };

    audio.preload = 'metadata';
    audio.src = objectUrl;
  });
}

export interface ValidatedAudioItem {
  file: File;
  duration: number;
  resolvedType: string;
}

/**
 * Comprehensive file filtering and validation pipeline:
 * 1. Checks candidate file extension & MIME type (with extension fallback for empty/unusual types)
 * 2. Checks browser audio compatibility via canPlayType
 * 3. Validates that the browser can successfully create an audio source for each candidate
 */
export async function filterAndValidateAudioFiles(
  fileList: FileList | File[]
): Promise<{
  validFiles: ValidatedAudioItem[];
  invalidCount: number;
}> {
  const allFiles = Array.from(fileList);

  // Step 1: Pre-filter potential audio files by MIME and extension
  const potentialFiles = allFiles.filter(isPotentialAudioFile);
  const nonAudioCount = allFiles.length - potentialFiles.length;

  if (potentialFiles.length === 0) {
    return { validFiles: [], invalidCount: allFiles.length };
  }

  // Step 2: Validate each candidate file with browser compatibility & audio source creation
  const validFiles: ValidatedAudioItem[] = [];
  let failedValidationCount = 0;

  for (const file of potentialFiles) {
    const resolvedType = resolveAudioMimeType(file);

    // Check browser audio format support
    if (!isBrowserAudioCodecSupported(resolvedType)) {
      failedValidationCount++;
      continue;
    }

    // Audio source validation: verify browser can create and load an audio source
    const { valid, duration } = await validateAudioSource(file);
    if (valid) {
      validFiles.push({
        file,
        duration,
        resolvedType,
      });
    } else {
      failedValidationCount++;
    }
  }

  return {
    validFiles,
    invalidCount: nonAudioCount + failedValidationCount,
  };
}
