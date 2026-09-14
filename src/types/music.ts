export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  filename: string;
  size: number;
  type: string;
  dateAdded: number; // timestamp
  coverArt?: string; // data URL or generated gradient
  isCleaned?: boolean;
  originalSongId?: string;
  isFavorite?: boolean;
}

export interface Song extends SongMetadata {
  audioBlob: Blob;
}

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export type SortOption = 'dateAdded' | 'title' | 'artist';
export type SortDirection = 'asc' | 'desc';

export type ActiveTab = 'home' | 'library' | 'settings';

export interface PlayerSettings {
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  volume: number;
  lastPlayedSongId: string | null;
  lastPosition: number;
  theme: 'dark' | 'light' | 'system';
  keepOriginalFiles: boolean;
}

export interface StorageStats {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  songCount: number;
}
