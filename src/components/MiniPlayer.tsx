import React from 'react';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { SongMetadata } from '../types/music';

interface MiniPlayerProps {
  currentSong: SongMetadata | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenFullScreen: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onOpenFullScreen,
}) => {
  if (!currentSong) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      id="persistent-mini-player"
      className="fixed bottom-[65px] left-0 right-0 z-30 px-3 py-1 pb-1"
    >
      <div
        onClick={onOpenFullScreen}
        className="max-w-md mx-auto bg-white/95 hover:bg-slate-50 dark:bg-slate-900/95 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-xl cursor-pointer overflow-hidden transition-all duration-200 active:scale-[0.99] group"
      >
        {/* Progress bar line along top */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-[width] duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-2.5 px-3.5 gap-3">
          {/* Cover Art / Icon */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700/50 shadow-inner flex items-center justify-center">
            {currentSong.coverArt ? (
              <img
                src={currentSong.coverArt}
                alt={currentSong.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-0.5 pointer-events-none">
                <span className="w-0.5 h-3.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-5 bg-emerald-400 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
              {currentSong.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {currentSong.artist}
            </p>
          </div>

          {/* Controls */}
          <div
            className="flex items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="mini-player-play-btn"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition active:scale-95 shadow-md shadow-emerald-500/20"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-slate-950" />
              ) : (
                <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
              )}
            </button>

            <button
              id="mini-player-next-btn"
              onClick={onNext}
              className="w-9 h-9 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 flex items-center justify-center transition active:scale-90"
              title="Next Track"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
