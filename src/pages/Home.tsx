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
  Play,
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
    <div className="space-y-5 pb-28">
      <div className="rounded-[28px] border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.84)_35%,rgba(2,6,23,0.96))] p-4 shadow-[0_25px_70px_rgba(16,185,129,0.12)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-200/80">Good evening</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-white">Tone</h2>
          </div>
          <button
            id="home-search-nav-btn"
            onClick={onGoToLibrary}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-emerald-400/50 hover:text-emerald-200"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-[22px] border border-white/15 bg-slate-900/60 shadow-[0_18px_40px_rgba(2,6,23,0.8)]">
            {currentSong?.coverArt ? (
              <img src={currentSong.coverArt} alt={currentSong.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.38),rgba(15,23,42,0.8))] text-emerald-200">
                <Disc3 className="h-10 w-10" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">Now spinning</p>
            <h3 className="mt-1 truncate text-xl font-bold text-white">
              {currentSong ? currentSong.title : 'Ready to play'}
            </h3>
            <p className="mt-1 truncate text-sm text-slate-300">
              {currentSong ? currentSong.artist : 'Your offline library is waiting'}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={currentSong ? onTogglePlay : onGoToLibrary}
                className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                {currentSong ? (isPlaying ? 'Pause' : 'Play') : 'Browse'}
              </button>
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {isPlaying ? 'live' : 'standby'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentSong ? (
        <div id="home-now-playing-section" className="rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-[0_20px_45px_rgba(2,6,23,0.55)]">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-400">
            <span className="flex items-center gap-2 text-emerald-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              {isPlaying ? 'playing now' : 'paused'}
            </span>
            <button onClick={onOpenFullScreen} className="transition hover:text-white">Expand</button>
          </div>

          <div onClick={onOpenFullScreen} className="flex cursor-pointer items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-[20px] border border-white/10 bg-slate-800 shadow-[0_18px_35px_rgba(2,6,23,0.75)]">
              {currentSong.coverArt ? (
                <img src={currentSong.coverArt} alt={currentSong.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-emerald-300">
                  <Music className="h-9 w-9" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-bold text-white">{currentSong.title}</h3>
                {currentSong.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
              </div>
              <p className="truncate text-sm text-slate-300">{currentSong.artist}</p>
              {currentSong.album && currentSong.album !== 'Unknown Album' && (
                <p className="mt-1 truncate text-xs text-slate-400">{currentSong.album}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
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
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-8 text-center shadow-[0_20px_45px_rgba(2,6,23,0.5)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <Disc3 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Your offline library</h3>
          <p className="mt-2 text-sm text-slate-400">
            {songCount > 0
              ? 'Tap shuffle to begin your next session.'
              : 'Add songs to build your Tone collection.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Favorites', value: songs.filter((song) => song.isFavorite).length },
          { label: 'Playlists', value: 0 },
          { label: 'Recently Played', value: Math.min(12, songs.length) },
          { label: 'All Songs', value: songCount },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.label === 'All Songs' ? onGoToLibrary : undefined}
            className="rounded-[22px] border border-white/10 bg-slate-900/80 p-3 text-left shadow-[0_12px_26px_rgba(2,6,23,0.35)] transition hover:border-emerald-400/30 hover:bg-slate-800/80"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
            <div className="mt-3 text-2xl font-black tracking-[-0.06em] text-white">{item.value}</div>
          </button>
        ))}
      </div>

      {songCount > 0 && (
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-4 shadow-[0_20px_45px_rgba(2,6,23,0.55)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Recently added</p>
              <h3 className="mt-1 text-lg font-bold text-white">Your Library</h3>
            </div>
            <button onClick={onGoToLibrary} className="text-xs font-medium text-emerald-300">View all</button>
          </div>

          <div className="space-y-2">
            {recentlyAdded.map((song) => (
              <div key={song.id} onClick={() => onPlaySong(song.id)} className="flex cursor-pointer items-center gap-3 rounded-[18px] border border-white/8 bg-slate-950/40 p-2 transition hover:border-emerald-400/30 hover:bg-slate-800/70">
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-slate-800">
                  {song.coverArt ? (
                    <img src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-emerald-300">
                      <Music className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{song.title}</p>
                  <p className="truncate text-xs text-slate-400">{song.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onPlaySong(song.id); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-slate-950 transition hover:bg-emerald-400"
                >
                  <Play className="ml-0.5 h-4 w-4 fill-slate-950" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
