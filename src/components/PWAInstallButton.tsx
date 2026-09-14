import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Hide if already running in standalone mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-button"
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold tracking-wide transition active:scale-95"
        title="Install Tone as an App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-ios-install-button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium transition active:scale-95"
          title="Install on iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Install on iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <Share className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                  <PlusSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2.5 text-sm font-medium text-slate-900 dark:text-white transition active:scale-98"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
