import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Volume2,
  VolumeX,
  Music,
  ListMusic,
  Disc,
  MoreVertical,
  Scissors,
  Star,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { SongMetadata, RepeatMode } from '../types/music';
import { PlayerControls } from './PlayerControls';
import { formatDuration } from '../services/metadata';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSong: SongMetadata | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  queuePreview: string[];
  allSongs: SongMetadata[];
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSelectSong: (songId: string) => void;
  onCleanAudio?: (song: SongMetadata) => void;
  onToggleFavorite?: (songId: string) => void;
  onRemoveSong?: (songId: string) => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  repeatMode,
  shuffleEnabled,
  queuePreview,
  allSongs,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onSetVolume,
  onToggleShuffle,
  onCycleRepeat,
  onSelectSong,
  onCleanAudio,
  onToggleFavorite,
  onRemoveSong,
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [preMuteVolume, setPreMuteVolume] = useState(volume);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close more menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  if (!isOpen || !currentSong) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      onSetVolume(preMuteVolume || 0.8);
      setIsMuted(false);
    } else {
      setPreMuteVolume(volume);
      onSetVolume(0);
      setIsMuted(true);
    }
  };

  const queueSongs = queuePreview
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is SongMetadata => s !== undefined);

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      id="fullscreen-player-modal"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[var(--app-bg)] text-[var(--text-main)] transition-colors duration-300"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-100">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#00C98B]/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#00C98B]/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-between px-5 pb-8 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            id="close-fullscreen-player"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-95"
            title="Minimize Player"
          >
            <ChevronDown className="h-5 w-5" />
          </button>

          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Now Playing
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  shuffleEnabled ? 'bg-[#00D084]' : 'bg-slate-500'
                }`}
              />
              <span>{shuffleEnabled ? 'Smart Shuffle' : 'Normal Order'}</span>
            </div>
          </div>

          <div className="relative flex items-center gap-1" ref={menuRef}>
            <button
              id="toggle-queue-view"
              onClick={() => setShowQueue(!showQueue)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
                showQueue
                  ? 'border-[#00C98B]/30 bg-[#ECFDF5] text-[#00C98B]'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#00C98B]/30 hover:text-[#00C98B]'
              }`}
              title="Toggle Shuffle Queue"
            >
              <ListMusic className="h-4 w-4" />
            </button>

            <button
              id="fullscreen-more-menu-btn"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
                showMoreMenu
                  ? 'border-[#00C98B]/30 bg-[#ECFDF5] text-[#00C98B]'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#00C98B]/30 hover:text-[#00C98B]'
              }`}
              title="More Options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-[0_18px_38px_rgba(15,23,42,0.1)]">
                {onCleanAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onCleanAudio(currentSong);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#00C98B] transition hover:bg-[#ECFDF5]"
                  >
                    <Scissors className="h-4 w-4 text-[#00D084]" />
                    <span>Clean Audio</span>
                  </button>
                )}

                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onToggleFavorite(currentSong.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F3F4F6]"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        currentSong.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {currentSong.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                    </span>
                  </button>
                )}

                {onRemoveSong && (
                  <>
                    <div className="my-1 h-px bg-white/10" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        onRemoveSong(currentSong.id);
                        onClose();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove from Library</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="my-auto py-6">
          {!showQueue ? (
            <div className="flex flex-col items-center">
              <div className="relative flex h-[58vw] max-h-[420px] min-h-[260px] w-[82vw] max-w-[420px] items-center justify-center px-2 py-2">
                <div
                  className={`absolute inset-4 rounded-full border-[10px] border-[var(--border)] bg-[var(--surface)] shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-transform duration-500 ${
                    isPlaying ? 'animate-[spin_7s_linear_infinite]' : ''
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-[var(--border)]">
                    <div className="flex h-[42%] w-[42%] items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)]">
                      <div className="h-3 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_14px_rgba(0,201,139,0.9)]" />
                    </div>
                  </div>
                </div>

                <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.18)] ring-1 ring-[var(--border)]">
                  {currentSong.coverArt ? (
                    <img
                      src={currentSong.coverArt}
                      alt={currentSong.title}
                      className="h-full w-full rounded-[22px] object-contain bg-[var(--surface-strong)]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-[22px] bg-[radial-gradient(circle_at_top,_rgba(0,201,139,0.14),transparent_35%),linear-gradient(135deg,#F5F7F8,#EEF9F4_60%,#EAF8F1)]">
                      <Music className="mb-2 h-16 w-16 text-[#00C98B]" />
                      <Disc className={`h-8 w-8 text-[#00C98B] ${isPlaying ? 'animate-spin' : ''}`} />
                    </div>
                  )}

                  <div className="absolute inset-2 rounded-[22px] bg-gradient-to-tr from-[#071A1F]/30 via-transparent to-white/10" />

                  {currentSong.isCleaned && (
                    <div className="absolute right-5 top-5 flex items-center gap-1 rounded-full border border-[var(--accent)]/20 bg-[var(--surface)]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] shadow-lg backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                      Cleaned
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 w-full px-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="max-w-full truncate text-[22px] font-semibold leading-snug tracking-[-0.03em] text-[var(--text-main)] sm:text-[24px]">
                    {currentSong.title}
                  </h2>
                  {currentSong.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                </div>
                <p className="mt-2 text-base font-medium text-[var(--accent)]">{currentSong.artist}</p>
                {currentSong.album && currentSong.album !== 'Unknown Album' && (
                  <p className="mt-1 truncate text-sm text-[var(--text-muted)]">{currentSong.album}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-[58vw] max-h-[420px] min-h-[260px] w-full flex-col rounded-[28px] border border-white/10 bg-[#0b252b]/80 p-4 shadow-[0_20px_40px_rgba(1,12,17,0.7)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2 text-[#00C98B]">
                  <ListMusic className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                    Queue
                  </span>
                </div>
                <span className="text-[11px] text-[#6B7280]">{shuffleEnabled ? 'Smart Shuffle' : 'Sequential'}</span>
              </div>

              <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
                {queueSongs.length > 0 ? (
                  queueSongs.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      onClick={() => onSelectSong(song.id)}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2.5 transition hover:bg-white/8"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-4 shrink-0 text-right text-[10px] text-slate-400">{index + 1}</span>
                        <div className="h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-[#071A1F]">
                          {song.coverArt ? (
                            <img src={song.coverArt} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Music className="m-2 h-4 w-4 text-[#00D084]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#111111]">{song.title}</p>
                          <p className="truncate text-[11px] text-[#6B7280]">{song.artist}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] text-[#6B7280]">{formatDuration(song.duration)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-[#6B7280]">
                    <Disc className="mb-2 h-8 w-8 text-[#6B7280]" />
                    <p className="text-sm font-medium text-[#111111]">End of current cycle</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {repeatMode !== 'OFF' ? 'A fresh shuffle cycle will start.' : 'Playback will stop at the end.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 pt-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.2em] text-[#6B7280]">
              <span>Current</span>
              <span>Duration</span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-0 right-0 h-2 rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#00C98B] shadow-[0_0_12px_rgba(0,201,139,0.45)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                id="fullscreen-audio-progress-slider"
                type="range"
                min="0"
                max={duration || 100}
                step="0.5"
                value={currentTime}
                onChange={handleSliderChange}
                className="relative z-10 h-2 w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="flex items-center justify-between font-mono text-sm tabular-nums text-[#6B7280]">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          <PlayerControls
            isPlaying={isPlaying}
            shuffleEnabled={shuffleEnabled}
            repeatMode={repeatMode}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrevious={onPrevious}
            onToggleShuffle={onToggleShuffle}
            onCycleRepeat={onCycleRepeat}
            size="large"
          />

          <div className="flex items-center gap-3 px-2 pt-1">
            <button
              onClick={handleVolumeToggle}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111111] transition hover:border-[#00C98B] hover:text-[#00C98B]"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-[#00D084]" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              id="fullscreen-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setIsMuted(v === 0);
                onSetVolume(v);
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E5E7EB] accent-[#00C98B]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
