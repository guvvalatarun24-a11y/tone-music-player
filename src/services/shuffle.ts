import { RepeatMode } from '../types/music';

/**
 * Pure Fisher-Yates (Knuth) in-place shuffle algorithm
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Creates a freshly shuffled playlist of IDs, ensuring the first song
 * in the new cycle is NOT identical to the last played song (when length > 1).
 */
export function generateShuffleCycle(songIds: string[], lastPlayedId?: string | null): string[] {
  if (songIds.length <= 1) return [...songIds];

  const shuffled = fisherYatesShuffle(songIds);

  // Avoid consecutive repeat across cycle boundary
  if (lastPlayedId && shuffled.length > 1 && shuffled[0] === lastPlayedId) {
    // Swap index 0 with a random index > 0
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }

  return shuffled;
}

export interface ShuffleQueueState {
  queue: string[]; // Order of song IDs for current mode
  currentIndex: number; // Current pointer in queue
  isShuffle: boolean;
}

export class SmartShuffleManager {
  private libraryIds: string[] = [];
  private queue: string[] = [];
  private currentIndex: number = -1;
  private isShuffle: boolean = true;

  constructor(initialLibraryIds: string[] = [], initialShuffle: boolean = true) {
    this.isShuffle = initialShuffle;
    this.updateLibrary(initialLibraryIds);
  }

  /**
   * Updates library songs while preserving current playback position & queue.
   * Adding a new song appends it to the unplayed queue without destroying the cycle.
   * Removing a song safely purges it without shifting the current song offset.
   */
  public updateLibrary(newIds: string[], activeSongId?: string | null): void {
    this.libraryIds = [...newIds];

    if (this.libraryIds.length === 0) {
      this.queue = [];
      this.currentIndex = -1;
      return;
    }

    const currentTrackId = activeSongId || this.getCurrentTrackId();

    if (this.isShuffle) {
      // If we already have an active queue
      if (this.queue.length > 0) {
        // Filter out removed songs
        const validQueue = this.queue.filter((id) => this.libraryIds.includes(id));
        // Find newly added songs not yet in the queue
        const missingIds = this.libraryIds.filter((id) => !validQueue.includes(id));
        const shuffledMissing = fisherYatesShuffle(missingIds);

        const currentPos = currentTrackId ? validQueue.indexOf(currentTrackId) : -1;

        if (currentPos !== -1) {
          // Keep played history up to current song, and append any new songs to the unplayed portion
          const played = validQueue.slice(0, currentPos + 1);
          const remaining = validQueue.slice(currentPos + 1);
          this.queue = [...played, ...remaining, ...shuffledMissing];
          this.currentIndex = currentPos;
        } else if (validQueue.length > 0) {
          // Current song was deleted or changed; clamp index
          this.queue = [...validQueue, ...shuffledMissing];
          this.currentIndex = Math.min(Math.max(0, this.currentIndex), this.queue.length - 1);
        } else {
          this.rebuildQueue(currentTrackId);
        }
      } else {
        this.rebuildQueue(currentTrackId);
      }
    } else {
      // Normal sequential playback
      this.queue = [...this.libraryIds];
      this.currentIndex = currentTrackId ? this.queue.indexOf(currentTrackId) : 0;
      if (this.currentIndex === -1) this.currentIndex = 0;
    }
  }

  /**
   * Toggle between Shuffle and Normal playback
   */
  public setShuffle(enabled: boolean): void {
    if (this.isShuffle === enabled) return;
    this.isShuffle = enabled;

    const currentTrackId = this.getCurrentTrackId();

    if (this.isShuffle) {
      // Generate a fresh shuffle queue starting with the currently playing track
      this.rebuildQueue(currentTrackId);
    } else {
      // Revert queue to natural library order
      this.queue = [...this.libraryIds];
      this.currentIndex = currentTrackId ? this.queue.indexOf(currentTrackId) : 0;
      if (this.currentIndex === -1) this.currentIndex = 0;
    }
  }

  /**
   * Rebuilds shuffle queue with currently active song at index 0.
   * Guaranteed Fisher-Yates shuffle.
   */
  public rebuildQueue(firstSongId?: string | null): void {
    if (this.libraryIds.length === 0) {
      this.queue = [];
      this.currentIndex = -1;
      return;
    }

    if (!this.isShuffle) {
      this.queue = [...this.libraryIds];
      this.currentIndex = firstSongId ? this.queue.indexOf(firstSongId) : 0;
      if (this.currentIndex === -1) this.currentIndex = 0;
      return;
    }

    if (firstSongId && this.libraryIds.includes(firstSongId)) {
      const remainingIds = this.libraryIds.filter((id) => id !== firstSongId);
      const shuffledRest = fisherYatesShuffle(remainingIds);
      this.queue = [firstSongId, ...shuffledRest];
      this.currentIndex = 0;
    } else {
      this.queue = fisherYatesShuffle(this.libraryIds);
      this.currentIndex = 0;
    }
  }

  /**
   * Handles user tapping a song manually in Library, Search, or Queue.
   * CRITICAL FIX:
   * 1. If the selected song is ALREADY the currently active song, DO NOT rebuild or alter queue.
   * 2. If the song is already present ahead in the unplayed queue, advance to its position.
   * 3. If the song is behind (already played) or not in the remaining queue, swap it into the immediate
   *    next slot or advance to it without needlessly resetting the entire unplayed queue, or rebuild
   *    a fresh cycle starting with it.
   */
  public selectTrack(songId: string): void {
    if (!this.libraryIds.includes(songId)) return;

    // If song is already the current track, do NOT rebuild or shift position!
    if (this.getCurrentTrackId() === songId) {
      return;
    }

    if (!this.isShuffle) {
      this.currentIndex = this.queue.indexOf(songId);
      if (this.currentIndex === -1) {
        this.queue = [...this.libraryIds];
        this.currentIndex = this.queue.indexOf(songId);
      }
      return;
    }

    // In smart shuffle mode:
    // 1. Is it ahead in the current unplayed shuffle queue?
    const aheadIndex = this.queue.indexOf(songId, this.currentIndex + 1);
    if (aheadIndex !== -1) {
      this.currentIndex = aheadIndex;
      return;
    }

    // 2. Is it in the played portion behind the current pointer?
    const behindIndex = this.queue.indexOf(songId);
    if (behindIndex !== -1 && behindIndex < this.currentIndex) {
      // The user manually re-selected a previously played song in this cycle.
      // Move to that song index without destroying the rest of the queue
      this.currentIndex = behindIndex;
      return;
    }

    // 3. Fallback: If not found in queue at all, rebuild with songId first
    this.rebuildQueue(songId);
  }

  /**
   * Explicitly sets the queue pointer to a song without rebuilding
   */
  public setCurrentTrack(songId: string): void {
    if (!this.libraryIds.includes(songId)) return;
    const idx = this.queue.indexOf(songId);
    if (idx !== -1) {
      this.currentIndex = idx;
    } else {
      this.selectTrack(songId);
    }
  }

  /**
   * Removes a song directly from the active queue and library IDs
   */
  public removeTrack(songId: string): void {
    this.libraryIds = this.libraryIds.filter((id) => id !== songId);
    const removeIdx = this.queue.indexOf(songId);
    if (removeIdx !== -1) {
      this.queue.splice(removeIdx, 1);
      if (this.currentIndex > removeIdx) {
        this.currentIndex--;
      } else if (this.currentIndex >= this.queue.length) {
        this.currentIndex = this.queue.length - 1;
      }
    }
  }

  /**
   * Completely resets the shuffle manager (e.g., when library is cleared)
   */
  public reset(): void {
    this.libraryIds = [];
    this.queue = [];
    this.currentIndex = -1;
  }

  /**
   * Retrieves the ID of the current track
   */
  public getCurrentTrackId(): string | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
      return this.queue[this.currentIndex];
    }
    return null;
  }

  /**
   * Advance to the next song based on repeatMode and shuffle mode
   */
  public getNextTrack(repeatMode: RepeatMode): { songId: string | null; isNewCycle: boolean } {
    if (this.queue.length === 0) {
      return { songId: null, isNewCycle: false };
    }

    if (repeatMode === 'ONE') {
      return { songId: this.getCurrentTrackId(), isNewCycle: false };
    }

    const isLastTrack = this.currentIndex >= this.queue.length - 1;

    if (isLastTrack) {
      if (repeatMode === 'OFF') {
        // Stop playback
        return { songId: null, isNewCycle: false };
      }

      // Repeat ALL: Start new cycle!
      if (this.isShuffle) {
        const lastPlayedId = this.getCurrentTrackId();
        // Generate new Fisher-Yates cycle with no consecutive repeat
        this.queue = generateShuffleCycle(this.libraryIds, lastPlayedId);
        this.currentIndex = 0;
        return { songId: this.queue[0], isNewCycle: true };
      } else {
        // Normal sequential loop
        this.currentIndex = 0;
        return { songId: this.queue[0], isNewCycle: true };
      }
    }

    // Normal increment
    this.currentIndex++;
    return { songId: this.queue[this.currentIndex], isNewCycle: false };
  }

  /**
   * Return to the previous song
   */
  public getPreviousTrack(): string | null {
    if (this.queue.length === 0) return null;

    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.queue[this.currentIndex];
    }

    // If at index 0, wrap around to last track of queue or stay at 0
    this.currentIndex = this.queue.length - 1;
    return this.queue[this.currentIndex];
  }

  public getState(): ShuffleQueueState {
    return {
      queue: [...this.queue],
      currentIndex: this.currentIndex,
      isShuffle: this.isShuffle,
    };
  }

  public getQueuePreview(limit = 10): string[] {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) return [];
    return this.queue.slice(this.currentIndex + 1, this.currentIndex + 1 + limit);
  }
}
