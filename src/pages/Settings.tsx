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
    <div className="w-full space-y-6 pb-28">
      {/* Title */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
          Settings
        </h1>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          Playback preferences, audio cleanup rules, and local storage
        </p>
      </div>

      {/* PLAYBACK PREFERENCES */}
      <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 space-y-4 shadow-[0_12px_24px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
          <Sliders className="w-4 h-4 text-[#00C98B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Playback
          </h2>
        </div>

        {/* Shuffle by default */}
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-[#111111]">Shuffle by default</h3>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Play your music in true randomized Fisher-Yates order
            </p>
          </div>
          <button
            id="settings-shuffle-toggle"
            type="button"
            onClick={onToggleShuffle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              shuffleEnabled ? 'bg-[#00C98B]' : 'bg-[#E5E7EB]'
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
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-[#111111]">Repeat mode</h3>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Queue progression behavior at playlist conclusion
            </p>
          </div>
          <button
            id="settings-repeat-mode-btn"
            type="button"
            onClick={onCycleRepeat}
            className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs font-semibold text-[#00C98B] transition hover:bg-[#F3F4F6]"
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
      <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 space-y-4 shadow-[0_12px_24px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
          <Scissors className="w-4 h-4 text-[#00C98B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Audio Cleanup
          </h2>
        </div>

        {/* Keep original files toggle */}
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h3 className="text-sm font-semibold text-[#111111]">Keep original files</h3>
            <p className="mt-0.5 text-xs text-[#6B7280]">
              Never overwrite or delete original songs when generating cleaned copies
            </p>
          </div>
          <button
            id="settings-keep-original-toggle"
            type="button"
            onClick={() => onToggleKeepOriginalFiles(!keepOriginalFiles)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              keepOriginalFiles ? 'bg-[#00C98B]' : 'bg-[#E5E7EB]'
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
        <div className="flex items-start gap-2.5 border-t border-[#E5E7EB] pt-2 text-xs text-[#6B7280]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#00C98B]" />
          <p className="leading-relaxed">
            Cleaned versions are tagged with <span className="font-semibold text-[#00C98B]">✨ Cleaned</span> in your library. They can be shuffled, repeated, and played offline just like any other song.
          </p>
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 space-y-4 shadow-[0_12px_24px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
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
              className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-2.5 text-xs font-medium capitalize transition ${
                theme === mode
                  ? 'border-[#00C98B]/30 bg-[#ECFDF5] text-[#00C98B] font-semibold'
                  : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6]'
              }`}
            >
              {theme === mode && <Check className="w-3.5 h-3.5" />}
              <span>{mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STORAGE MANAGEMENT */}
      <div className="rounded-3xl bg-white border border-[#E5E7EB] p-5 space-y-4 shadow-[0_12px_24px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
          <HardDrive className="w-4 h-4 text-[#00C98B]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Storage
          </h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-[#111111]">
            <span className="text-xs text-[#6B7280]">Songs in library:</span>
            <span className="font-mono font-semibold text-[#111111]">
              {storageStats.songCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#111111]">
            <span className="text-xs text-[#6B7280]">Browser storage usage:</span>
            <span className="font-mono font-semibold text-[#00C98B]">
              {storageStats.usageFormatted}
            </span>
          </div>

          {storageStats.quotaBytes > 0 && (
            <div className="flex items-center justify-between text-[#111111]">
              <span className="text-xs text-[#6B7280]">Browser storage quota:</span>
              <span className="font-mono text-xs text-[#6B7280]">
                {storageStats.quotaFormatted}
              </span>
            </div>
          )}

          {storageStats.quotaBytes > 0 && (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-full rounded-full bg-[#00C98B] transition-all duration-300"
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 active:scale-98 disabled:pointer-events-none disabled:opacity-40"
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
