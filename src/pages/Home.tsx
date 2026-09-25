import React from 'react';
import {
  Music,
  Play,
  ChevronRight,
  Disc3,
  Sparkles,
  Shuffle,
  Heart,
  ListMusic,
  Clock3,
  Album,
  Library,
} from 'lucide-react';
import { SongMetadata, RepeatMode } from '../types/music';

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
  onShuffleAll,
  onPlaySong,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onOpenFullScreen,
  onGoToLibrary,
}) => {
  const continueListeningSong = currentSong ?? songs[0] ?? null;
  const recentlyAdded = [...songs]
    .sort((a, b) => b.dateAdded - a.dateAdded)
    .slice(0, 6);

  const artistCount = new Set(songs.map((song) => song.artist)).size;
  const albumCount = new Set(songs.map((song) => song.album)).size;
  const favoriteCount = songs.filter((song) => song.isFavorite).length;
  const hasRealPlayHistory = false;

  const quickActions = [
    {
      label: 'Shuffle All',
      caption: 'Play a fresh random mix',
      icon: Shuffle,
      onClick: onShuffleAll,
    },
    {
      label: 'Favorites',
      caption: `${favoriteCount} saved tracks`,
      icon: Heart,
      onClick: onGoToLibrary,
    },
    {
      label: 'Library',
      caption: 'Open your full collection',
      icon: ListMusic,
      onClick: onGoToLibrary,
    },
    {
      label: 'Recent',
      caption: 'Latest additions',
      icon: Clock3,
      onClick: onGoToLibrary,
    },
  ];

  const browseCards = [
    { label: 'Songs', count: songs.length, icon: Music, onClick: onGoToLibrary },
    { label: 'Artists', count: artistCount, icon: Sparkles, onClick: onGoToLibrary },
    { label: 'Albums', count: albumCount, icon: Album, onClick: onGoToLibrary },
    { label: 'Favorites', count: favoriteCount, icon: Heart, onClick: onGoToLibrary },
  ];

  return (
    <div className="w-full max-w-[1200px] pb-28 text-slate-900">
      <div className="mx-auto w-full overflow-x-hidden rounded-[28px] border border-[#E5E7EB] bg-[#F6F7F5] p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-5">
        {continueListeningSong ? (
          <section className="mb-6 rounded-[24px] border border-[#E5E7EB] bg-white p-3 shadow-[0_12px_24px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#6B7280]">Continue listening</p>
              <button
                type="button"
                onClick={() => onPlaySong(continueListeningSong.id)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#111111] transition hover:text-[#00C98B]"
              >
                Open <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-[#F3F4F6] sm:h-28 sm:w-28">
                {continueListeningSong.coverArt ? (
                  <img src={continueListeningSong.coverArt} alt={continueListeningSong.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#F3F4F6] text-[#00C98B]">
                    <Disc3 className="h-9 w-9" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold tracking-[-0.04em] text-[#111111]">
                  {continueListeningSong.title}
                </p>
                <p className="mt-1 truncate text-sm text-[#6B7280]">{continueListeningSong.artist}</p>
                {continueListeningSong.album && continueListeningSong.album !== 'Unknown Album' && (
                  <p className="mt-1 truncate text-xs text-[#6B7280]">{continueListeningSong.album}</p>
                )}

                <button
                  type="button"
                  onClick={() => onPlaySong(continueListeningSong.id)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#00C98B] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_22px_rgba(0,201,139,0.22)] transition hover:bg-[#00b67d]"
                >
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                  Continue
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-6 rounded-[24px] border border-dashed border-[#D1D5DB] bg-white p-6 text-center shadow-[0_12px_24px_rgba(15,23,42,0.03)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-[#00C98B]">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold text-[#111111]">Your library is ready</p>
            <p className="mt-2 text-sm text-[#6B7280]">Add songs to start building your collection.</p>
          </section>
        )}

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-[-0.04em] text-[#111111]">Recently Added</h3>
            <button type="button" onClick={onGoToLibrary} className="text-sm font-medium text-[#111111] transition hover:text-[#00C98B]">
              See all
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
            {recentlyAdded.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => onPlaySong(song.id)}
                className="w-28 shrink-0 rounded-[18px] border border-[#E5E7EB] bg-white p-2 text-left shadow-[0_10px_18px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-[#00C98B]/50"
              >
                <div className="mb-2 aspect-square overflow-hidden rounded-[14px] bg-[#F3F4F6]">
                  {song.coverArt ? (
                    <img src={song.coverArt} alt={song.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#00C98B]">
                      <Music className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-[#111111]">{song.title}</p>
                <p className="mt-1 truncate text-[11px] text-[#6B7280]">{song.artist}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-[-0.04em] text-[#111111]">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ label, caption, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="flex min-h-[84px] flex-col items-start justify-between rounded-[20px] border border-[#E5E7EB] bg-white p-3 text-left shadow-[0_10px_18px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-[#00C98B]/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF5] text-[#00C98B]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{label}</p>
                  <p className="mt-1 text-[11px] text-[#6B7280]">{caption}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {!hasRealPlayHistory && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-[-0.04em] text-[#111111]">Browse Your Music</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {browseCards.map(({ label, count, icon: Icon, onClick }) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="flex min-h-[96px] flex-col justify-between rounded-[20px] border border-[#E5E7EB] bg-white p-3 text-left shadow-[0_10px_18px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-[#00C98B]/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#00C98B]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{label}</p>
                    <p className="mt-1 text-[11px] text-[#6B7280]">{count} {count === 1 ? 'item' : 'items'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
