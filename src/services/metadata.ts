import { SongMetadata } from '../types/music';
import { resolveAudioMimeType } from './audioDetector';

function normalizeImageMimeType(value?: string): string {
  const mime = (value || 'image/jpeg').trim().toLowerCase();
  return mime.startsWith('image/') ? mime : 'image/jpeg';
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += Array.from(chunk)
      .map((byte) => String.fromCharCode(byte))
      .join('');
  }

  return btoa(binary);
}

function createArtworkData(bytes: Uint8Array, mimeType?: string): {
  coverArt: string;
  coverArtBlob: Blob;
  coverArtMimeType: string;
} {
  const normalizedMime = normalizeImageMimeType(mimeType);
  const blob = new Blob([bytes], { type: normalizedMime });
  const dataUrl = `data:${normalizedMime};base64,${uint8ArrayToBase64(bytes)}`;

  return {
    coverArt: dataUrl,
    coverArtBlob: blob,
    coverArtMimeType: normalizedMime,
  };
}

// Generate a deterministic SVG cover art data URL based on title + artist
export function generateCoverArt(title: string, artist: string): string {
  const seed = `${title}-${artist}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 45 + (Math.abs(hash >> 3) % 90)) % 360;
  const initial = (title.trim()[0] || '🎵').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 75%, 35%)" />
        <stop offset="50%" stop-color="hsl(${(hue1 + hue2) / 2}, 70%, 25%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 85%, 15%)" />
      </linearGradient>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="300" height="300" rx="24" fill="url(#grad)" />
    <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
    <circle cx="150" cy="150" r="75" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="4 4" />
    <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
    <circle cx="150" cy="150" r="32" fill="rgba(255,255,255,0.08)" />
    <text x="150" y="162" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle" filter="url(#softGlow)">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function readId3HeaderBuffer(file: File): Promise<ArrayBuffer | null> {
  if (file.size === 0) return null;

  const headerSlice = await file.slice(0, 10).arrayBuffer();
  if (headerSlice.byteLength < 10) return null;

  const headerView = new DataView(headerSlice);
  const id3 = String.fromCharCode(headerView.getUint8(0), headerView.getUint8(1), headerView.getUint8(2));
  if (id3 !== 'ID3') return null;

  const tagSize =
    ((headerView.getUint8(6) & 0x7f) << 21) |
    ((headerView.getUint8(7) & 0x7f) << 14) |
    ((headerView.getUint8(8) & 0x7f) << 7) |
    (headerView.getUint8(9) & 0x7f);

  const totalTagBytes = Math.min(file.size, 10 + tagSize);
  if (totalTagBytes <= 10) return null;

  return file.slice(0, totalTagBytes).arrayBuffer();
}

/**
 * Parses ID3v2 tags from ArrayBuffer slice (TIT2, TPE1, TALB, APIC)
 */
async function parseID3Tags(buffer: ArrayBuffer): Promise<{
  title?: string;
  artist?: string;
  album?: string;
  coverArt?: string;
  coverArtBlob?: Blob;
  coverArtMimeType?: string;
}> {
  const result: {
    title?: string;
    artist?: string;
    album?: string;
    coverArt?: string;
    coverArtBlob?: Blob;
    coverArtMimeType?: string;
  } = {};
  const view = new DataView(buffer);

  if (buffer.byteLength < 10) return result;
  const id3 = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
  if (id3 !== 'ID3') return result;

  const version = view.getUint8(3);
  const tagSize =
    ((view.getUint8(6) & 0x7f) << 21) |
    ((view.getUint8(7) & 0x7f) << 14) |
    ((view.getUint8(8) & 0x7f) << 7) |
    (view.getUint8(9) & 0x7f);

  let offset = 10;
  const maxOffset = Math.min(buffer.byteLength, 10 + tagSize);

  while (offset < maxOffset - 10) {
    let frameId = '';
    for (let i = 0; i < 4; i++) {
      frameId += String.fromCharCode(view.getUint8(offset + i));
    }

    if (!frameId.match(/^[A-Z0-9]{4}$/)) break;

    let frameSize = 0;
    if (version === 4) {
      frameSize =
        ((view.getUint8(offset + 4) & 0x7f) << 21) |
        ((view.getUint8(offset + 5) & 0x7f) << 14) |
        ((view.getUint8(offset + 6) & 0x7f) << 7) |
        (view.getUint8(offset + 7) & 0x7f);
    } else {
      frameSize = view.getUint32(offset + 4);
    }

    if (frameSize <= 0 || offset + 10 + frameSize > maxOffset) break;

    const frameDataOffset = offset + 10;

    if (['TIT2', 'TPE1', 'TALB'].includes(frameId)) {
      try {
        const encoding = view.getUint8(frameDataOffset);
        const textBytes = new Uint8Array(buffer, frameDataOffset + 1, frameSize - 1);
        let text = '';
        if (encoding === 0 || encoding === 3) {
          text = new TextDecoder('utf-8').decode(textBytes);
        } else {
          text = new TextDecoder('utf-16').decode(textBytes);
        }
        text = text.replace(/\0/g, '').trim();

        if (frameId === 'TIT2' && text) result.title = text;
        if (frameId === 'TPE1' && text) result.artist = text;
        if (frameId === 'TALB' && text) result.album = text;
      } catch {
        // Continue on decode error
      }
    } else if (frameId === 'APIC') {
      try {
        const payload = new Uint8Array(buffer, frameDataOffset, frameSize);
        if (payload.length < 2) continue;

        const encoding = payload[0];
        let mimeEnd = 1;
        while (mimeEnd < payload.length && payload[mimeEnd] !== 0) mimeEnd++;
        if (mimeEnd >= payload.length) continue;

        const mimeType = new TextDecoder('latin1').decode(payload.subarray(1, mimeEnd));
        let cursor = mimeEnd + 1;
        cursor += 1;

        while (cursor < payload.length && payload[cursor] !== 0) cursor++;
        if (cursor < payload.length) cursor++;

        if (cursor >= payload.length) continue;

        const imageBytes = payload.subarray(cursor);
        if (encoding === 0 || encoding === 3) {
          // Some encoders write a UTF-8 encoded picture description before the binary payload; strip the description if present.
        }

        if (imageBytes.length > 0) {
          const artwork = createArtworkData(imageBytes, mimeType || 'image/jpeg');
          result.coverArt = artwork.coverArt;
          result.coverArtBlob = artwork.coverArtBlob;
          result.coverArtMimeType = artwork.coverArtMimeType;
        }
      } catch {
        // Continue on artwork error
      }
    }

    offset += 10 + frameSize;
  }

  return result;
}

/**
 * Extracts audio duration in seconds safely using an HTML5 Audio object
 */
export function getAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();

    const cleanup = () => {
      audio.onloadedmetadata = null;
      audio.onerror = null;
      URL.revokeObjectURL(objectUrl);
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(0);
    }, 5000);

    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      cleanup();
      resolve(duration);
    };

    audio.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve(0);
    };

    audio.preload = 'metadata';
    audio.src = objectUrl;
  });
}

/**
 * Parses file name into readable title and artist
 */
export function parseFilename(filename: string): { title: string; artist: string } {
  // Remove extension
  const withoutExt = filename.replace(/\.[^/.]+$/, '').trim();

  // Pattern: "Artist - Title" or "Artist - Track - Title"
  if (withoutExt.includes(' - ')) {
    const parts = withoutExt.split(' - ');
    if (parts.length >= 2) {
      const artist = parts[0].replace(/_/g, ' ').trim();
      const title = parts.slice(1).join(' - ').replace(/_/g, ' ').trim();
      return { title: title || withoutExt, artist: artist || 'Unknown Artist' };
    }
  }

  // Pattern: "Track# - Title" or "01. Title"
  const cleanTitle = withoutExt
    .replace(/^[\d\s.\-_]+/, '')
    .replace(/_/g, ' ')
    .trim();

  return {
    title: cleanTitle || withoutExt,
    artist: 'Unknown Artist',
  };
}

/**
 * Extracts comprehensive metadata from an audio file
 */
export async function extractMetadataFromFile(
  file: File,
  knownDuration?: number
): Promise<Omit<SongMetadata, 'id' | 'dateAdded'>> {
  const fallback = parseFilename(file.name);
  let id3: {
    title?: string;
    artist?: string;
    album?: string;
    coverArt?: string;
    coverArtBlob?: Blob;
    coverArtMimeType?: string;
  } = {};

  try {
    const buffer = await readId3HeaderBuffer(file);
    if (buffer) {
      id3 = await parseID3Tags(buffer);
    }
  } catch {
    // Ignore and use fallback
  }

  const duration =
    knownDuration !== undefined && knownDuration > 0
      ? knownDuration
      : await getAudioDuration(file);

  const title = id3.title || fallback.title;
  const artist = id3.artist || fallback.artist;
  const album = id3.album || 'Unknown Album';
  const coverArt = id3.coverArt || generateCoverArt(title, artist);
  const resolvedType = resolveAudioMimeType(file);

  return {
    title,
    artist,
    album,
    duration,
    filename: file.name,
    size: file.size,
    type: resolvedType,
    coverArt,
    coverArtBlob: id3.coverArtBlob || null,
    coverArtMimeType: id3.coverArtMimeType || (coverArt.startsWith('data:image/') ? coverArt.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1] || 'image/jpeg' : 'image/png'),
  };
}

/**
 * Formats seconds into "M:SS" or "H:MM:SS"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
