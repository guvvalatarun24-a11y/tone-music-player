import React, { useState, useMemo } from 'react';
import {
  Plus,
  ArrowUpDown,
  Music,
  Sparkles,
  Shuffle,
  Search,
  Star,
  Scissors,
} from 'lucide-react';
import { SongMetadata, SortOption, SortDirection } from '../types/music';
import { SearchBar } from '../components/SearchBar';
import { SongItem } from '../components/SongItem';

interface LibraryProps {
  songs: SongMetadata[];
  totalSongCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: SortOption;
  onSortOptionChange: (option: SortOption) => void;
  sortDirection: SortDirection;
  onToggleSortDirection: () => void;
  currentSong: SongMetadata | null;
  isPlaying: boolean;
  onPlaySong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
  onOpenAddModal: () => void;
  onShuffleAll: () => void;
  onLoadSampleTracks: () => Promise<void>;
  onCleanAudio?: (song: SongMetadata) => void;
  onToggleFavorite?: (songId: string) => void;
}

export const Library: React.FC<LibraryProps> = ({
  songs,
  totalSongCount,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortOptionChange,
  sortDirection,
  onToggleSortDirection,
  currentSong,
  isPlaying,
  onPlaySong,
  onRemoveSong,
  onOpenAddModal,
  onShuffleAll,
  onLoadSampleTracks,
  onCleanAudio,
  onToggleFavorite,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'cleaned' | 'favorites'>('all');

  // Filter songs based on quick filter tab
  const displayedSongs = useMemo(() => {
    if (filterTab === 'cleaned') {
      return songs.filter((s) => s.isCleaned);
    }
    if (filterTab === 'favorites') {
      return songs.filter((s) => s.isFavorite);
    }
    return songs;
  }, [songs, filterTab]);

  const cleanedCount = songs.filter((s) => s.isCleaned).length;
  const favoriteCount = songs.filter((s) => s.isFavorite).length;

  return (
    <div className="space-y-4 pb-28">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.96))] p-4 shadow-[0_28px_60px_rgba(2,6,23,0.7)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Your library</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.06em] text-white">Tone</h1>
          </div>
          <div className="flex items-center gap-2">
            {totalSongCount > 0 && (
              <button
                id="library-shuffle-all-btn"
                onClick={onShuffleAll}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
              >
                Shuffle
              </button>
            )}
            <button
              id="library-add-songs-btn"
              onClick={onOpenAddModal}
              className="rounded-full bg-emerald-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
            {totalSongCount} songs
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
            Offline ready
          </div>
        </div>
      </div>

      {totalSongCount > 0 && (
        <div className="space-y-3">
          <SearchBar value={searchQuery} onChange={onSearchChange} placeholder="Search by title, artist, album..." />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              ['all', `All (${totalSongCount})`],
              ['cleaned', `Cleaned (${cleanedCount})`],
              ['favorites', `Favorites (${favoriteCount})`],
            ].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab as 'all' | 'cleaned' | 'favorites')}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  filterTab === tab
                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                    : 'border-white/10 bg-slate-900/80 text-slate-300 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Sort</span>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/60 p-1">
                {['dateAdded', 'title', 'artist'].map((opt) => (
                  <button
                    key={opt}
                    id={`sort-by-${opt}`}
                    onClick={() => onSortOptionChange(opt as SortOption)}
                    className={`rounded-full px-2 py-1 transition ${sortOption === opt ? 'bg-emerald-500/20 text-emerald-200' : 'text-slate-400'}`}
                  >
                    {opt === 'dateAdded' ? 'Added' : opt === 'title' ? 'Title' : 'Artist'}
                  </button>
                ))}
              </div>
            </div>
            <button id="toggle-sort-direction" onClick={onToggleSortDirection} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
              {sortDirection}
            </button>
          </div>
        </div>
      )}

      {displayedSongs.length > 0 ? (
        <div className="space-y-2">
          {displayedSongs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              isActive={currentSong?.id === song.id}
              isPlaying={isPlaying}
              onPlay={onPlaySong}
              onRemove={onRemoveSong}
              onCleanAudio={onCleanAudio}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : totalSongCount > 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6 text-center text-sm text-slate-300">
          No songs match your current filter.
        </div>
      ) : (
        <div id="empty-library-view" className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/70 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
            <Music className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-white">No songs in library</h3>
          <p className="mt-2 text-sm text-slate-400">Add tracks from your device to start enjoying Tone.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button id="empty-add-songs-btn" onClick={onOpenAddModal} className="rounded-full bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950">+ Add Songs</button>
            <button id="empty-sample-songs-btn" onClick={onLoadSampleTracks} className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-emerald-200">Demo tracks</button>
          </div>
        </div>
      )}
    </div>
  );
};
