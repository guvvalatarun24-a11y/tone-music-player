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
      {/* Top Header: Library, total count, [Shuffle All], [+ Add Songs] */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {totalSongCount} {totalSongCount === 1 ? 'song' : 'songs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {totalSongCount > 0 && (
            <button
              id="library-shuffle-all-btn"
              onClick={onShuffleAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition active:scale-95 shadow-sm"
              title="Shuffle All Songs"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle All</span>
            </button>
          )}

          <button
            id="library-add-songs-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Songs</span>
          </button>
        </div>
      </div>

      {/* 🔍 Search Bar */}
      {totalSongCount > 0 && (
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search by title, artist, or album..."
        />
      )}

      {/* Quick Filter Pills (All, Cleaned, Favorites) */}
      {totalSongCount > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition shrink-0 ${
              filterTab === 'all'
                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            All ({totalSongCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('cleaned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 shrink-0 ${
              filterTab === 'cleaned'
                ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Cleaned ({cleanedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('favorites')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1 shrink-0 ${
              filterTab === 'favorites'
                ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/40'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 shadow-xs'
            }`}
          >
            <Star className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Favorites ({favoriteCount})</span>
          </button>
        </div>
      )}

      {/* Sort row */}
      {totalSongCount > 0 && (
        <div className="flex items-center justify-between text-xs py-1 px-1 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              Sort:
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5">
              <button
                id="sort-by-date"
                onClick={() => onSortOptionChange('dateAdded')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sortOption === 'dateAdded'
                    ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Added
              </button>
              <button
                id="sort-by-title"
                onClick={() => onSortOptionChange('title')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sortOption === 'title'
                    ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Title
              </button>
              <button
                id="sort-by-artist"
                onClick={() => onSortOptionChange('artist')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  sortOption === 'artist'
                    ? 'bg-white dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Artist
              </button>
            </div>
          </div>

          <button
            id="toggle-sort-direction"
            onClick={onToggleSortDirection}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            title={`Order: ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="font-mono uppercase text-[11px]">{sortDirection}</span>
          </button>
        </div>
      )}

      {/* Song Rows List */}
      {displayedSongs.length > 0 ? (
        <div className="space-y-1.5">
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
        /* Filter or Search returned 0 matches */
        <div className="text-center py-14 px-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filterTab === 'cleaned'
              ? 'No cleaned songs yet. Select any song and tap "Clean Audio" to remove unwanted voice.'
              : filterTab === 'favorites'
              ? 'No favorite songs yet. Tap the three dots (⋮) on any song to add to favorites.'
              : `No matching songs found for "${searchQuery}"`}
          </p>
          {(searchQuery || filterTab !== 'all') && (
            <button
              onClick={() => {
                onSearchChange('');
                setFilterTab('all');
              }}
              className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Empty Library State */
        <div
          id="empty-library-view"
          className="text-center py-16 px-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center my-4 shadow-sm"
        >
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm dark:shadow-xl">
            <Music className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            No songs in library
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
            Add music files from your phone to start listening with smart Fisher-Yates shuffle.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <button
              id="empty-add-songs-btn"
              onClick={onOpenAddModal}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Songs</span>
            </button>

            <button
              id="empty-sample-songs-btn"
              onClick={onLoadSampleTracks}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-slate-200 dark:border-emerald-500/30 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Add Demo Tracks</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
