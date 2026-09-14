import React, { useState } from 'react';
import {
  Sliders,
  Repeat,
  Shuffle,
  HardDrive,
  Trash2,
  ShieldCheck,
  Check,
  AlertTriangle,
  Scissors,
  Sparkles,
} from 'lucide-react';
import { RepeatMode, StorageStats } from '../types/music';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface SettingsProps {
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  storageStats: StorageStats;
  onClearLibrary: () => Promise<void>;
  theme: 'dark' | 'light' | 'system';
  onThemeChange: (theme: 'dark' | 'light' | 'system') => void;
  keepOriginalFiles: boolean;
  onToggleKeepOriginalFiles: (val: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  shuffleEnabled,
  repeatMode,
  onToggleShuffle,
  onCycleRepeat,
  storageStats,
  onClearLibrary,
  theme,
  onThemeChange,
  keepOriginalFiles,
  onToggleKeepOriginalFiles,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    setIsClearing(true);
    await onClearLibrary();
    setIsClearing(false);
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Title */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Playback preferences, audio cleanup rules, and local storage
        </p>
      </div>

      {/* PLAYBACK PREFERENCES */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Playback
          </h2>
        </div>

        {/* Shuffle by default */}
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Shuffle by default</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Play your music in true randomized Fisher-Yates order
            </p>
          </div>
          <button
            id="settings-shuffle-toggle"
            type="button"
            onClick={onToggleShuffle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              shuffleEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                shuffleEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Repeat Mode */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Repeat mode</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Queue progression behavior at playlist conclusion
            </p>
          </div>
          <button
            id="settings-repeat-mode-btn"
            type="button"
            onClick={onCycleRepeat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-750 transition"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>
              {repeatMode === 'ONE'
                ? 'Repeat ONE'
                : repeatMode === 'ALL'
                ? 'Repeat ALL'
                : 'Repeat OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* AUDIO CLEANUP PREFERENCES */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Audio Cleanup
          </h2>
        </div>

        {/* Keep original files toggle */}
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Keep original files</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Never overwrite or delete original songs when generating cleaned copies
            </p>
          </div>
          <button
            id="settings-keep-original-toggle"
            type="button"
            onClick={() => onToggleKeepOriginalFiles(!keepOriginalFiles)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              keepOriginalFiles ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                keepOriginalFiles ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Cleanup behavior info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Cleaned versions are tagged with <span className="text-emerald-700 dark:text-emerald-300 font-semibold">✨ Cleaned</span> in your library. They can be shuffled, repeated, and played offline just like any other song.
          </p>
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Appearance
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['dark', 'light', 'system'] as const).map((mode) => (
            <button
              key={mode}
              id={`theme-btn-${mode}`}
              type="button"
              onClick={() => onThemeChange(mode)}
              className={`py-2.5 px-3 rounded-2xl border text-xs font-medium capitalize flex items-center justify-center gap-1.5 transition ${
                theme === mode
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {theme === mode && <Check className="w-3.5 h-3.5" />}
              <span>{mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STORAGE MANAGEMENT */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Storage
          </h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs text-slate-500 dark:text-slate-400">Songs in library:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {storageStats.songCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs text-slate-500 dark:text-slate-400">Browser storage usage:</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {storageStats.usageFormatted}
            </span>
          </div>

          {storageStats.quotaBytes > 0 && (
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span className="text-xs text-slate-500 dark:text-slate-400">Browser storage quota:</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {storageStats.quotaFormatted}
              </span>
            </div>
          )}

          {storageStats.quotaBytes > 0 && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (storageStats.usageBytes / storageStats.quotaBytes) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Clear All Songs Button */}
        <div className="pt-2">
          <button
            id="clear-all-songs-btn"
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={storageStats.songCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Library</span>
          </button>
        </div>
      </div>

      {/* PWA INSTALL CARD */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Offline PWA</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Install to phone home screen for standalone offline player
          </p>
        </div>
        <PWAInstallButton />
      </div>

      {/* PRIVACY & CLIENT-SIDE REALITY */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 p-5 space-y-2 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Local Storage & Device Privacy</span>
        </div>
        <p className="leading-relaxed">
          Tone operates completely client-side in your phone's browser. Audio files and cleaned versions are stored in IndexedDB on this device and are never uploaded to any cloud server.
        </p>
      </div>

      {/* ABOUT APP */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 space-y-1">
        <p className="font-semibold text-slate-600 dark:text-slate-300">Tone v1.2.0</p>
        <p>Offline-First Smart Shuffle Music Player with Local Audio Cleanup</p>
      </div>

      {/* CLEAR CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Clear Library?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to remove all {storageStats.songCount} songs from your local Tone library? This cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="cancel-clear-btn"
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
              >
                Cancel
              </button>

              <button
                id="confirm-remove-all-btn"
                type="button"
                onClick={handleClearAll}
                disabled={isClearing}
                className="py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95 disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
