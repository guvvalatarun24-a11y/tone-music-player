import { useState, useEffect, useRef, useCallback } from 'react';
import { SongMetadata, RepeatMode } from '../types/music';
import { getSongAudioBlob, saveSetting, getSetting } from '../services/database';
import { SmartShuffleManager } from '../services/shuffle';

export interface UseAudioPlayerProps {
  songs: SongMetadata[];
  onStopPlayback?: () => void;
}

export function useAudioPlayer({ songs, onStopPlayback }: UseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [shuffleEnabled, setShuffleEnabled] = useState<boolean>(true); // Default Shuffle ON as requested
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const shuffleManagerRef = useRef<SmartShuffleManager>(new SmartShuffleManager([], true));
  const isSeekingRef = useRef<boolean>(false);
  const currentLoadRequestIdRef = useRef<number>(0);

  // Stop playback and cleanup audio completely
  const stopPlayback = useCallback(() => {
    currentLoadRequestIdRef.current++;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentSongId(null);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    if (onStopPlayback) {
      onStopPlayback();
    }
  }, [onStopPlayback]);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    // Load persisted settings
    Promise.all([
      getSetting<boolean>('shuffleEnabled', true),
      getSetting<RepeatMode>('repeatMode', 'OFF'),
      getSetting<number>('volume', 1),
      getSetting<string | null>('lastPlayedSongId', null),
    ]).then(([savedShuffle, savedRepeat, savedVolume, lastSongId]) => {
      setShuffleEnabled(savedShuffle);
      setRepeatMode(savedRepeat);
      setVolumeState(savedVolume);
      audio.volume = savedVolume;
      shuffleManagerRef.current.setShuffle(savedShuffle);

      if (lastSongId) {
        setCurrentSongId(lastSongId);
      }
    });

    return () => {
      audio.pause();
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current;
      if (!audio || !currentSongId) return;
      if (document.visibilityState === 'hidden' && !audio.paused) {
        // Keep playback active in the background; browsers handle the actual lifecycle.
        audio.play().catch(() => undefined);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentSongId]);

  // Synchronize library with shuffle manager when song list changes
  // AND handle current song deletion / library clearing
  useEffect(() => {
    const songIds = songs.map((s) => s.id);

    // If currently selected song no longer exists in library, stop playback cleanly
    if (currentSongId && !songIds.includes(currentSongId)) {
      stopPlayback();
    }

    shuffleManagerRef.current.updateLibrary(songIds, currentSongId);
  }, [songs, currentSongId, stopPlayback]);

  // Find metadata of current song
  const currentSong = songs.find((s) => s.id === currentSongId) || null;

  // Cleanup object URL utility
  const cleanupCurrentBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  // Update Media Session API
  const updateMediaSession = useCallback(
    (song: SongMetadata | null) => {
      if (!('mediaSession' in navigator) || !song) return;

      try {
        const artworkSrc = song.coverArt || '/tone-logo.png';
        const mimeType = song.coverArt?.startsWith('data:image/')
          ? song.coverArt.match(/^data:(image\/[a-zA-Z0-9.+-]+);/)?.[1] || 'image/jpeg'
          : 'image/png';

        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album,
          artwork: [
            { src: artworkSrc, sizes: '96x96', type: mimeType },
            { src: artworkSrc, sizes: '192x192', type: mimeType },
            { src: artworkSrc, sizes: '512x512', type: mimeType },
          ],
        });

        const audio = audioRef.current;
        if (audio) {
          navigator.mediaSession.setPositionState({
            duration: Number.isFinite(audio.duration) ? audio.duration : song.duration || 0,
            position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
            playbackRate: 1,
          });
        }
      } catch (e) {
        console.warn('MediaSession metadata error:', e);
      }
    },
    []
  );

  // Play a specific song ID
  const playSong = useCallback(
    async (songId: string, autoPlay = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      const targetSong = songs.find((s) => s.id === songId);
      if (!targetSong) {
        setErrorMessage('The selected song was not found in your library.');
        return;
      }

      // Track request ID to prevent race conditions from rapid clicking
      const requestId = ++currentLoadRequestIdRef.current;

      setIsLoadingAudio(true);
      setErrorMessage(null);

      try {
        const blob = await getSongAudioBlob(songId);

        // Check if another play request happened while awaiting blob
        if (requestId !== currentLoadRequestIdRef.current) {
          return;
        }

        if (!blob) {
          throw new Error('Audio file data is missing or corrupted.');
        }

        cleanupCurrentBlobUrl();

        const objectUrl = URL.createObjectURL(blob);
        currentBlobUrlRef.current = objectUrl;

        audio.src = objectUrl;
        audio.currentTime = 0;
        setCurrentTime(0);
        setCurrentSongId(songId);
        saveSetting('lastPlayedSongId', songId);

        // Tell shuffle manager about user selection
        shuffleManagerRef.current.selectTrack(songId);

        updateMediaSession(targetSong);

        if (autoPlay) {
          try {
            await audio.play();
            // Verify we are still on the same request
            if (requestId === currentLoadRequestIdRef.current) {
              setIsPlaying(true);
            }
          } catch (playErr) {
            console.warn('Autoplay prevented or interrupted:', playErr);
            if (requestId === currentLoadRequestIdRef.current) {
              setIsPlaying(false);
            }
          }
        }
      } catch (err: unknown) {
        if (requestId === currentLoadRequestIdRef.current) {
          console.error('Error loading audio:', err);
          setErrorMessage('Unable to play audio file. It may be an unsupported or corrupted format.');
          setIsPlaying(false);
        }
      } finally {
        if (requestId === currentLoadRequestIdRef.current) {
          setIsLoadingAudio(false);
        }
      }
    },
    [songs, cleanupCurrentBlobUrl, updateMediaSession]
  );

  // Next song
  const next = useCallback(() => {
    const nextResult = shuffleManagerRef.current.getNextTrack(repeatMode);
    if (nextResult.songId) {
      playSong(nextResult.songId, true);
    } else {
      // Repeat OFF and reached end of playlist
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [playSong, repeatMode]);

  // Previous song
  const previous = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3 seconds into the track, restart it first
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevId = shuffleManagerRef.current.getPreviousTrack();
    if (prevId) {
      playSong(prevId, true);
    }
  }, [playSong]);

  // Play / Pause toggle
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentSongId) {
        if (!audio.src || audio.src === '') {
          await playSong(currentSongId, true);
        } else {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (e) {
            console.warn('Play interrupted:', e);
          }
        }
      } else if (songs.length > 0) {
        // Start playing from first track in queue
        const firstId = shuffleManagerRef.current.getCurrentTrackId() || songs[0].id;
        await playSong(firstId, true);
      }
    }
  }, [isPlaying, currentSongId, songs, playSong]);

  // Shuffle All action: turn shuffle on, rebuild queue, play first song
  const shuffleAll = useCallback(async () => {
    if (songs.length === 0) return;
    setShuffleEnabled(true);
    saveSetting('shuffleEnabled', true);
    shuffleManagerRef.current.setShuffle(true);

    const songIds = songs.map((s) => s.id);
    shuffleManagerRef.current.updateLibrary(songIds);
    shuffleManagerRef.current.rebuildQueue(null);

    const firstId = shuffleManagerRef.current.getCurrentTrackId();
    if (firstId) {
      await playSong(firstId, true);
    }
  }, [songs, playSong]);

  // Toggle Shuffle state
  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((prev) => {
      const nextVal = !prev;
      saveSetting('shuffleEnabled', nextVal);
      shuffleManagerRef.current.setShuffle(nextVal);
      return nextVal;
    });
  }, []);

  // Cycle Repeat Mode (OFF -> ALL -> ONE -> OFF)
  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      let nextMode: RepeatMode;
      if (prev === 'OFF') nextMode = 'ALL';
      else if (prev === 'ALL') nextMode = 'ONE';
      else nextMode = 'OFF';

      saveSetting('repeatMode', nextMode);
      return nextMode;
    });
  }, []);

  // Seek to target position (seconds)
  const seek = useCallback((targetSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = targetSeconds;
    setCurrentTime(targetSeconds);
  }, []);

  // Set Volume (0 to 1)
  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    saveSetting('volume', clamped);
  }, []);

  // Wire up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!isSeekingRef.current) {
        setCurrentTime(audio.currentTime);
      }
      if ('mediaSession' in navigator && currentSong) {
        navigator.mediaSession.setPositionState({
          duration: Number.isFinite(audio.duration) ? audio.duration : currentSong.duration || 0,
          position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
          playbackRate: 1,
        });
      }
    };

    const onDurationChange = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      // Automatic next song
      next();
    };

    const onPlay = () => {
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
        if (currentSong) {
          navigator.mediaSession.setPositionState({
            duration: Number.isFinite(audio.duration) ? audio.duration : currentSong.duration || 0,
            position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
            playbackRate: 1,
          });
        }
      }
    };

    const onPause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    };

    const onError = () => {
      setIsPlaying(false);
      setErrorMessage('Audio playback encountered an error.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [next]);

  // Register Media Session action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        previous();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        next();
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset ?? 10;
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, audio.currentTime - offset);
        setCurrentTime(audio.currentTime);
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset ?? 10;
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.min(audio.duration || audio.currentTime + offset, audio.currentTime + offset);
        setCurrentTime(audio.currentTime);
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('MediaSession action handler error:', e);
    }
  }, [togglePlay, previous, next, seek]);

  const queuePreview = shuffleManagerRef.current.getQueuePreview(6);

  return {
    isPlaying,
    currentTime,
    duration: duration || currentSong?.duration || 0,
    volume,
    repeatMode,
    shuffleEnabled,
    currentSong,
    isLoadingAudio,
    errorMessage,
    clearError: () => setErrorMessage(null),
    queuePreview,
    playSong,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
    shuffleAll,
    stopPlayback,
  };
}
