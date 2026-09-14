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
import { Disc3 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Global Application Toast */}
      <Toast message={activeToast} onClose={handleClearToast} />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-slate-50/85 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-900 px-4 py-3 transition-colors duration-200">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center transition-colors">
                <Disc3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 group-hover:rotate-45 transition-transform" />
              </div>
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
              <span className="text-emerald-600 dark:text-emerald-400">Tone</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-12">
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
