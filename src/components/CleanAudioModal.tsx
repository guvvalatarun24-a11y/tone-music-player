import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Scissors,
  Check,
  AlertCircle,
  Clock,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { SongMetadata, Song } from '../types/music';
import { getSongAudioBlob, saveSong, deleteSong, QuotaExceededError } from '../services/database';
import {
  decodeAudioBlob,
  extractWaveformPeaks,
  calculateKeptIntervals,
  sliceAudioBuffer,
  audioBufferToWavBlob,
  getAudioContext,
  TrimConfig,
  CleanMode,
  analyzeAutoCleanStart,
  AutoCleanStartAnalysis,
} from '../services/audioCleaner';
import { formatDuration } from '../services/metadata';
import { WaveformTimeline } from './WaveformTimeline';

interface CleanAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongMetadata | null;
  allSongs: SongMetadata[];
  keepOriginalFiles?: boolean;
  onSongSaved: (cleanedSong: SongMetadata) => void;
  showToast: (msg: string) => void;
}

export const CleanAudioModal: React.FC<CleanAudioModalProps> = ({
  isOpen,
  onClose,
  song,
  allSongs,
  keepOriginalFiles = true,
  onSongSaved,
  showToast,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [largeFileWarning, setLargeFileWarning] = useState<boolean>(false);

  // Cleanup config
  const [mode, setMode] = useState<CleanMode>('trim-start');
  const [startTrim, setStartTrim] = useState<number>(0);
  const [endTrim, setEndTrim] = useState<number>(0);
  const [enableMiddleCut, setEnableMiddleCut] = useState<boolean>(false);
  const [middleStart, setMiddleStart] = useState<number>(0);
  const [middleEnd, setMiddleEnd] = useState<number>(0);

  // Preview playback state
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState<number>(0);
  const [isProcessingSave, setIsProcessingSave] = useState<boolean>(false);
  const [autoCleanResult, setAutoCleanResult] = useState<AutoCleanStartAnalysis | null>(null);

  // Overwrite conflict modal
  const [showReplaceDialog, setShowReplaceDialog] = useState<boolean>(false);
  const [existingCleanedSong, setExistingCleanedSong] = useState<SongMetadata | null>(null);
  const [pendingWavBlob, setPendingWavBlob] = useState<{ blob: Blob; duration: number } | null>(null);

  // Info card accordion
  const [showHonestyHelp, setShowHonestyHelp] = useState<boolean>(false);

  // Refs
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const previewStartTimeRef = useRef<number>(0);
  const previewIntervalRef = useRef<number | null>(null);
  const slicedPreviewBufferRef = useRef<AudioBuffer | null>(null);

  // Preview stop
  const stopPreview = useCallback(() => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    if (previewSourceRef.current) {
      try {
        previewSourceRef.current.stop();
        previewSourceRef.current.disconnect();
      } catch {}
      previewSourceRef.current = null;
    }
    setIsPreviewing(false);
    setPreviewCurrentTime(0);
  }, []);

  // Load and decode audio when opened
  useEffect(() => {
    if (!isOpen || !song) {
      // Reset state
      setAudioBuffer(null);
      setWaveformPeaks([]);
      setAutoCleanResult(null);
      stopPreview();
      return;
    }

    let isMounted = true;

    async function loadAudio() {
      if (!song) return;
      try {
        setIsLoading(true);
        setLoadingStatus('Retrieving offline audio file...');
        const blob = await getSongAudioBlob(song.id);
        if (!blob) {
          throw new Error('Audio data not found in local storage.');
        }

        if (!isMounted) return;
        // Warn if file is unusually large (>25MB or >10 min)
        if (blob.size > 25 * 1024 * 1024 || (song.duration && song.duration > 600)) {
          setLargeFileWarning(true);
        } else {
          setLargeFileWarning(false);
        }

        setLoadingStatus('Decoding audio waveform...');
        const buffer = await decodeAudioBlob(blob);

        if (!isMounted) return;
        setAudioBuffer(buffer);
        setWaveformPeaks(extractWaveformPeaks(buffer, 140));
        setAutoCleanResult(null);

        // Initial values
        const totalDur = buffer.duration;
        setStartTrim(0);
        setEndTrim(totalDur);
        setMiddleStart(Math.floor(totalDur * 0.4));
        setMiddleEnd(Math.floor(totalDur * 0.4) + Math.min(8, Math.floor(totalDur * 0.1)));
        setEnableMiddleCut(false);
        setMode('trim-start');
      } catch (err) {
        console.error('Failed to load audio for cleaning:', err);
        showToast('Unable to decode audio for cleanup.');
        onClose();
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setLoadingStatus('');
        }
      }
    }

    loadAudio();

    return () => {
      isMounted = false;
      stopPreview();
    };
  }, [isOpen, song]);

  const totalDuration = audioBuffer ? audioBuffer.duration : song?.duration || 0;

  // Mode changes preset helper
  const handleModeChange = (newMode: CleanMode) => {
    setMode(newMode);
    if (!audioBuffer) return;
    const dur = audioBuffer.duration;

    if (newMode === 'trim-start') {
      setStartTrim(startTrim > 0 ? startTrim : Math.min(5, dur * 0.1));
      setEndTrim(dur);
      setEnableMiddleCut(false);
    } else if (newMode === 'trim-end') {
      setStartTrim(0);
      setEndTrim(endTrim < dur ? endTrim : Math.max(0, dur - Math.min(5, dur * 0.1)));
      setEnableMiddleCut(false);
    } else if (newMode === 'trim-both') {
      setStartTrim(startTrim > 0 ? startTrim : Math.min(4, dur * 0.08));
      setEndTrim(endTrim < dur ? endTrim : Math.max(0, dur - Math.min(4, dur * 0.08)));
      setEnableMiddleCut(false);
    } else if (newMode === 'remove-middle') {
      setStartTrim(0);
      setEndTrim(dur);
      setEnableMiddleCut(true);
      if (middleEnd <= middleStart) {
        setMiddleStart(Math.floor(dur * 0.3));
        setMiddleEnd(Math.floor(dur * 0.3) + 8);
      }
    } else if (newMode === 'custom') {
      setEnableMiddleCut(true);
    }
    stopPreview();
  };

  const handleReset = () => {
    setStartTrim(0);
    setEndTrim(totalDuration);
    setEnableMiddleCut(false);
    setMiddleStart(0);
    setMiddleEnd(0);
    setAutoCleanResult(null);
    setMode('trim-start');
    stopPreview();
  };

  const handleAutoCleanStart = useCallback(async () => {
    if (!audioBuffer) return;

    setIsLoading(true);
    setLoadingStatus('Analyzing only the first 90 seconds for a safe intro cut...');

    try {
      const result = analyzeAutoCleanStart(audioBuffer);
      setAutoCleanResult(result);
      setStartTrim(result.startTrim);
      setMode('trim-start');
      setEnableMiddleCut(false);
      stopPreview();

      if (result.confidence === 'high' && result.startTrim > 0) {
        showToast(`Detected start: ${formatDuration(result.detectedStartTime)}`);
      } else {
        showToast('No safe automatic cut detected.');
      }
    } catch (error) {
      console.error('Auto clean start analysis failed:', error);
      setAutoCleanResult(null);
      showToast('Unable to analyze the start of this track.');
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  }, [audioBuffer, showToast, stopPreview]);

  const currentConfig: TrimConfig = {
    startTrim,
    endTrim,
    enableMiddleCut,
    middleStart,
    middleEnd,
  };

  // Toggle preview of cleaned audio
  const handleTogglePreview = async () => {
    if (isPreviewing) {
      stopPreview();
      return;
    }

    if (!audioBuffer) return;

    try {
      const sliced = sliceAudioBuffer(audioBuffer, currentConfig);
      slicedPreviewBufferRef.current = sliced;

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = sliced;
      source.connect(ctx.destination);

      previewSourceRef.current = source;
      previewStartTimeRef.current = ctx.currentTime;
      setIsPreviewing(true);

      source.onended = () => {
        setIsPreviewing(false);
        setPreviewCurrentTime(0);
      };

      source.start();

      previewIntervalRef.current = window.setInterval(() => {
        if (!source || !sliced) return;
        const elapsed = ctx.currentTime - previewStartTimeRef.current;
        if (elapsed >= sliced.duration) {
          stopPreview();
        } else {
          setPreviewCurrentTime(elapsed);
        }
      }, 100);
    } catch (err: unknown) {
      console.error('Preview error:', err);
      showToast('Could not preview cleaned audio. Check trim bounds.');
      stopPreview();
    }
  };

  // Save cleaned version
  const handleSaveCleanVersion = async () => {
    if (!audioBuffer || !song) return;

    stopPreview();
    setIsProcessingSave(true);

    try {
      // 1. Slice buffer
      const sliced = sliceAudioBuffer(audioBuffer, currentConfig);
      // 2. Encode to WAV
      const wavBlob = audioBufferToWavBlob(sliced);

      // 3. Check if cleaned version already exists in library for this song
      const existing = allSongs.find(
        (s) =>
          s.originalSongId === song.id ||
          (s.isCleaned && s.title.toLowerCase().startsWith(song.title.toLowerCase()))
      );

      if (existing) {
        setExistingCleanedSong(existing);
        setPendingWavBlob({ blob: wavBlob, duration: sliced.duration });
        setShowReplaceDialog(true);
        setIsProcessingSave(false);
        return;
      }

      await executeSaveCleanedSong(wavBlob, sliced.duration, false);
    } catch (err: unknown) {
      console.error('Error saving cleaned song:', err);
      showToast('Failed to process clean audio version.');
      setIsProcessingSave(false);
    }
  };

  const executeSaveCleanedSong = async (blob: Blob, newDuration: number, replaceExisting: boolean) => {
    if (!song) return;
    setIsProcessingSave(true);
    try {
      let targetId: string;
      if (replaceExisting && existingCleanedSong) {
        targetId = existingCleanedSong.id;
      } else if (!keepOriginalFiles && !song.isCleaned) {
        // If the user disabled 'Keep Original Files', replace the original song safely
        // by overwriting the same IndexedDB record after the clean file has been prepared.
        targetId = song.id;
      } else {
        targetId = `song_clean_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }

      const cleanTitle = song.title.includes('(Cleaned)')
        ? song.title
        : `${song.title} (Cleaned)`;

      const newSong: Song = {
        id: targetId,
        title: cleanTitle,
        artist: song.artist,
        album: song.album,
        duration: Math.round(newDuration),
        filename: `${song.filename.replace(/\.[^/.]+$/, '')}_cleaned.wav`,
        size: blob.size,
        type: 'audio/wav',
        dateAdded: Date.now(),
        coverArt: song.coverArt,
        isCleaned: true,
        originalSongId: keepOriginalFiles ? song.id : undefined,
        isFavorite: song.isFavorite,
        audioBlob: blob,
      };

      await saveSong(newSong);
      onSongSaved(newSong);
      showToast(`✨ Saved: ${cleanTitle}`);
      setShowReplaceDialog(false);
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      if (err instanceof QuotaExceededError) {
        showToast('Storage quota exceeded. Free up browser storage before saving.');
      } else {
        showToast('Error saving song to storage.');
      }
    } finally {
      setIsProcessingSave(false);
    }
  };

  if (!isOpen || !song) return null;

  // Kept intervals calculation for timeline coloring
  const keptIntervals = calculateKeptIntervals(currentConfig, totalDuration);
  const effectiveNewDuration = keptIntervals.reduce((acc, i) => acc + (i.end - i.start), 0);

  return (
    <div
      id="clean-audio-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Clean Audio</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30">
                  Local Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Remove unwanted spoken voice & speech sections</p>
            </div>
          </div>

          <button
            id="close-clean-audio-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Song Overview */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="min-w-0 pr-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{song.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{song.artist}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                Original: {formatDuration(song.duration)}
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Cleaned: {formatDuration(effectiveNewDuration)}
              </div>
            </div>
          </div>

          {/* Large File Warning Banner */}
          {largeFileWarning && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-0.5 leading-relaxed">
                <span className="font-semibold">Large Audio File Detected</span>
                <p className="text-amber-700/90 dark:text-amber-300/80 text-[11px]">
                  This file is larger than 25MB or over 10 minutes long. Processing and waveform decoding may take extra time in your browser.
                </p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{loadingStatus}</p>
            </div>
          ) : (
            <>
              {/* Mode Tabs */}
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2 block">
                  Select Cleanup Target:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => handleModeChange('trim-start')}
                    className={`py-2 px-2.5 rounded-xl font-medium transition text-center ${
                      mode === 'trim-start'
                        ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Trim Start (Intro)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('trim-end')}
                    className={`py-2 px-2.5 rounded-xl font-medium transition text-center ${
                      mode === 'trim-end'
                        ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Trim End (Outro)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('trim-both')}
                    className={`py-2 px-2.5 rounded-xl font-medium transition text-center ${
                      mode === 'trim-both'
                        ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Start + End
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('remove-middle')}
                    className={`py-2 px-2.5 rounded-xl font-medium transition text-center ${
                      mode === 'remove-middle'
                        ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Cut Middle
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-emerald-700 dark:text-emerald-300">
                      Auto Clean Start
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Analyzes only the first 90 seconds and trims only a clear silent intro.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoCleanStart}
                    disabled={isLoading || isProcessingSave}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Analyzing…' : 'Auto Clean Start'}
                  </button>
                </div>

                {autoCleanResult && (
                  <div
                    className={`rounded-xl border px-3 py-2 text-[11px] ${
                      autoCleanResult.confidence === 'high'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {autoCleanResult.confidence === 'high' && autoCleanResult.startTrim > 0
                      ? `Detected start: ${formatDuration(autoCleanResult.detectedStartTime)}`
                      : 'No safe automatic cut detected.'}
                  </div>
                )}
              </div>

              {/* Waveform Visualization Box */}
              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    Kept Music Section
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500/60" />
                    Removed Speech Section
                  </span>
                </div>

                {/* High-Resolution Interactive Canvas Waveform */}
                <WaveformTimeline
                  peaks={waveformPeaks}
                  totalDuration={totalDuration}
                  config={currentConfig}
                  onChangeConfig={(newCfg) => {
                    setStartTrim(newCfg.startTrim);
                    setEndTrim(newCfg.endTrim);
                    setMiddleStart(newCfg.middleStart);
                    setMiddleEnd(newCfg.middleEnd);
                    stopPreview();
                  }}
                  previewTime={previewCurrentTime}
                  isPreviewing={isPreviewing}
                  height={115}
                />
              </div>

              {/* Trim Controls */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800/80">
                {/* Start Trim Input / Slider */}
                {(mode === 'trim-start' || mode === 'trim-both' || mode === 'custom') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Start Trim (Cut audio before):
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatDuration(startTrim)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(endTrim - 1, totalDuration)}
                        step="0.5"
                        value={startTrim}
                        onChange={(e) => {
                          setStartTrim(parseFloat(e.target.value));
                          stopPreview();
                        }}
                        className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-400"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setStartTrim((prev) => Math.max(0, prev - 1));
                            stopPreview();
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
                        >
                          -1s
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStartTrim((prev) => Math.min(endTrim - 1, prev + 1));
                            stopPreview();
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
                        >
                          +1s
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* End Trim Input / Slider */}
                {(mode === 'trim-end' || mode === 'trim-both' || mode === 'custom') && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        End Trim (Cut audio after):
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {formatDuration(endTrim)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={Math.max(0, startTrim + 1)}
                        max={totalDuration}
                        step="0.5"
                        value={endTrim}
                        onChange={(e) => {
                          setEndTrim(parseFloat(e.target.value));
                          stopPreview();
                        }}
                        className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-400"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEndTrim((prev) => Math.max(startTrim + 1, prev - 1));
                            stopPreview();
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
                        >
                          -1s
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEndTrim((prev) => Math.min(totalDuration, prev + 1));
                            stopPreview();
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent"
                        >
                          +1s
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Middle Cut Controls */}
                {(mode === 'remove-middle' || mode === 'custom') && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>Cut Out Middle Section:</span>
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                          [{formatDuration(middleStart)} → {formatDuration(middleEnd)}]
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 dark:text-slate-400">Section Start:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min={startTrim}
                            max={middleEnd - 0.5}
                            step="0.5"
                            value={middleStart}
                            onChange={(e) => {
                              setMiddleStart(parseFloat(e.target.value));
                              stopPreview();
                            }}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 dark:accent-rose-400"
                          />
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 shrink-0">
                            {formatDuration(middleStart)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 dark:text-slate-400">Section End:</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min={middleStart + 0.5}
                            max={endTrim}
                            step="0.5"
                            value={middleEnd}
                            onChange={(e) => {
                              setMiddleEnd(parseFloat(e.target.value));
                              stopPreview();
                            }}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 dark:accent-rose-400"
                          />
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 shrink-0">
                            {formatDuration(middleEnd)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Honesty Callout */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowHonestyHelp(!showHonestyHelp)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <Info className="w-3.5 h-3.5" />
                    <span>How Voice Cleanup Works</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                    {showHonestyHelp ? 'Hide' : 'Details'}
                  </span>
                </button>

                {showHonestyHelp && (
                  <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-2 border-t border-slate-200 dark:border-slate-800 leading-relaxed animate-in fade-in">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                      <strong>✓ Separate Voice Sections:</strong> Speeches, spoken intros, watermarks, or chatter located at the start, end, or middle are cleanly excised without altering the music.
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                      <strong>⚠ Voice Mixed into Music:</strong> If speech is recorded simultaneously on top of the instruments, simple trimming cannot remove the speech without damaging the underlying music.
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      "This voice is mixed into the music. Simple trimming cannot remove it cleanly."
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* Preview Button */}
            <button
              id="preview-cleaned-audio-btn"
              type="button"
              onClick={handleTogglePreview}
              disabled={isLoading || isProcessingSave}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                isPreviewing
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isPreviewing ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>Pause Preview ({formatDuration(previewCurrentTime)})</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-900 dark:fill-white ml-0.5" />
                  <span>▶ Preview Cleaned</span>
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              id="reset-cleanup-btn"
              type="button"
              onClick={handleReset}
              disabled={isLoading || isProcessingSave}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title="Reset Cut Points"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Save Clean Version Button */}
          <button
            id="save-clean-version-btn"
            type="button"
            onClick={handleSaveCleanVersion}
            disabled={isLoading || isProcessingSave}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
          >
            {isProcessingSave ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Processing Audio File...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Clean Version</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Replace or Save as New Dialog */}
      {showReplaceDialog && existingCleanedSong && pendingWavBlob && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cleaned Version Exists</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                A cleaned version for <strong>"{song.title}"</strong> is already in your library. How would you like to save this?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  executeSaveCleanedSong(pendingWavBlob.blob, pendingWavBlob.duration, true)
                }
                className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition active:scale-95"
              >
                Replace Existing Cleaned Song
              </button>

              <button
                type="button"
                onClick={() =>
                  executeSaveCleanedSong(pendingWavBlob.blob, pendingWavBlob.duration, false)
                }
                className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
              >
                Save as New Version
              </button>

              <button
                type="button"
                onClick={() => setShowReplaceDialog(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
