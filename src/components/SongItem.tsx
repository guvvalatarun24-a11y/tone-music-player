import React, { useState, useRef, useEffect } from 'react';
import { Play, MoreVertical, Scissors, Star, Trash2, Music, Sparkles } from 'lucide-react';
import { SongMetadata } from '../types/music';
import { formatDuration } from '../services/metadata';

interface SongItemProps {
  song: SongMetadata;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: (songId: string) => void;
  onRemove: (songId: string) => void;
  onCleanAudio?: (song: SongMetadata) => void;
  onToggleFavorite?: (songId: string) => void;
}

export const SongItem: React.FC<SongItemProps> = ({
  song,
  isActive,
  isPlaying,
  onPlay,
  onRemove,
  onCleanAudio,
  onToggleFavorite,
}) => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      id={`song-row-${song.id}`}
      onClick={() => onPlay(song.id)}
      className={`group relative flex items-center justify-between p-2.5 px-3 rounded-2xl cursor-pointer transition-all duration-150 border ${
        isActive
          ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(16,185,129,0.08)]'
          : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700/80 text-slate-700 dark:text-slate-300 shadow-sm'
      }`}
    >
      {/* Artwork + Info */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/5 flex items-center justify-center">
          {song.coverArt ? (
            <img
              src={song.coverArt}
              alt=""
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Music className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          )}

          {/* Active / hover play icon overlay */}
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isActive && isPlaying ? (
              <div className="flex items-end gap-[3px] h-3.5">
                <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                <span className="w-1 bg-emerald-300 rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.15s] h-2/3" />
                <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.75s_ease-in-out_infinite_0.3s] h-4/5" />
              </div>
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4
              className={`text-sm font-semibold truncate leading-snug ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
              }`}
            >
              {song.title}
            </h4>
            {song.isFavorite && (
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            <span className="truncate">{song.artist}</span>
            {song.isCleaned && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cleaned</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Duration + Three-dot Menu */}
      <div className="flex items-center gap-2 shrink-0 pl-1">
        <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
          {formatDuration(song.duration)}
        </span>

        {/* ⋮ More Button */}
        <div className="relative" ref={menuRef}>
          <button
            id={`more-menu-btn-${song.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition active:scale-95"
            title="Song options"
            aria-label="Song options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Popover Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 z-30 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 p-1.5 shadow-xl dark:shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clean Audio option */}
              {onCleanAudio && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onCleanAudio(song);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 transition text-left"
                >
                  <Scissors className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Clean Audio</span>
                </button>
              )}

              {/* Add to / Remove from Favorites */}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleFavorite(song.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      song.isFavorite
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{song.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
                </button>
              )}

              <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

              {/* Remove from Library */}
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onRemove(song.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 transition text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Library</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
