import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { RepeatMode } from '../types/music';

interface PlayerControlsProps {
  isPlaying: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  size?: 'normal' | 'large';
  disabled?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  shuffleEnabled,
  repeatMode,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  size = 'normal',
  disabled = false,
}) => {
  const isLarge = size === 'large';

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6">
      {/* Shuffle Button */}
      <button
        id="player-shuffle-button"
        onClick={onToggleShuffle}
        disabled={disabled}
        title={shuffleEnabled ? 'Shuffle On (Random Order)' : 'Shuffle Off (Sequential)'}
        className={`flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 active:scale-90 ${
          shuffleEnabled
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'
        }`}
        aria-label={`Shuffle ${shuffleEnabled ? 'On' : 'Off'}`}
      >
        <Shuffle className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
      </button>

      {/* Previous Button */}
      <button
        id="player-previous-button"
        onClick={onPrevious}
        disabled={disabled}
        className="flex items-center justify-center rounded-full p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition active:scale-90 disabled:opacity-40"
        title="Previous Track"
        aria-label="Previous Track"
      >
        <SkipBack className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
      </button>

      {/* Play / Pause Button - Extra Large for Touch */}
      <button
        id="player-play-pause-button"
        onClick={onTogglePlay}
        disabled={disabled}
        className={`flex items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold shadow-lg hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100 ${
          isLarge ? 'w-16 h-16 shadow-emerald-500/30' : 'w-11 h-11 shadow-emerald-500/20'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className={isLarge ? 'w-7 h-7 fill-slate-950' : 'w-5 h-5 fill-slate-950'} />
        ) : (
          <Play className={`${isLarge ? 'w-7 h-7 ml-1' : 'w-5 h-5 ml-0.5'} fill-slate-950`} />
        )}
      </button>

      {/* Next Button */}
      <button
        id="player-next-button"
        onClick={onNext}
        disabled={disabled}
        className="flex items-center justify-center rounded-full p-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition active:scale-90 disabled:opacity-40"
        title="Next Track"
        aria-label="Next Track"
      >
        <SkipForward className={isLarge ? 'w-7 h-7' : 'w-5 h-5'} />
      </button>

      {/* Repeat Button */}
      <button
        id="player-repeat-button"
        onClick={onCycleRepeat}
        disabled={disabled}
        title={
          repeatMode === 'ONE'
            ? 'Repeat One Song'
            : repeatMode === 'ALL'
            ? 'Repeat All Songs'
            : 'Repeat Off'
        }
        className={`flex items-center justify-center rounded-xl p-2.5 transition-all duration-200 active:scale-90 relative ${
          repeatMode !== 'OFF'
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-transparent'
        }`}
        aria-label={`Repeat mode: ${repeatMode}`}
      >
        {repeatMode === 'ONE' ? (
          <Repeat1 className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
        ) : (
          <Repeat className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
        )}
        {repeatMode === 'ONE' && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};
