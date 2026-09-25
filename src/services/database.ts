import { Song, SongMetadata, PlayerSettings } from '../types/music';

const DB_NAME = 'RandomTuneDB';
const DB_VERSION = 1;
const STORE_SONGS = 'songs';
const STORE_SETTINGS = 'settings';

export class QuotaExceededError extends Error {
  constructor(message = 'Your browser storage is full. Remove some songs and try again.') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_SONGS)) {
          const songsStore = db.createObjectStore(STORE_SONGS, { keyPath: 'id' });
          songsStore.createIndex('dateAdded', 'dateAdded', { unique: false });
          songsStore.createIndex('title', 'title', { unique: false });
          songsStore.createIndex('artist', 'artist', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };

      request.onblocked = () => {
        console.warn('Tone IndexedDB database blocked.');
      };
    });
  }
  return dbPromise;
}

/**
 * Saves a new song with its audio blob to IndexedDB
 */
export async function saveSong(song: Song): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_SONGS], 'readwrite');
      const store = tx.objectStore(STORE_SONGS);
      const req = store.put(song);

      req.onsuccess = () => resolve();

      req.onerror = (e) => {
        const error = (e.target as IDBRequest).error;
        if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          reject(new QuotaExceededError());
        } else {
          reject(error);
        }
      };

      tx.onabort = (e) => {
        const error = tx.error || (e.target as IDBTransaction).error;
        if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          reject(new QuotaExceededError());
        } else {
          reject(error || new Error('Transaction aborted'));
        }
      };
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === 'QuotaExceededError') {
        reject(new QuotaExceededError());
      } else {
        reject(err);
      }
    }
  });
}

/**
 * Saves multiple songs in a single transaction with quota error catch
 */
export async function saveMultipleSongs(songs: Song[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_SONGS], 'readwrite');
      const store = tx.objectStore(STORE_SONGS);

      for (const song of songs) {
        store.put(song);
      }

      tx.oncomplete = () => resolve();

      tx.onerror = (e) => {
        const error = (e.target as IDBTransaction).error;
        if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          reject(new QuotaExceededError());
        } else {
          reject(error);
        }
      };

      tx.onabort = (e) => {
        const error = tx.error || (e.target as IDBTransaction).error;
        if (error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          reject(new QuotaExceededError());
        } else {
          reject(error || new Error('Batch transaction aborted'));
        }
      };
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === 'QuotaExceededError') {
        reject(new QuotaExceededError());
      } else {
        reject(err);
      }
    }
  });
}

/**
 * Returns all songs metadata ONLY (excluding audioBlob for high performance & low RAM)
 */
export async function getAllSongsMetadata(): Promise<SongMetadata[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SONGS], 'readonly');
    const store = tx.objectStore(STORE_SONGS);
    const metadataList: SongMetadata[] = [];

    // Use cursor to stream metadata without duplicating blob memory in list
    const req = store.openCursor();
    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const val = cursor.value as Song;
        metadataList.push({
          id: val.id,
          title: val.title,
          artist: val.artist,
          album: val.album,
          duration: val.duration,
          filename: val.filename,
          size: val.size,
          type: val.type,
          dateAdded: val.dateAdded,
          coverArt: val.coverArt,
          coverArtBlob: val.coverArtBlob instanceof Blob ? val.coverArtBlob : undefined,
          coverArtMimeType:
            val.coverArtMimeType ||
            (typeof val.coverArt === 'string' && val.coverArt.startsWith('data:image/')
              ? val.coverArt.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1] || 'image/jpeg'
              : undefined),
          isCleaned: val.isCleaned,
          originalSongId: val.originalSongId,
          isFavorite: val.isFavorite,
        });
        cursor.continue();
      } else {
        resolve(metadataList);
      }
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Updates partial metadata for a song without altering the audio blob
 */
export async function updateSongMetadata(id: string, updates: Partial<SongMetadata>): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SONGS], 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const song = getReq.result as Song | undefined;
      if (!song) {
        reject(new Error('Song not found'));
        return;
      }
      const updatedSong: Song = {
        ...song,
        ...updates,
      };
      const putReq = store.put(updatedSong);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Fetches the audio Blob for a specific song ID on-demand for playback
 */
export async function getSongAudioBlob(id: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SONGS], 'readonly');
    const store = tx.objectStore(STORE_SONGS);
    const req = store.get(id);

    req.onsuccess = () => {
      const song = req.result as Song | undefined;
      resolve(song?.audioBlob || null);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes a song from IndexedDB by ID
 */
export async function deleteSong(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SONGS], 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears all songs from library
 */
export async function clearAllSongs(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SONGS], 'readwrite');
    const store = tx.objectStore(STORE_SONGS);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Storage quota estimator
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    } catch {
      return { usage: 0, quota: 0 };
    }
  }
  return { usage: 0, quota: 0 };
}

/**
 * Settings Store
 */
export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SETTINGS], 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_SETTINGS], 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.get(key);

    req.onsuccess = () => {
      if (req.result !== undefined) {
        resolve(req.result as T);
      } else {
        resolve(defaultValue);
      }
    };

    req.onerror = () => resolve(defaultValue);
  });
}
