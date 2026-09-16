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
      className={`group relative flex cursor-pointer items-center justify-between rounded-[22px] border p-2.5 transition-all duration-200 ${
        isActive
          ? 'border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.14)]'
          : 'border-white/8 bg-slate-900/80 hover:border-emerald-400/20 hover:bg-slate-800/90'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 pr-2">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-[0_8px_22px_rgba(2,6,23,0.55)]">
          {song.coverArt ? (
            <img src={song.coverArt} alt={song.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-emerald-300">
              <Music className="h-5 w-5" />
            </div>
          )}

          <div className={`absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isActive && isPlaying ? (
              <div className="flex h-4 items-end gap-[3px]">
                <span className="h-full w-1 rounded-full bg-emerald-300 animate-pulse" />
                <span className="h-2/3 w-1 rounded-full bg-emerald-300 animate-pulse [animation-delay:120ms]" />
                <span className="h-4/5 w-1 rounded-full bg-emerald-300 animate-pulse [animation-delay:240ms]" />
              </div>
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className={`truncate text-sm font-semibold ${isActive ? 'text-emerald-200' : 'text-white'}`}>{song.title}</h4>
            {song.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="truncate">{song.artist}</span>
            {song.isCleaned && <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-emerald-200">Cleaned</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-1">
        <span className="text-[11px] font-mono text-slate-400">{formatDuration(song.duration)}</span>
        <div className="relative" ref={menuRef}>
          <button
            id={`more-menu-btn-${song.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            title="Song options"
            aria-label="Song options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-30 mt-1 w-46 rounded-2xl border border-white/10 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
              {onCleanAudio && (
                <button type="button" onClick={() => { setShowMenu(false); onCleanAudio(song); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/10">
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Clean Audio</span>
                </button>
              )}
              {onToggleFavorite && (
                <button type="button" onClick={() => { setShowMenu(false); onToggleFavorite(song.id); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-white/5">
                  <Star className={`h-3.5 w-3.5 ${song.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                  <span>{song.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
                </button>
              )}
              <div className="my-1 h-px bg-white/10" />
              <button type="button" onClick={() => { setShowMenu(false); onRemove(song.id); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-300 transition hover:bg-rose-500/10">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove from Library</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
