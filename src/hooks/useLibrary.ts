import { useState, useEffect, useCallback, useMemo } from 'react';
import { Song, SongMetadata, SortOption, SortDirection, StorageStats } from '../types/music';
import {
  getAllSongsMetadata,
  saveSong,
  saveMultipleSongs,
  deleteSong,
  clearAllSongs,
  getStorageEstimate,
  updateSongMetadata,
  QuotaExceededError,
} from '../services/database';
import { extractMetadataFromFile } from '../services/metadata';
import { createDemoTracks } from '../services/sampleTracks';
import { filterAndValidateAudioFiles, NO_SUPPORTED_AUDIO_FILES_MESSAGE } from '../services/audioDetector';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useLibrary() {
  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('dateAdded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: '0 MB',
    quotaFormatted: '0 MB',
    songCount: 0,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Refresh storage statistics
  const updateStorageStats = useCallback(async (currentCount: number) => {
    const est = await getStorageEstimate();
    setStorageStats({
      usageBytes: est.usage,
      quotaBytes: est.quota,
      usageFormatted: formatBytes(est.usage),
      quotaFormatted: formatBytes(est.quota),
      songCount: currentCount,
    });
  }, []);

  // Fetch initial songs metadata
  const reloadLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await getAllSongsMetadata();
      setSongs(list);
      await updateStorageStats(list.length);
    } catch (err) {
      console.error('Error loading music library:', err);
      showToast('Failed to load songs from local storage.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, updateStorageStats]);

  useEffect(() => {
    reloadLibrary();
  }, [reloadLibrary]);

  // Import files selected by the user
  const addSongsFromFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setIsProcessingFiles(true);

      try {
        const { validFiles } = await filterAndValidateAudioFiles(fileList);

        if (validFiles.length === 0) {
          showToast(NO_SUPPORTED_AUDIO_FILES_MESSAGE);
          return { added: 0, skipped: 0 };
        }

        const currentSongs = await getAllSongsMetadata();
        const existingSignatures = new Set(
          currentSongs.map((s) => `${s.filename.toLowerCase()}_${s.size}`)
        );
        const existingTitles = new Set(
          currentSongs.map((s) => `${s.title.toLowerCase().trim()}_${s.artist.toLowerCase().trim()}`)
        );

        const songsToSave: Song[] = [];
        let duplicateCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
          const { file, duration, resolvedType } = validFiles[i];
          const lastMod = (file as File).lastModified || 0;
          const sig = `${file.name.toLowerCase()}_${file.size}`;
          const sigWithMod = `${file.name.toLowerCase()}_${file.size}_${lastMod}`;

          if (existingSignatures.has(sig) || existingSignatures.has(sigWithMod)) {
            duplicateCount++;
            continue;
          }

          try {
            const meta = await extractMetadataFromFile(file, duration);
            const titleArtistKey = `${meta.title.toLowerCase().trim()}_${meta.artist.toLowerCase().trim()}`;
            
            // Also check if title & artist already exist
            if (existingTitles.has(titleArtistKey)) {
              duplicateCount++;
              continue;
            }

            const songId = `song_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const newSong: Song = {
              ...meta,
              type: resolvedType || meta.type,
              id: songId,
              dateAdded: Date.now() + i, // slight staggered timestamp
              audioBlob: file,
            };

            songsToSave.push(newSong);
            existingSignatures.add(sig);
            existingTitles.add(titleArtistKey);
          } catch (fileErr) {
            console.warn(`Failed reading metadata for ${file.name}:`, fileErr);
          }
        }

        if (songsToSave.length > 0) {
          await saveMultipleSongs(songsToSave);
          const updatedList = await getAllSongsMetadata();
          setSongs(updatedList);
          await updateStorageStats(updatedList.length);

          const addedCount = songsToSave.length;
          if (duplicateCount > 0) {
            showToast(`${addedCount} song${addedCount > 1 ? 's' : ''} added (${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped).`);
          } else {
            showToast(`${addedCount} song${addedCount > 1 ? 's' : ''} added to your library.`);
          }
        } else if (duplicateCount > 0) {
          showToast(`All ${duplicateCount} selected songs are already in your library.`);
        }

        return { added: songsToSave.length, skipped: duplicateCount };
      } catch (err: unknown) {
        console.error('Error importing songs:', err);
        if (err instanceof QuotaExceededError || (err as { name?: string })?.name === 'QuotaExceededError') {
          showToast('Your browser storage is full. Remove some songs and try again.');
        } else {
          showToast('An error occurred while saving songs to your library.');
        }
        return { added: 0, skipped: 0 };
      } finally {
        setIsProcessingFiles(false);
      }
    },
    [showToast, updateStorageStats]
  );

  // Load built-in demo songs (with duplicate prevention)
  const loadSampleSongs = useCallback(async () => {
    setIsProcessingFiles(true);
    try {
      const currentSongs = await getAllSongsMetadata();
      const existingTitles = new Set(
        currentSongs.map((s) => s.title.toLowerCase().trim())
      );

      const demoTracks = await createDemoTracks();
      const tracksToSave = demoTracks.filter(
        (track) => !existingTitles.has(track.title.toLowerCase().trim())
      );

      if (tracksToSave.length === 0) {
        showToast('Sample songs are already in your library.');
        return;
      }

      await saveMultipleSongs(tracksToSave);
      const updatedList = await getAllSongsMetadata();
      setSongs(updatedList);
      await updateStorageStats(updatedList.length);

      const added = tracksToSave.length;
      const skipped = demoTracks.length - added;
      if (skipped > 0) {
        showToast(`${added} sample song${added > 1 ? 's' : ''} added (${skipped} already present).`);
      } else {
        showToast(`${added} sample songs added to your library.`);
      }
    } catch (err: unknown) {
      console.error('Error generating demo tracks:', err);
      if (err instanceof QuotaExceededError) {
        showToast('Your browser storage is full. Remove some songs and try again.');
      } else {
        showToast('Failed to generate sample songs.');
      }
    } finally {
      setIsProcessingFiles(false);
    }
  }, [showToast, updateStorageStats]);

  // Remove a single song
  const removeSong = useCallback(
    async (songId: string) => {
      try {
        await deleteSong(songId);
        const updated = songs.filter((s) => s.id !== songId);
        setSongs(updated);
        await updateStorageStats(updated.length);
        showToast('Song removed from library.');
      } catch (err) {
        console.error('Error deleting song:', err);
        showToast('Failed to remove song.');
      }
    },
    [songs, showToast, updateStorageStats]
  );

  // Clear all songs
  const clearLibrary = useCallback(async () => {
    try {
      await clearAllSongs();
      setSongs([]);
      await updateStorageStats(0);
      showToast('All songs have been removed from your library.');
    } catch (err) {
      console.error('Error clearing library:', err);
      showToast('Failed to clear library.');
    }
  }, [showToast, updateStorageStats]);

  // Filter & search songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return songs;

    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q) ||
        s.filename.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  // Sorted songs (does NOT mutate original or shuffle queue)
  const sortedSongs = useMemo(() => {
    const list = [...filteredSongs];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortOption === 'title') {
        comparison = a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortOption === 'artist') {
        comparison = a.artist.localeCompare(b.artist, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortOption === 'dateAdded') {
        comparison = a.dateAdded - b.dateAdded;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredSongs, sortOption, sortDirection]);

  // Toggle song favorite status
  const toggleFavorite = useCallback(
    async (songId: string) => {
      try {
        const target = songs.find((s) => s.id === songId);
        if (!target) return;
        const newStatus = !target.isFavorite;
        await updateSongMetadata(songId, { isFavorite: newStatus });
        const updated = songs.map((s) =>
          s.id === songId ? { ...s, isFavorite: newStatus } : s
        );
        setSongs(updated);
        showToast(newStatus ? 'Added to favorites.' : 'Removed from favorites.');
      } catch (err) {
        console.error('Failed to toggle favorite:', err);
        showToast('Error updating favorite status.');
      }
    },
    [songs, showToast]
  );

  return {
    songs: sortedSongs,
    rawSongs: songs,
    totalCount: songs.length,
    isLoading,
    isProcessingFiles,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    toastMessage,
    clearToast,
    showToast,
    storageStats,
    addSongsFromFiles,
    loadSampleSongs,
    removeSong,
    clearLibrary,
    reloadLibrary,
    toggleFavorite,
  };
}
