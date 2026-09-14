import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const isWarning = message.includes('full') || message.includes('error') || message.includes('failed');

  return (
    <div
      id="app-toast-notification"
      className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-700/80 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 shadow-2xl backdrop-blur-md max-w-sm w-[90%] transition-all animate-in fade-in slide-in-from-bottom-3"
    >
      {isWarning ? (
        <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
      )}
      <p className="flex-1 text-xs sm:text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
