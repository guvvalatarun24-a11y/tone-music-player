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
      className={`group relative flex cursor-pointer items-center justify-between rounded-[20px] border p-2.5 transition-all duration-200 ${
        isActive
          ? 'border-[#00C98B]/30 bg-[#ECFDF5] shadow-[0_10px_22px_rgba(0,201,139,0.08)]'
          : 'border-[#E5E7EB] bg-white hover:border-[#00C98B]/30 hover:bg-[#F9FAFB]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 pr-2">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
          {song.coverArt ? (
            <img src={song.coverArt} alt={song.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#00C98B]">
              <Music className="h-5 w-5" />
            </div>
          )}

          <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isActive && isPlaying ? (
              <div className="flex h-4 items-end gap-[3px]">
                <span className="h-full w-1 rounded-full bg-white animate-pulse" />
                <span className="h-2/3 w-1 rounded-full bg-white animate-pulse [animation-delay:120ms]" />
                <span className="h-4/5 w-1 rounded-full bg-white animate-pulse [animation-delay:240ms]" />
              </div>
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className={`truncate text-sm font-semibold ${isActive ? 'text-[#111111]' : 'text-[#111111]'}`}>{song.title}</h4>
            {song.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span className="truncate">{song.artist}</span>
            {song.isCleaned && <span className="rounded-full border border-[#00C98B]/20 bg-[#ECFDF5] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-[#00C98B]">Cleaned</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-1">
        <span className="text-[11px] font-mono text-[#6B7280]">{formatDuration(song.duration)}</span>
        <div className="relative" ref={menuRef}>
          <button
            id={`more-menu-btn-${song.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-xl p-2 text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111111]"
            title="Song options"
            aria-label="Song options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-30 mt-1 w-46 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-[0_16px_32px_rgba(15,23,42,0.08)]" onClick={(e) => e.stopPropagation()}>
              {onCleanAudio && (
                <button type="button" onClick={() => { setShowMenu(false); onCleanAudio(song); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#00C98B] transition hover:bg-[#ECFDF5]">
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Clean Audio</span>
                </button>
              )}
              {onToggleFavorite && (
                <button type="button" onClick={() => { setShowMenu(false); onToggleFavorite(song.id); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#111111] transition hover:bg-[#F3F4F6]">
                  <Star className={`h-3.5 w-3.5 ${song.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-[#6B7280]'}`} />
                  <span>{song.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}</span>
                </button>
              )}
              <div className="my-1 h-px bg-[#E5E7EB]" />
              <button type="button" onClick={() => { setShowMenu(false); onRemove(song.id); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50">
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
