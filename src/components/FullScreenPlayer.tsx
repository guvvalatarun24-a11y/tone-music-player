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
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-bottom duration-300 transition-colors"
    >
      {/* Dynamic ambient backdrop blur glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 dark:opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-indigo-600 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-full max-w-md mx-auto w-full px-6 py-6 pb-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            id="close-fullscreen-player"
            onClick={onClose}
            className="p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition active:scale-95"
            title="Minimize Player"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">
              Now Playing
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  shuffleEnabled ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-500'
                }`}
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {shuffleEnabled ? 'Smart Shuffle' : 'Normal Order'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 relative" ref={menuRef}>
            {/* Toggle Queue View */}
            <button
              id="toggle-queue-view"
              onClick={() => setShowQueue(!showQueue)}
              className={`p-2.5 rounded-full transition active:scale-95 ${
                showQueue
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 dark:bg-emerald-500/20'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'
              }`}
              title="Toggle Shuffle Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            {/* ⋮ More Menu Button */}
            <button
              id="fullscreen-more-menu-btn"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-2.5 rounded-full transition active:scale-95 ${
                showMoreMenu
                  ? 'text-emerald-600 dark:text-emerald-400 bg-slate-200 dark:bg-slate-900'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900'
              }`}
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Options */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-1.5 shadow-2xl backdrop-blur-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                {onCleanAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onCleanAudio(currentSong);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 transition text-left"
                  >
                    <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        currentSong.isFavorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>
                      {currentSong.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                    </span>
                  </button>
                )}

                {onRemoveSong && (
                  <>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        onRemoveSong(currentSong.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 transition text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove from Library</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Artwork or Queue View */}
        <div className="my-auto py-6">
          {!showQueue ? (
            <div className="flex flex-col items-center">
              {/* Artwork Container with Spinning Vinyl Peeking */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Vinyl record disc peeking / spinning behind */}
                <div
                  className={`absolute inset-2 rounded-full bg-slate-900 dark:bg-slate-950 border-4 border-slate-800 dark:border-slate-900 shadow-2xl transition-transform duration-500 ${
                    isPlaying ? 'animate-[spin_5s_linear_infinite]' : ''
                  }`}
                  style={{
                    boxShadow: '0 0 35px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-2/3 h-2/3 rounded-full border border-white/5 flex items-center justify-center">
                      <div className="w-1/3 h-1/3 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-slate-950" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artwork Box */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                  {currentSong.coverArt ? (
                    <img
                      src={currentSong.coverArt}
                      alt={currentSong.title}
                      className="w-full h-full object-cover select-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 via-slate-200 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950/40">
                      <Music className="w-16 h-16 text-emerald-600 dark:text-emerald-400/80 mb-2" />
                      <Disc
                        className={`w-7 h-7 text-emerald-500/40 ${
                          isPlaying ? 'animate-spin' : ''
                        }`}
                      />
                    </div>
                  )}

                  {/* Vinyl gloss overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />

                  {/* Cleaned Badge on artwork */}
                  {currentSong.isCleaned && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/85 dark:bg-black/60 backdrop-blur-md border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Cleaned</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Artist info */}
              <div className="w-full mt-6 text-center px-4">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                    {currentSong.title}
                  </h2>
                  {currentSong.isFavorite && (
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-base text-emerald-600 dark:text-emerald-400 font-medium mt-1 truncate">
                  {currentSong.artist}
                </p>
                {currentSong.album && currentSong.album !== 'Unknown Album' && (
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {currentSong.album}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Shuffle Queue Preview View */
            <div className="h-72 sm:h-80 w-full rounded-3xl bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 flex flex-col backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Upcoming Shuffle Queue
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {shuffleEnabled ? 'Fisher-Yates' : 'Sequential'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
                {queueSongs.length > 0 ? (
                  queueSongs.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      onClick={() => onSelectSong(song.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:border-transparent dark:hover:border-slate-700 cursor-pointer transition active:scale-98"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-4 text-right shrink-0">
                          {index + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-transparent">
                          {song.coverArt ? (
                            <img
                              src={song.coverArt}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-4 h-4 m-2 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono shrink-0">
                        {formatDuration(song.duration)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Disc className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      End of current cycle reached.
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {repeatMode !== 'OFF'
                        ? 'A new non-repeating shuffle cycle will begin automatically.'
                        : 'Playback will stop at the end.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Progress + Controls + Volume */}
        <div className="space-y-5">
          {/* Progress bar with smooth fill track */}
          <div className="space-y-1.5">
            <div className="relative flex items-center group">
              <div className="absolute left-0 right-0 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
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
                className="w-full h-2 opacity-0 cursor-pointer z-10"
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Player controls */}
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

          {/* Volume Control */}
          <div className="flex items-center gap-3 px-4 pt-1">
            <button
              onClick={handleVolumeToggle}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
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
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
