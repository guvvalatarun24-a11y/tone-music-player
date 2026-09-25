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
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <button
        id="player-previous-button"
        type="button"
        onClick={onPrevious}
        disabled={disabled}
        className={`flex items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111111] transition-all duration-200 hover:border-[#00C98B] hover:text-[#00C98B] active:scale-95 disabled:opacity-40 ${
          isLarge ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-10 w-10'
        }`}
        title="Previous track"
        aria-label="Previous track"
      >
        <SkipBack className={isLarge ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4'} />
      </button>

      <button
        id="player-play-pause-button"
        type="button"
        onClick={onTogglePlay}
        disabled={disabled}
        className={`flex items-center justify-center rounded-full bg-[#00D084] text-[#071A1F] font-bold shadow-[0_16px_35px_rgba(0,208,132,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 ${
          isLarge ? 'h-16 w-16 sm:h-[72px] sm:w-[72px]' : 'h-12 w-12'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className={isLarge ? 'w-7 h-7 fill-[#071A1F]' : 'w-5 h-5 fill-[#071A1F]'} />
        ) : (
          <Play className={`${isLarge ? 'w-7 h-7 ml-1' : 'w-5 h-5 ml-0.5'} fill-[#071A1F]`} />
        )}
      </button>

      <button
        id="player-next-button"
        type="button"
        onClick={onNext}
        disabled={disabled}
        className={`flex items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111111] transition-all duration-200 hover:border-[#00C98B] hover:text-[#00C98B] active:scale-95 disabled:opacity-40 ${
          isLarge ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-10 w-10'
        }`}
        title="Next track"
        aria-label="Next track"
      >
        <SkipForward className={isLarge ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4'} />
      </button>
    </div>
  );
};
