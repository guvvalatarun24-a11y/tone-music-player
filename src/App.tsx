import { useState, useEffect } from 'react';
import { ActiveTab, SongMetadata } from './types/music';
import { useLibrary } from './hooks/useLibrary';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { Settings } from './pages/Settings';
import { BottomNavigation } from './components/BottomNavigation';
import { MiniPlayer } from './components/MiniPlayer';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { AddSongsModal } from './components/AddSongsModal';
import { CleanAudioModal } from './components/CleanAudioModal';
import { Toast } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { getSetting, saveSetting } from './services/database';
import { Disc3, Search, Settings2 } from 'lucide-react';

const BRAND_LOGO = '/tone-logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [keepOriginalFiles, setKeepOriginalFiles] = useState<boolean>(true);

  // Clean Audio Modal State
  const [isCleanModalOpen, setIsCleanModalOpen] = useState<boolean>(false);
  const [cleanTargetSong, setCleanTargetSong] = useState<SongMetadata | null>(null);

  // Library state & operations
  const library = useLibrary();

  // Audio player connected to raw un-sorted songs library
  const player = useAudioPlayer({
    songs: library.rawSongs,
    onStopPlayback: () => {
      // Clear last played song ID when library is completely emptied or current track removed
      saveSetting('lastPlayedSongId', null);
    },
  });

  // Load and apply theme and settings
  useEffect(() => {
    getSetting<'dark' | 'light' | 'system'>('theme', 'dark').then((savedTheme) => {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    });
    getSetting<boolean>('keepOriginalFiles', true).then((savedKeep) => {
      setKeepOriginalFiles(savedKeep);
    });
  }, []);

  const handleToggleKeepOriginalFiles = (val: boolean) => {
    setKeepOriginalFiles(val);
    saveSetting('keepOriginalFiles', val);
  };

  const applyTheme = (selectedTheme: 'dark' | 'light' | 'system') => {
    const root = document.documentElement;
    let isDark = false;
    if (selectedTheme === 'dark') {
      isDark = true;
    } else if (selectedTheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }

    const metaTheme = document.getElementById('meta-theme-color') || document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#020617' : '#f8fafc');
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    saveSetting('theme', newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Open Clean Audio modal for a specific song
  const handleOpenCleanAudio = (song: SongMetadata) => {
    setCleanTargetSong(song);
    setIsCleanModalOpen(true);
  };

  // After a clean song is saved
  const handleCleanSongSaved = (cleanedSong: SongMetadata) => {
    library.reloadLibrary();
  };

  const activeToast = library.toastMessage || player.errorMessage;
  const handleClearToast = () => {
    library.clearToast();
    player.clearError();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),transparent_26%),linear-gradient(180deg,#020617_0%,#020817_100%)] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Global Application Toast */}
      <Toast message={activeToast} onClose={handleClearToast} />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div
            onClick={() => setActiveTab('home')}
            className="flex cursor-pointer items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_28px_rgba(139,92,246,0.2)]">
              <img src={BRAND_LOGO} alt="Tone logo" className="h-11 w-11 object-contain" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Tone</div>
              <div className="text-sm font-semibold text-white">Your Music. Your Way.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
              aria-label="Open library"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
              aria-label="Open settings"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="mx-auto flex w-full max-w-md flex-1 px-4 pb-12 pt-4">
        {activeTab === 'home' && (
          <Home
            songs={library.songs}
            currentSong={player.currentSong}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            shuffleEnabled={player.shuffleEnabled}
            repeatMode={player.repeatMode}
            queuePreview={player.queuePreview}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onShuffleAll={player.shuffleAll}
            onPlaySong={(id) => player.playSong(id, true)}
            onTogglePlay={player.togglePlay}
            onNext={player.next}
            onPrevious={player.previous}
            onToggleShuffle={player.toggleShuffle}
            onCycleRepeat={player.cycleRepeatMode}
            onSeek={player.seek}
            onOpenFullScreen={() => setIsFullScreenOpen(true)}
            onGoToLibrary={() => setActiveTab('library')}
            onLoadSampleTracks={library.loadSampleSongs}
            onCleanAudio={handleOpenCleanAudio}
          />
        )}

        {activeTab === 'library' && (
          <Library
            songs={library.songs}
            totalSongCount={library.totalCount}
            searchQuery={library.searchQuery}
            onSearchChange={library.setSearchQuery}
            sortOption={library.sortOption}
            onSortOptionChange={library.setSortOption}
            sortDirection={library.sortDirection}
            onToggleSortDirection={() =>
              library.setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            currentSong={player.currentSong}
            isPlaying={player.isPlaying}
            onPlaySong={(id) => player.playSong(id, true)}
            onRemoveSong={library.removeSong}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onShuffleAll={player.shuffleAll}
            onLoadSampleTracks={library.loadSampleSongs}
            onCleanAudio={handleOpenCleanAudio}
            onToggleFavorite={library.toggleFavorite}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            shuffleEnabled={player.shuffleEnabled}
            repeatMode={player.repeatMode}
            onToggleShuffle={player.toggleShuffle}
            onCycleRepeat={player.cycleRepeatMode}
            storageStats={library.storageStats}
            onClearLibrary={library.clearLibrary}
            theme={theme}
            onThemeChange={handleThemeChange}
            keepOriginalFiles={keepOriginalFiles}
            onToggleKeepOriginalFiles={handleToggleKeepOriginalFiles}
          />
        )}
      </main>

      {/* Mini Player Bar (floats persistently above bottom navigation) */}
      {!isFullScreenOpen && player.currentSong && (
        <MiniPlayer
          currentSong={player.currentSong}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          onTogglePlay={player.togglePlay}
          onNext={player.next}
          onOpenFullScreen={() => setIsFullScreenOpen(true)}
        />
      )}

      {/* Full-Screen Player Modal */}
      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        currentSong={player.currentSong}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        repeatMode={player.repeatMode}
        shuffleEnabled={player.shuffleEnabled}
        queuePreview={player.queuePreview}
        allSongs={library.rawSongs}
        onTogglePlay={player.togglePlay}
        onNext={player.next}
        onPrevious={player.previous}
        onSeek={player.seek}
        onSetVolume={player.setVolume}
        onToggleShuffle={player.toggleShuffle}
        onCycleRepeat={player.cycleRepeatMode}
        onSelectSong={(songId) => player.playSong(songId, true)}
        onCleanAudio={handleOpenCleanAudio}
        onToggleFavorite={library.toggleFavorite}
        onRemoveSong={library.removeSong}
      />

      {/* Add Songs Modal */}
      <AddSongsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFiles={library.addSongsFromFiles}
        onLoadSamples={library.loadSampleSongs}
        isProcessing={library.isProcessingFiles}
      />

      {/* Clean Audio Modal */}
      <CleanAudioModal
        isOpen={isCleanModalOpen}
        onClose={() => {
          setIsCleanModalOpen(false);
          setCleanTargetSong(null);
        }}
        song={cleanTargetSong}
        allSongs={library.rawSongs}
        keepOriginalFiles={keepOriginalFiles}
        onSongSaved={handleCleanSongSaved}
        showToast={library.showToast}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        songCount={library.totalCount}
      />
    </div>
  );
}
