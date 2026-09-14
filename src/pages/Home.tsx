import React from 'react';
import {
  Plus,
  Shuffle,
  Music,
  Sparkles,
  Disc3,
  Clock,
  Search,
  ChevronRight,
  Disc,
  Star,
  Scissors,
  SkipForward,
  Radio,
} from 'lucide-react';
import { SongMetadata, RepeatMode } from '../types/music';
import { PlayerControls } from '../components/PlayerControls';
import { formatDuration } from '../services/metadata';

interface HomeProps {
  songs: SongMetadata[];
  currentSong: SongMetadata | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  queuePreview?: string[];
  onOpenAddModal: () => void;
  onShuffleAll: () => void;
  onPlaySong: (songId: string) => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onSeek: (time: number) => void;
  onOpenFullScreen: () => void;
  onGoToLibrary: () => void;
  onLoadSampleTracks: () => Promise<void>;
  onCleanAudio?: (song: SongMetadata) => void;
}

export const Home: React.FC<HomeProps> = ({
  songs,
  currentSong,
  isPlaying,
  currentTime,
  duration,
  shuffleEnabled,
  repeatMode,
  queuePreview = [],
  onOpenAddModal,
  onShuffleAll,
  onPlaySong,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onSeek,
  onOpenFullScreen,
  onGoToLibrary,
  onLoadSampleTracks,
  onCleanAudio,
}) => {
  const songCount = songs.length;
  // Get recently added songs (up to 5)
  const recentlyAdded = [...songs]
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 5);

  // Up next track in queue
  const nextSongId = queuePreview[0];
  const nextSong = nextSongId ? songs.find((s) => s.id === nextSongId) : null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-500 dark:text-emerald-400 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`} />
            <span>Smart Shuffle Active</span>
          </div>
        </div>

        <button
          id="home-search-nav-btn"
          onClick={onGoToLibrary}
          className="p-2 px-3.5 rounded-2xl bg-white hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition active:scale-95 flex items-center gap-2 text-xs font-semibold shadow-sm"
          title="Search your songs"
        >
          <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Search Library</span>
        </button>
      </div>

      {/* MAIN SECTION: NOW PLAYING HERO CARD */}
      {currentSong ? (
        <div
          id="home-now-playing-section"
          className="rounded-3xl bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/90 border border-slate-200 dark:border-white/[0.08] p-5 sm:p-6 shadow-xl dark:shadow-2xl relative overflow-hidden space-y-4 backdrop-blur-xl transition-colors"
        >
          {/* Subtle ambient colored glow based on playing state */}
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                {isPlaying && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>{isPlaying ? 'PLAYING NOW' : 'PAUSED'}</span>
            </span>

            <button
              onClick={onOpenFullScreen}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs font-semibold capitalize transition flex items-center gap-1 group"
            >
              <span>Expand Player</span>
              <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
            </button>
          </div>

          {/* Album Artwork & Details with Spinning Vinyl Grooves */}
          <div
            onClick={onOpenFullScreen}
            className="flex flex-col sm:flex-row items-center gap-5 cursor-pointer group"
          >
            {/* Artwork container */}
            <div className="relative w-44 h-44 sm:w-36 sm:h-36 shrink-0 flex items-center justify-center">
              {/* Vinyl record disc peeking / spinning behind */}
              <div
                className={`absolute inset-1 rounded-full bg-slate-900 dark:bg-slate-950 border-4 border-slate-800 dark:border-slate-900 shadow-xl dark:shadow-2xl transition-transform duration-500 ${
                  isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                }`}
                style={{
                  boxShadow: '0 0 25px rgba(0,0,0,0.5), inset 0 0 15px rgba(255,255,255,0.05)',
                }}
              >
                {/* Vinyl circular grooves */}
                <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center">
                  <div className="w-2/3 h-2/3 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-1/3 h-1/3 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-950" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Art square with soft shadow */}
              <div className="relative w-36 h-36 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300">
                {currentSong.coverArt ? (
                  <img
                    src={currentSong.coverArt}
                    alt={currentSong.title}
                    className="w-full h-full object-cover select-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 via-slate-200 to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40">
                    <Music className="w-10 h-10 text-emerald-600 dark:text-emerald-400/80 mb-1" />
                    <Disc className={`w-5 h-5 text-emerald-500/50 dark:text-emerald-500/40 ${isPlaying ? 'animate-spin' : ''}`} />
                  </div>
                )}

                {/* Cleaned Badge */}
                {currentSong.isCleaned && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/85 dark:bg-black/70 backdrop-blur-md border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1 shadow-md">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                    <span>Cleaned</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title, Artist & Actions */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                  {currentSong.title}
                </h3>
                {currentSong.isFavorite && (
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                )}
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                {currentSong.artist}
              </p>
              {currentSong.album && currentSong.album !== 'Unknown Album' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentSong.album}
                </p>
              )}

              {/* Clean Audio Quick Action */}
              {onCleanAudio && (
                <div className="pt-2 flex items-center justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCleanAudio(currentSong);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition active:scale-95 shadow-sm"
                  >
                    <Scissors className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Clean Audio</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 pt-1">
            <div className="relative flex items-center group">
              {/* Visual fill track */}
              <div className="absolute left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <input
                id="home-progress-slider"
                type="range"
                min="0"
                max={duration || 100}
                step="0.5"
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="flex justify-between text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 px-0.5">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Previous, Play, Next, Shuffle, Repeat Controls */}
          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
            <PlayerControls
              isPlaying={isPlaying}
              shuffleEnabled={shuffleEnabled}
              repeatMode={repeatMode}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
              onPrevious={onPrevious}
              onToggleShuffle={onToggleShuffle}
              onCycleRepeat={onCycleRepeat}
            />
          </div>
        </div>
      ) : (
        /* Empty / Initial state */
        <div className="rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.08] p-7 text-center space-y-4 backdrop-blur-xl shadow-lg dark:shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
            <Disc3 className="w-8 h-8 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Offline Music Player</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {songCount > 0
                ? 'Tap "Shuffle All" below to start playing your library in true Fisher-Yates randomized order.'
                : 'Import songs from your device to start playing 100% offline with zero repeated tracks.'}
            </p>
          </div>
        </div>
      )}

      {/* UP NEXT QUEUE PEEK STRIP (if playing and next track exists) */}
      {currentSong && nextSong && (
        <div
          onClick={onOpenFullScreen}
          className="flex items-center justify-between p-3 px-4 rounded-2xl bg-white dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-white/[0.06] cursor-pointer transition active:scale-[0.99] group shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/5 overflow-hidden">
              {nextSong.coverArt ? (
                <img src={nextSong.coverArt} alt="" className="w-full h-full object-cover" />
              ) : (
                <Music className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <SkipForward className="w-2.5 h-2.5" />
                Up Next in Shuffle
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                {nextSong.title}
                <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">· {nextSong.artist}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Skip to this song"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QUICK ACTIONS & LIBRARY OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Library Quick Actions
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              {songCount} {songCount === 1 ? 'song' : 'songs'} stored locally
            </p>
          </div>

          {songCount === 0 && (
            <button
              onClick={onLoadSampleTracks}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 flex items-center gap-1 text-xs font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Samples</span>
            </button>
          )}
        </div>

        {/* Action Buttons: [ Shuffle All ] [ + Add Songs ] */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="home-shuffle-all-btn"
            onClick={onShuffleAll}
            disabled={songCount === 0}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Shuffle className="w-4 h-4 stroke-[2.5]" />
            <span>Shuffle All ({songCount})</span>
          </button>

          <button
            id="home-add-songs-btn"
            onClick={onOpenAddModal}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-semibold text-xs transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            <span>+ Add Songs</span>
          </button>
        </div>

        {/* Recently Added List */}
        {songCount > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recently Added
                </span>
              </div>
              <button
                onClick={onGoToLibrary}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5 transition"
              >
                <span>View All ({songCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {recentlyAdded.map((song) => (
                <div
                  key={song.id}
                  onClick={() => onPlaySong(song.id)}
                  className={`flex items-center justify-between p-2.5 px-3 rounded-2xl border cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                    currentSong?.id === song.id
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                      : 'bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800/70 text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/5 flex items-center justify-center">
                      {song.coverArt ? (
                        <img
                          src={song.coverArt}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                          {song.title}
                        </p>
                        {song.isFavorite && (
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                        <span className="truncate">{song.artist}</span>
                        {song.isCleaned && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                            <Sparkles className="w-2 h-2 text-emerald-600 dark:text-emerald-400" />
                            <span>Cleaned</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {formatDuration(song.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
